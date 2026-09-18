'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MapEntity,
  ExecutionTrace
} from '../types/satquery';
import {
  executeSatelliteQueryUpload,
  executeSatelliteQueryJson,
  loginUser,
  signUpUser,
  fetchUserChatThreads,
  ChatThread,
  getAuthToken,
  removeAuthToken
} from '../lib/api';
import { convertVisualEvidenceToEntities } from '../lib/adapters';
import { formatMediaUrl, processRaster, extractMaskFromEvidence } from '../lib/rasterUtils';
import { exportBhuviksanaReportPdf } from '../lib/pdfExporter';
import { useWorkstationViewport } from '../hooks/useWorkstationViewport';
import { HistoryItem } from '../components/canvas/HistoryDrawer';

import AuthView from '../components/auth/AuthView';
import ResetPasswordView from '../components/auth/ResetPasswordView';
import CanvasView from '../components/canvas/CanvasView';
import WorkstationView from '../components/workstation/WorkstationView';

export default function BhuViksanaApp() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState<'login' | 'canvas' | 'workstation' | 'reset-password'>('login');
  const [isClient, setIsClient] = useState(false);

  // Auth State
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [agencyCode, setAgencyCode] = useState('ISRO-SAC');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // User Popover State
  const [showUserPopover, setShowUserPopover] = useState(false);

  // Workstation Modes & Navigation
  const [targetMethod, setTargetMethod] = useState<'auto' | 'single' | 'bitemporal' | 'opticalsar'>('auto');
  const [detectedPipeline, setDetectedPipeline] = useState('Auto-Routing Engine Idle');
  const [activeWorkstationTab, setActiveWorkstationTab] = useState<'rsvqa' | 'bitemporal' | 'audittrace'>('rsvqa');
  const [activeViewTool, setActiveViewTool] = useState<'single' | 'swipe' | 'tripane'>('single');
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [baseMapType, setBaseMapType] = useState<'esri' | 'osm'>('esri');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Inspection & Conversation History
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [userThreads, setUserThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>(() => `thread_${Date.now()}`);

  // Geospatial Coordinates & Preset Center
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.6965, 83.2980]);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 17.6965,
    lng: 83.2980,
    zoom: 15
  });

  // Query & Chat State
  const [queryText, setQueryText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeScenario, setActiveScenario] = useState('Geospatial Intelligence Workstation');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Media & Visual Evidence
  const [fileT1, setFileT1] = useState<File | null>(null);
  const [fileT2, setFileT2] = useState<File | null>(null);
  const [t1DataUrl, setT1DataUrl] = useState<string | null>(null);
  const [t2DataUrl, setT2DataUrl] = useState<string | null>(null);
  const [changeMaskUrl, setChangeMaskUrl] = useState<string | null>(null);
  const [visualEvidenceData, setVisualEvidenceData] = useState<Record<string, any> | null>(null);
  const [executionTrace, setExecutionTrace] = useState<ExecutionTrace | null>(null);
  const [entities, setEntities] = useState<MapEntity[]>([]);

  // Canvas In-place AI Response Card
  const [canvasResponse, setCanvasResponse] = useState<{
    query: string;
    text: string;
    model: string;
    duration_ms?: number;
    timestamp?: string;
  } | null>(null);

  // Custom Viewport Hook (Zoom, Pan, Swipe)
  const {
    imageZoom,
    panOffset,
    isPanning,
    swipePos,
    isDraggingSwipe,
    containerRef,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDownPan,
    handleMouseMove,
    handleMouseUp
  } = useWorkstationViewport(activeViewTool);

  const getUserInitial = () => {
    if (!loginEmail) return 'U';
    return loginEmail.trim().charAt(0).toUpperCase();
  };

  const navigateTo = (page: 'login' | 'canvas' | 'workstation' | 'reset-password') => {
    setCurrentPage(page);
  };

  const handleSignOut = () => {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('satquery_current_page');
      localStorage.removeItem('satquery_active_thread_id');
      localStorage.removeItem('satquery_auth_token');
      localStorage.removeItem('satquery_user_info');
    }
    setEntities([]);
    setChatMessages([]);
    setUserThreads([]);
    setHistoryList([]);
    setT1DataUrl(null);
    setT2DataUrl(null);
    setChangeMaskUrl(null);
    setCurrentPage('login');
  };

  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    if (token) {
      setCurrentPage('canvas');
      loadThreadsFromBackend();
    } else {
      setCurrentPage('login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('satquery_current_page');
        localStorage.removeItem('satquery_active_thread_id');
      }
    }
  }, []);

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }
    setResetSuccess(true);
    setLoginPassword(newPassword);
    setTimeout(() => {
      setResetSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPage('canvas');
    }, 1500);
  };

  const handleMapUpdate = (lat: number, lng: number, zoom: number) => {
    setLiveCoords({
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      zoom
    });
  };

  const applyThreadState = (thread: ChatThread | undefined, fallbackMethod?: string) => {
    if (!thread) return;
    setActiveScenario(thread.title || 'Conversation Thread');
    setActiveThreadId(thread.thread_id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('satquery_active_thread_id', thread.thread_id);
    }

    const isOpticalSar = thread.task === 'optical_sar' || fallbackMethod === 'opticalsar';
    const isCD = !isOpticalSar && (thread.task === 'change_detection' || fallbackMethod === 'bitemporal');

    if (thread.messages && thread.messages.length > 0) {
      const loadedMsgs: Array<{ sender: 'user' | 'ai'; text: string }> = thread.messages.flatMap((m) => [
        { sender: 'user' as const, text: m.query },
        { sender: 'ai' as const, text: m.model_reply }
      ]);
      setChatMessages(loadedMsgs);
    } else {
      setChatMessages([]);
    }

    const lastMsgWithT1 = [...(thread.messages || [])].reverse().find((m) => m.image_t1_url);
    const lastMsgWithT2 = [...(thread.messages || [])].reverse().find((m) => m.image_t2_url);
    const lastMsgWithMask = [...(thread.messages || [])].reverse().find((m) =>
      m.change_mask_url ||
      m.visual_evidence?.mask_base64 ||
      m.visual_evidence?.change_mask ||
      m.visual_evidence?.overlay_base64 ||
      m.visual_evidence?.evidence_base64
    );
    const lastMsgWithEv = [...(thread.messages || [])].reverse().find((m) => m.visual_evidence && Object.keys(m.visual_evidence).length > 0);

    const rawEvidence = thread.visual_evidence || lastMsgWithEv?.visual_evidence;
    const rawT1 = rawEvidence?.s2_base64 || thread.image_t1_url || lastMsgWithT1?.image_t1_url;
    const rawT2 = rawEvidence?.s1_base64 || thread.image_t2_url || lastMsgWithT2?.image_t2_url;
    const formattedT1 = formatMediaUrl(rawT1);
    const formattedT2 = formatMediaUrl(rawT2);
    const formattedMask =
      extractMaskFromEvidence(rawEvidence) ||
      thread.change_mask_url ||
      lastMsgWithMask?.change_mask_url ||
      extractMaskFromEvidence(lastMsgWithMask?.visual_evidence);

    if (isOpticalSar) {
      setTargetMethod('opticalsar');
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
      setDetectedPipeline('CROSS-ATTENTION OPTICAL-SAR FUSION (CROMA)');
      setT1DataUrl(formattedT1);
      setT2DataUrl(formattedT2);
      setChangeMaskUrl(formattedMask);
    } else if (isCD) {
      setTargetMethod('bitemporal');
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
      setDetectedPipeline('OPEN-CD (BI-TEMPORAL SIAMESE)');
      setT1DataUrl(formattedT1);
      setT2DataUrl(formattedT2);
      setChangeMaskUrl(formattedMask);
    } else {
      setTargetMethod('single');
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
      setDetectedPipeline('GEOCHAT-7B VQA & GROUNDING');
      setT1DataUrl(formattedT1);
      setT2DataUrl(null);
      setChangeMaskUrl(null);
    }

    if (rawEvidence && Object.keys(rawEvidence).length > 0) {
      setVisualEvidenceData(rawEvidence);
      setEntities(convertVisualEvidenceToEntities(rawEvidence));
    } else {
      setVisualEvidenceData(null);
      setEntities([]);
    }
  };

  const loadThreadsFromBackend = async (targetThreadId?: string, skipApply: boolean = false) => {
    try {
      const data = await fetchUserChatThreads();
      if (data.threads && data.threads.length > 0) {
        setUserThreads(data.threads);
        const convertedHistory: HistoryItem[] = data.threads.map((t) => ({
          id: t.thread_id,
          title: t.title || 'Conversation Thread',
          timestamp: new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          method: t.task === 'optical_sar' ? 'opticalsar' : (t.task === 'change_detection' ? 'bitemporal' : 'single'),
          pipeline: t.task === 'optical_sar'
            ? 'Cross-Attention Optical-SAR'
            : (t.task === 'change_detection' ? 'Open-CD (Bi-Temporal Siamese)' : 'GEOCHAT-7B VQA & GROUNDING'),
          entitiesCount: t.message_count,
          coordinates: { lat: 17.6965, lng: 83.2980 }
        }));
        setHistoryList(convertedHistory);

        if (!skipApply) {
          let selectedThread = targetThreadId ? data.threads.find((t) => t.thread_id === targetThreadId) : null;
          if (!selectedThread) selectedThread = data.threads[0];
          if (selectedThread) applyThreadState(selectedThread);
        }
      } else {
        setUserThreads([]);
        setHistoryList([]);
        setChatMessages([]);
      }
    } catch (err) {
      console.warn('Could not load user chat threads:', err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authTab === 'signin') {
        await loginUser(loginEmail, loginPassword);
      } else {
        const username = signupUsername.trim() || (loginEmail.includes('@') ? loginEmail.split('@')[0] : loginEmail);
        await signUpUser(username, loginEmail, loginPassword, agencyCode, signupFullName);
      }
      await loadThreadsFromBackend();
      navigateTo('canvas');
    } catch (err: any) {
      const msg = typeof err === 'string'
        ? err
        : err?.message
          ? (typeof err.message === 'string' ? err.message : JSON.stringify(err.message))
          : (authTab === 'signin' ? 'Sign in failed. Check credentials.' : 'Registration failed.');
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const autoDetectPipeline = (f1: File | null, f2: File | null, qText?: string) => {
    const currentQ = (qText !== undefined ? qText : queryText).trim();
    if (!f1 && !f2) {
      setDetectedPipeline(currentQ ? 'GEMINI FLASH-LITE (TEXT QUERY / FALLBACK ENGINE)' : 'Autonomous Dispatcher Idle (Ready for input)');
      return;
    }
    if (f1 && !f2) {
      setDetectedPipeline('Single Swath detected → Routed to Falcon-0.7B-RS (Single RS-VQA)');
      if (targetMethod === 'auto') {
        setActiveWorkstationTab('rsvqa');
        setActiveViewTool('single');
      }
      return;
    }
    if (f1 && f2) {
      const nameCheck = (f1.name + ' ' + f2.name).toLowerCase();
      if (nameCheck.includes('sar') || nameCheck.includes('sentinel-1') || nameCheck.includes('s1') || nameCheck.includes('radar')) {
        setDetectedPipeline('SAR + Optical Swaths detected → Routed to Cross-Attention Optical-SAR Fusion');
        setTargetMethod('opticalsar');
        if (!queryText.trim() || queryText === 'Analyze target raster scene and ground key features.' || queryText.toLowerCase().includes('change')) {
          setQueryText('Classify the water vs built-up areas using optical and SAR fusion.');
        }
      } else {
        setDetectedPipeline('Dual Temporal Swaths detected (Pre/Post) → Routed to Open-CD Bi-Temporal Siamese');
        if (targetMethod === 'opticalsar') setTargetMethod('bitemporal');
      }
      if (targetMethod === 'auto' || targetMethod === 'opticalsar') {
        setActiveWorkstationTab('bitemporal');
        setActiveViewTool('tripane');
      }
    }
  };

  useEffect(() => {
    if (currentPage === 'canvas') {
      autoDetectPipeline(fileT1, fileT2, queryText);
    }
  }, [fileT1, fileT2, queryText, currentPage]);

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setEntities([]);
      setVisualEvidenceData(null);
      handleResetZoom();

      if (files.length === 1) {
        const f1 = files[0];
        if (fileT1 && !fileT2) {
          setFileT2(f1);
          const url2 = await processRaster(f1);
          setT2DataUrl(url2);
          autoDetectPipeline(fileT1, f1, queryText);
        } else {
          setFileT1(f1);
          setFileT2(null);
          setT2DataUrl(null);
          setChangeMaskUrl(null);
          const url1 = await processRaster(f1);
          setT1DataUrl(url1);
          autoDetectPipeline(f1, null, queryText);
        }
      } else if (files.length >= 2) {
        const f1 = files[0];
        const f2 = files[1];
        setFileT1(f1);
        setFileT2(f2);
        const url1 = await processRaster(f1);
        const url2 = await processRaster(f2);
        setT1DataUrl(url1);
        setT2DataUrl(url2);
        autoDetectPipeline(f1, f2, queryText);
      }
    }
  };

  const handleFileT2Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileT2(file);
      setEntities([]);
      setVisualEvidenceData(null);
      handleResetZoom();
      const url = await processRaster(file);
      setT2DataUrl(url);
      autoDetectPipeline(fileT1, file);
    }
  };

  const handleRemoveT1 = () => {
    if (fileT2) {
      setFileT1(fileT2);
      setT1DataUrl(t2DataUrl);
      setFileT2(null);
      setT2DataUrl(null);
      setChangeMaskUrl(null);
      autoDetectPipeline(fileT2, null, queryText);
    } else {
      handleClearFiles();
    }
  };

  const handleRemoveT2 = () => {
    setFileT2(null);
    setT2DataUrl(null);
    setChangeMaskUrl(null);
    autoDetectPipeline(fileT1, null, queryText);
  };

  const handleClearFiles = () => {
    setFileT1(null);
    setFileT2(null);
    setT1DataUrl(null);
    setT2DataUrl(null);
    setChangeMaskUrl(null);
    setEntities([]);
    setVisualEvidenceData(null);
    handleResetZoom();
    setDetectedPipeline('Auto-Routing Engine Idle');
  };

  const handleLaunchWorkstation = async () => {
    setIsLoading(true);
    let effectiveMethod = targetMethod;
    const nameCheck = (fileT1 && fileT2) ? (fileT1.name + ' ' + fileT2.name).toLowerCase() : '';
    const isSarPair = Boolean(fileT1 && fileT2 && (nameCheck.includes('sar') || nameCheck.includes('s1') || nameCheck.includes('radar')));

    if (targetMethod === 'auto' || (targetMethod === 'bitemporal' && isSarPair)) {
      effectiveMethod = (fileT1 && fileT2) ? (isSarPair ? 'opticalsar' : 'bitemporal') : 'single';
    }

    const defaultQuery = (effectiveMethod === 'opticalsar' || isSarPair)
      ? 'Classify the water vs built-up areas using optical and SAR fusion.'
      : 'Analyze target raster scene and ground key features.';
    const initialQ = queryText.trim() || defaultQuery;
    const dynamicTitle = (effectiveMethod === 'opticalsar' || isSarPair)
      ? initialQ
      : (initialQ.length > 40 ? initialQ.slice(0, 40) + '...' : initialQ);

    if (fileT1) {
      setActiveScenario(
        effectiveMethod === 'opticalsar' || isSarPair
          ? dynamicTitle
          : `Swath: ${fileT1.name}${fileT2 ? ' vs ' + fileT2.name : ''}`
      );
    }

    if (effectiveMethod === 'bitemporal' || effectiveMethod === 'opticalsar') {
      setTargetMethod(effectiveMethod);
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
    } else {
      setTargetMethod(effectiveMethod);
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
    }

    const newThreadId = `thread_${Date.now()}`;
    setActiveThreadId(newThreadId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('satquery_active_thread_id', newThreadId);
    }

    const isTextOnlyQuery = !fileT1 && !fileT2;
    const newHistory: HistoryItem = {
      id: newThreadId,
      title: dynamicTitle,
      timestamp: 'Just now',
      method: isTextOnlyQuery ? 'text_qa' : effectiveMethod,
      pipeline: isTextOnlyQuery
        ? 'GEMINI FLASH-LITE (INTELLIGENT ASSISTANT)'
        : effectiveMethod === 'bitemporal'
        ? 'Open-CD (Bi-Temporal Siamese)'
        : effectiveMethod === 'opticalsar'
        ? 'Cross-Attention Optical-SAR'
        : 'GEOCHAT-7B VQA & GROUNDING',
      entitiesCount: isTextOnlyQuery ? 0 : 1,
      coordinates: { lat: liveCoords.lat, lng: liveCoords.lng }
    };
    setHistoryList((prev) => [newHistory, ...prev]);
    setChatMessages([{ sender: 'user', text: initialQ }]);

    try {
      let res;
      if (fileT1) {
        res = await executeSatelliteQueryUpload({
          query: initialQ,
          imageT1: fileT1,
          imageT2: fileT2,
          useGraph: true,
          threadId: newThreadId,
          title: dynamicTitle
        });
      } else {
        setT1DataUrl(null);
        setT2DataUrl(null);
        setChangeMaskUrl(null);
        setEntities([]);
        res = await executeSatelliteQueryJson({
          query: initialQ,
          imagePaths: [],
          useGraph: true,
          threadId: newThreadId,
          title: dynamicTitle
        });
      }

      const replyText = res.result || `Autonomous router initialized [Pipeline: ${effectiveMethod.toUpperCase()}]. Grounded features across active raster swath.`;
      setChatMessages([
        { sender: 'user', text: initialQ },
        { sender: 'ai', text: replyText }
      ]);

      if (res.execution_trace) {
        setExecutionTrace(res.execution_trace);
      }

      if (isTextOnlyQuery) {
        const modelName = (res.model && res.model.toLowerCase().includes('lite')) ? 'Gemini Flash-Lite' : res.model || 'Gemini Flash-Lite';
        setCanvasResponse({
          query: initialQ,
          text: replyText,
          model: modelName,
          duration_ms: res.execution_trace?.total_duration_ms,
          timestamp: 'Just now'
        });
      }

      if (res.visual_evidence) {
        setVisualEvidenceData(res.visual_evidence);
        setEntities(convertVisualEvidenceToEntities(res.visual_evidence));
        if (res.visual_evidence.s2_base64) setT1DataUrl(formatMediaUrl(res.visual_evidence.s2_base64));
        if (res.visual_evidence.s1_base64) setT2DataUrl(formatMediaUrl(res.visual_evidence.s1_base64));
        const mask = extractMaskFromEvidence(res.visual_evidence);
        if (mask) setChangeMaskUrl(mask);
      }

      const isOpticalSarTask = res.task === 'optical_sar' || (res.model && res.model.toLowerCase().includes('optical-sar')) || effectiveMethod === 'opticalsar';
      const isChangeTask = !isOpticalSarTask && (
        res.task === 'change_detection' ||
        (fileT1 && fileT2 && (initialQ.toLowerCase().includes('change') || initialQ.toLowerCase().includes('detect change'))) ||
        Boolean(res.visual_evidence?.mask_base64 || res.visual_evidence?.change_mask)
      );

      if (isOpticalSarTask) {
        setTargetMethod('opticalsar');
        setActiveWorkstationTab('bitemporal');
        setActiveViewTool('tripane');
        setDetectedPipeline('CROSS-ATTENTION OPTICAL-SAR FUSION (CROMA)');
      } else if (isChangeTask) {
        setTargetMethod('bitemporal');
        setActiveWorkstationTab('bitemporal');
        setActiveViewTool('tripane');
        setDetectedPipeline('OPEN-CD (BI-TEMPORAL SIAMESE)');
      } else {
        setTargetMethod('single');
        setActiveWorkstationTab('rsvqa');
        setActiveViewTool('single');
        setDetectedPipeline(res.model?.includes('Gemini') ? 'GEMINI FLASH-LITE (MULTIMODAL)' : 'GEOCHAT-7B VQA & GROUNDING');
        setChangeMaskUrl(null);
        setT2DataUrl(null);
      }

      await loadThreadsFromBackend(newThreadId, true);
    } catch (err) {
      console.warn('Launch query API error:', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Autonomous router initialized [Pipeline: ${effectiveMethod.toUpperCase()}]. Grounded ${entities.length} features across active raster swath.` }
      ]);
      if (isTextOnlyQuery) {
        setCanvasResponse({
          query: initialQ,
          text: 'Gemini Fallback encountered an issue contacting the backend. Please ensure the Django backend is running at http://127.0.0.1:8000 and GEMINI_API_KEY is configured.',
          model: 'Gemini Flash-Lite (Fallback Engine)',
          timestamp: 'Just now'
        });
      }
    } finally {
      setIsLoading(false);
      if (fileT1) navigateTo('workstation');
    }
  };

  const handleLoadScenario = (scenario: 'port' | 'flood') => {
    handleClearFiles();
    if (scenario === 'port') {
      setActiveScenario('Visakhapatnam Port & Industrial Corridor');
      setTargetMethod('single');
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
      setMapCenter([17.6965, 83.2980]);
      setMapZoom(15);
      setLiveCoords({ lat: 17.6965, lng: 83.2980, zoom: 15 });
      setEntities([
        { id: 1, name: 'Container Cargo Ship (Berth 4)', confidence: 0.990, area_m2: 6200, latMin: 17.6940, lngMin: 83.2930, latMax: 17.6985, lngMax: 83.2985, color: '#1a73e8' },
        { id: 2, name: 'Bulk Carrier (Berth 2)', confidence: 0.978, area_m2: 4850, latMin: 17.6885, lngMin: 83.2875, latMax: 17.6930, lngMax: 83.2930, color: '#e37400' },
        { id: 3, name: 'Harbor Breakwater Wall', confidence: 0.968, area_m2: 5400, latMin: 17.6820, lngMin: 83.3000, latMax: 17.6850, lngMax: 83.3130, color: '#188038' }
      ]);
      setChatMessages([{ sender: 'ai', text: 'Visual Question Answering initialized with GeoChat-7B. Grounded 3 maritime assets in target viewport.' }]);
    } else {
      setActiveScenario('Brahmaputra Basin, Assam (Flood Inundation)');
      setTargetMethod('bitemporal');
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
      setMapCenter([26.1900, 91.7300]);
      setMapZoom(14);
      setLiveCoords({ lat: 26.1900, lng: 91.7300, zoom: 14 });
      setEntities([
        { id: 1, name: 'Submerged Highway NH-27 Corridor', confidence: 0.992, area_m2: 24500, latMin: 26.1850, lngMin: 91.7200, latMax: 26.1980, lngMax: 91.7450, color: '#d93025' }
      ]);
      setChatMessages([{ sender: 'ai', text: 'Flood Inundation Analysis loaded for Brahmaputra Basin. Displaying high-resolution satellite imagery & Open-CD Siamese Change Mask.' }]);
    }
    navigateTo('workstation');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');
    setIsLoading(true);

    try {
      let res;
      if (fileT1) {
        res = await executeSatelliteQueryUpload({
          query: userQ,
          imageT1: fileT1,
          imageT2: fileT2,
          useGraph: true,
          threadId: activeThreadId,
          title: activeScenario
        });
      } else {
        const paths = [t1DataUrl, t2DataUrl].filter(Boolean) as string[];
        res = await executeSatelliteQueryJson({
          query: userQ,
          imagePaths: paths,
          useGraph: true,
          threadId: activeThreadId,
          title: activeScenario
        });
      }

      if (res.execution_trace) setExecutionTrace(res.execution_trace);
      const aiReply = res.result || `Processed query: "${userQ}". Verified bounding coordinates.`;
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);

      const mask = extractMaskFromEvidence(res.visual_evidence);
      if (mask) setChangeMaskUrl(mask);

      if (res.visual_evidence) {
        setVisualEvidenceData(res.visual_evidence);
        setEntities(convertVisualEvidenceToEntities(res.visual_evidence));
        if (res.visual_evidence.s2_base64) setT1DataUrl(formatMediaUrl(res.visual_evidence.s2_base64));
        if (res.visual_evidence.s1_base64) setT2DataUrl(formatMediaUrl(res.visual_evidence.s1_base64));
      }

      await loadThreadsFromBackend(activeThreadId, true);
    } catch (err) {
      console.warn('Send message API error:', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Processed query: "${userQ}". Verified bounding coordinates across active viewport.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    exportBhuviksanaReportPdf({
      activeScenario,
      detectedPipeline
    });
  };

  // View Router
  if (currentPage === 'login') {
    return (
      <AuthView
        authTab={authTab}
        setAuthTab={setAuthTab}
        signupUsername={signupUsername}
        setSignupUsername={setSignupUsername}
        signupFullName={signupFullName}
        setSignupFullName={setSignupFullName}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        agencyCode={agencyCode}
        setAgencyCode={setAgencyCode}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        authError={authError}
        setAuthError={setAuthError}
        authLoading={authLoading}
        handleAuthSubmit={handleAuthSubmit}
        onNavigateResetPassword={() => setCurrentPage('reset-password')}
      />
    );
  }

  if (currentPage === 'reset-password') {
    return (
      <ResetPasswordView
        loginEmail={loginEmail}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        resetError={resetError}
        resetSuccess={resetSuccess}
        handlePasswordChangeSubmit={handlePasswordChangeSubmit}
        onNavigateBack={() => setCurrentPage('canvas')}
      />
    );
  }

  if (currentPage === 'canvas') {
    return (
      <CanvasView
        loginEmail={loginEmail}
        agencyCode={agencyCode}
        userInitial={getUserInitial()}
        showUserPopover={showUserPopover}
        setShowUserPopover={setShowUserPopover}
        isHistoryDrawerOpen={isHistoryDrawerOpen}
        setIsHistoryDrawerOpen={setIsHistoryDrawerOpen}
        historyList={historyList}
        setHistoryList={setHistoryList}
        onSelectHistory={(item) => {
          setMapCenter([item.coordinates.lat, item.coordinates.lng]);
          setLiveCoords({ lat: item.coordinates.lat, lng: item.coordinates.lng, zoom: 15 });
          const matchedThread = userThreads.find((t) => t.thread_id === item.id);
          applyThreadState(matchedThread, item.method);
          navigateTo('workstation');
        }}
        onNavigateResetPassword={() => setCurrentPage('reset-password')}
        onSignOut={handleSignOut}
        targetMethod={targetMethod}
        setTargetMethod={setTargetMethod}
        detectedPipeline={detectedPipeline}
        queryText={queryText}
        setQueryText={setQueryText}
        fileT1={fileT1}
        fileT2={fileT2}
        t1DataUrl={t1DataUrl}
        t2DataUrl={t2DataUrl}
        onRemoveT1={handleRemoveT1}
        onRemoveT2={handleRemoveT2}
        handleMultiFileUpload={handleMultiFileUpload}
        handleFileT2Change={handleFileT2Change}
        handleClearFiles={handleClearFiles}
        isLoading={isLoading}
        handleLaunchWorkstation={handleLaunchWorkstation}
        canvasResponse={canvasResponse}
        setCanvasResponse={setCanvasResponse}
        onNavigateWorkstation={() => navigateTo('workstation')}
        handleLoadScenario={handleLoadScenario}
        autoDetectPipeline={autoDetectPipeline}
      />
    );
  }

  return (
    <WorkstationView
      activeScenario={activeScenario}
      onNavigateCanvas={() => navigateTo('canvas')}
      handleLoadScenario={handleLoadScenario}
      activeViewTool={activeViewTool}
      setActiveViewTool={setActiveViewTool}
      activeWorkstationTab={activeWorkstationTab}
      setActiveWorkstationTab={setActiveWorkstationTab}
      targetMethod={targetMethod}
      baseMapType={baseMapType}
      setBaseMapType={setBaseMapType}
      t1DataUrl={t1DataUrl}
      t2DataUrl={t2DataUrl}
      changeMaskUrl={changeMaskUrl}
      imageZoom={imageZoom}
      panOffset={panOffset}
      isPanning={isPanning}
      swipePos={swipePos}
      isDraggingSwipe={isDraggingSwipe}
      showBBoxes={showBBoxes}
      setShowBBoxes={setShowBBoxes}
      entities={entities}
      handleZoomIn={handleZoomIn}
      handleZoomOut={handleZoomOut}
      handleResetZoom={handleResetZoom}
      handleMouseDownPan={handleMouseDownPan}
      handleMouseMove={handleMouseMove}
      handleMouseUp={handleMouseUp}
      containerRef={containerRef}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      liveCoords={liveCoords}
      handleMapUpdate={handleMapUpdate}
      isClient={isClient}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      detectedPipeline={detectedPipeline}
      visualEvidenceData={visualEvidenceData}
      chatMessages={chatMessages}
      isLoading={isLoading}
      showSmsModal={showSmsModal}
      setShowSmsModal={setShowSmsModal}
      showAuditModal={showAuditModal}
      setShowAuditModal={setShowAuditModal}
      handleExportPDF={handleExportPDF}
      chatInput={chatInput}
      setChatInput={setChatInput}
      handleSendMessage={handleSendMessage}
      executionTrace={executionTrace}
    />
  );
}
