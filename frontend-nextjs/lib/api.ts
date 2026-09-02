import {
  QueryResponseSchema,
  RoutingDecision,
  BackendHealthResponse
} from '../types/satquery';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

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

export async function loginUser(emailOrUsername: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email_or_username: emailOrUsername, password })
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = 'Login failed';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || message;
    } catch {
      message = errorText || message;
    }
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
    let message = 'Sign up failed';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || message;
    } catch {
      message = errorText || message;
    }
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
}

/**
 * Submits a natural language query with 1 or 2 satellite rasters (T1 & optional T2) via multipart form-data.
 * Defaults to the LangGraph StateGraph pipeline (`/api/query/graph/upload`) with fallback to baseline (`/api/query/upload`).
 */
export async function executeSatelliteQueryUpload({
  query,
  imageT1,
  imageT2,
  temperature = 0.6,
  maxNewTokens = 512,
  useGraph = true
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
          useGraph: false
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
        useGraph: false
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
}

/**
 * Submits a satellite query using server-side image paths or simulated image context.
 */
export async function executeSatelliteQueryJson({
  query,
  imagePaths = [],
  temperature = 0.6,
  maxNewTokens = 512,
  useGraph = true
}: QueryJsonParams): Promise<QueryResponseSchema> {
  const endpoint = useGraph
    ? `${API_BASE_URL}/api/query/graph`
    : `${API_BASE_URL}/api/query`;

  const payload = {
    query,
    parameters: {
      images: imagePaths,
      temperature,
      max_new_tokens: maxNewTokens
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

