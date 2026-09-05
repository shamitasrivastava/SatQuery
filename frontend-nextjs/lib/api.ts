import {
  QueryResponseSchema,
  RoutingDecision,
  BackendHealthResponse
} from '../types/satquery';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// -------------------------------------------------------------
// TOKEN & AUTHENTICATION HELPERS
// -------------------------------------------------------------

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('satquery_auth_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('satquery_auth_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('satquery_auth_token');
    localStorage.removeItem('satquery_user_info');
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface UserProfileInfo {
  id: number;
  username: string;
  email: string;
  full_name: string;
  agency_code: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserProfileInfo;
}

function parseApiErrorMessage(errorText: string, fallback: string): string {
  try {
    const parsed = JSON.parse(errorText);
    if (typeof parsed.detail === 'string') {
      return parsed.detail;
    }
    if (Array.isArray(parsed.detail)) {
      return parsed.detail.map((item: any) => {
        if (typeof item === 'string') return item;
        const loc = item.loc ? item.loc.join('.') : '';
        return `${loc ? loc + ': ' : ''}${item.msg || item.message || JSON.stringify(item)}`;
      }).join(' | ');
    }
    if (typeof parsed.detail === 'object' && parsed.detail !== null) {
      return parsed.detail.msg || parsed.detail.message || JSON.stringify(parsed.detail);
    }
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    if (errorText && typeof errorText === 'string') {
      return errorText;
    }
  }
  return fallback;
}

export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email_or_username: emailOrUsername, password })
  });

  if (!res.ok) {
    const errorText = await res.text();
    const message = parseApiErrorMessage(errorText, 'Login failed');
    throw new Error(message);
  }

  const data = await res.json() as AuthResponse;
  setAuthToken(data.access_token);
  if (typeof window !== 'undefined') {
    localStorage.setItem('satquery_user_info', JSON.stringify(data.user));
  }
  return data;
}

export async function signUpUser(
  username: string,
  email: string,
  password: string,
  agencyCode: string = 'ISRO-SAC',
  fullName?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      agency_code: agencyCode,
      full_name: fullName
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    const message = parseApiErrorMessage(errorText, 'Sign up failed');
    throw new Error(message);
  }

  const data = await res.json() as AuthResponse;
  setAuthToken(data.access_token);
  if (typeof window !== 'undefined') {
    localStorage.setItem('satquery_user_info', JSON.stringify(data.user));
  }
  return data;
}

export interface ChatMessageItem {
  id: number;
  user_id: number;
  query: string;
  model_reply: string;
  task: string;
  request_id: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  user_id: number;
  total_messages: number;
  history: ChatMessageItem[];
}

export async function fetchUserChatHistory(): Promise<ChatHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat/history`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' })
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch chat history (${res.status})`);
  }

  return await res.json() as ChatHistoryResponse;
}

export async function clearUserChatHistory(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/chat/history`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Accept': 'application/json' })
  });

  if (!res.ok) {
    throw new Error(`Failed to clear chat history (${res.status})`);
  }
}

/**
 * Checks the live operational health and registered specialist models of the SatQuery AI Backend.
 */
export async function checkBackendHealth(): Promise<{
  healthy: boolean;
  data?: BackendHealthResponse;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { healthy: false, error: `Health check returned HTTP ${res.status}` };
    }

    const data = await res.json() as BackendHealthResponse;
    return { healthy: true, data };
  } catch (err) {
    return {
      healthy: false,
      error: err instanceof Error ? err.message : 'Backend unreachable'
    };
  }
}

/**
 * Classifies query intent and estimates task routing without invoking heavy GPU specialist inference.
 */
export async function classifyQuery(
  query: string,
  imageCount: number = 1,
  imageFormats: string[] = ['png']
): Promise<RoutingDecision> {
  const res = await fetch(`${API_BASE_URL}/api/classify`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
    body: JSON.stringify({
      query,
      image_count: imageCount,
      image_formats: imageFormats
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Classify API failed (${res.status}): ${errorText}`);
  }

  return await res.json() as RoutingDecision;
}

export interface QueryUploadParams {
  query: string;
  imageT1: File;
  imageT2?: File | null;
  temperature?: number;
  maxNewTokens?: number;
  useGraph?: boolean;
  threadId?: string;
  title?: string;
}

/**
 * Submits a natural language query with 1 or 2 satellite rasters (T1 & optional T2) via multipart form-data.
 * Defaults to the LangGraph StateGraph pipeline (`/api/query/graph/upload`) with fallback to baseline (`/api/query/upload`).
 */
export async function executeSatelliteQueryUpload({
  query,
  imageT1,
  imageT2,
  temperature = 0.7,
  maxNewTokens = 768,
  useGraph = true,
  threadId,
  title
}: QueryUploadParams): Promise<QueryResponseSchema> {
  const endpoint = useGraph
    ? `${API_BASE_URL}/api/query/graph/upload`
    : `${API_BASE_URL}/api/query/upload`;

  const formData = new FormData();
  formData.append('query', query);
  formData.append('image_t1', imageT1);
  if (imageT2) {
    formData.append('image_t2', imageT2);
  }
  formData.append('temperature', temperature.toString());
  formData.append('max_new_tokens', maxNewTokens.toString());
  if (threadId) formData.append('thread_id', threadId);
  if (title) formData.append('title', title);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders({ 'Accept': 'application/json' })
    });

    if (!res.ok) {
      if (useGraph) {
        console.warn('LangGraph upload failed, retrying with baseline upload endpoint...');
        return await executeSatelliteQueryUpload({
          query,
          imageT1,
          imageT2,
          temperature,
          maxNewTokens,
          useGraph: false,
          threadId,
          title
        });
      }
      const errText = await res.text();
      throw new Error(`Query upload failed (${res.status}): ${errText}`);
    }

    return await res.json() as QueryResponseSchema;
  } catch (err) {
    if (useGraph) {
      console.warn('Network error on LangGraph endpoint, trying baseline upload...');
      return await executeSatelliteQueryUpload({
        query,
        imageT1,
        imageT2,
        temperature,
        maxNewTokens,
        useGraph: false,
        threadId,
        title
      });
    }
    throw err;
  }
}

export interface QueryJsonParams {
  query: string;
  imagePaths?: string[];
  temperature?: number;
  maxNewTokens?: number;
  useGraph?: boolean;
  threadId?: string;
  title?: string;
}

/**
 * Submits a satellite query using server-side image paths or simulated image context.
 */
export async function executeSatelliteQueryJson({
  query,
  imagePaths = [],
  temperature = 0.7,
  maxNewTokens = 768,
  useGraph = true,
  threadId,
  title
}: QueryJsonParams): Promise<QueryResponseSchema> {
  const endpoint = useGraph
    ? `${API_BASE_URL}/api/query/graph`
    : `${API_BASE_URL}/api/query`;

  const payload = {
    query,
    parameters: {
      images: imagePaths,
      temperature,
      max_new_tokens: maxNewTokens,
      thread_id: threadId,
      title
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Query JSON execution failed (${res.status}): ${errText}`);
  }

  return await res.json() as QueryResponseSchema;
}

export interface MessageExchange {
  id: number;
  query: string;
  model_reply: string;
  task: string;
  request_id: string;
  image_t1_url?: string;
  image_t2_url?: string;
  change_mask_url?: string;
  visual_evidence?: Record<string, any>;
  created_at: string;
}

export interface ChatThread {
  thread_id: string;
  title: string;
  task: string;
  image_t1_url?: string;
  image_t2_url?: string;
  change_mask_url?: string;
  visual_evidence?: Record<string, any>;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages: MessageExchange[];
}

export interface ThreadedHistoryResponse {
  user_id: number;
  total_threads: number;
  threads: ChatThread[];
}

/**
 * Fetches grouped ChatGPT-style conversation threads linked to the user ID.
 */
export async function fetchUserChatThreads(): Promise<ThreadedHistoryResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  let res = await fetch(`${API_BASE_URL}/api/history/threads`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' })
  });

  if (!res.ok && res.status >= 500) {
    // Retry once after 500ms in case backend reconnected from an idle pooler drop
    await new Promise((resolve) => setTimeout(resolve, 500));
    res = await fetch(`${API_BASE_URL}/api/history/threads`, {
      method: 'GET',
      headers: getAuthHeaders({ 'Accept': 'application/json' })
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch chat threads (${res.status}): ${errText}`);
  }

  return await res.json() as ThreadedHistoryResponse;
}

