'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Home,
  UploadCloud,
  Rocket,
  ArrowLeft,
  Anchor,
  CloudRain,
  Layers,
  FileDown,
  Activity,
  Send,
  X,
  Loader2,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  MoveHorizontal,
  LogOut,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  History,
  ChevronDown,
  Cpu,
  Trash2,
  Columns3,
  Binary,
  Radio,
  PhoneCall,
  KeyRound,
  UserCheck
} from 'lucide-react';
import * as GeoTIFF from 'geotiff';
import { jsPDF } from 'jspdf';

// Dynamic SSR-safe import of Leaflet Map
const WorkstationMap = dynamic(() => import('@/components/WorkstationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center text-[#1a73e8] font-sans text-xs">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Satellite Viewport...
    </div>
  )
});

interface MapEntity {
  id: number;
  name: string;
  confidence: number;
  area_m2: number;
  latMin?: number;
  lngMin?: number;
  latMax?: number;
  lngMax?: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  color?: string;
}

interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  method: string;
  pipeline: string;
  entitiesCount: number;
  coordinates: { lat: number; lng: number };
}

export default function BhuViksanaApp() {
  const [currentPage, setCurrentPage] = useState<'login' | 'canvas' | 'workstation' | 'reset-password'>('login');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // -------------------------------------------------------------
  // AUTH STATE
  // -------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState('officer.isro@nic.in');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [agencyCode, setAgencyCode] = useState('ISRO-SAC');
  const [showPassword, setShowPassword] = useState(false);

  // USER PROFILE & PASSWORD RESET STATE
  const [showUserPopover, setShowUserPopover] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Helper: Extract initial
  const getUserInitial = () => {
    if (!loginEmail) return 'U';
    const clean = loginEmail.trim().toUpperCase();
    return clean.charAt(0);
  };

  // -------------------------------------------------------------
  // WORKSTATION & MODAL STATE
  // -------------------------------------------------------------
  const [targetMethod, setTargetMethod] = useState<'auto' | 'single' | 'bitemporal' | 'opticalsar'>('auto');
  const [detectedPipeline, setDetectedPipeline] = useState<string>('Auto-Routing Engine Idle');
  const [activeWorkstationTab, setActiveWorkstationTab] = useState<'rsvqa' | 'bitemporal' | 'audittrace'>('rsvqa');
  const [activeViewTool, setActiveViewTool] = useState<'single' | 'swipe' | 'tripane'>('single');
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [baseMapType, setBaseMapType] = useState<'esri' | 'osm'>('esri');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // EMERGENCY SMS STATE
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // History Store
  const [historyList, setHistoryList] = useState<HistoryItem[]>([
    {
      id: 'hist-1',
      title: 'Visakhapatnam Port Berth Recon',
      timestamp: 'Today, 11:42 AM',
      method: 'single',
      pipeline: 'Falcon-0.7B-RS (Single RS-VQA)',
      entitiesCount: 3,
      coordinates: { lat: 17.6965, lng: 83.2980 }
    },
    {
      id: 'hist-2',
      title: 'Assam Flood Basin Delta Inundation',
      timestamp: 'Yesterday, 04:15 PM',
      method: 'bitemporal',
      pipeline: 'Open-CD (Bi-Temporal Siamese)',
      entitiesCount: 1,
      coordinates: { lat: 26.1900, lng: 91.7300 }
    }
  ]);

  // Coordinates
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.6965, 83.2980]);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 17.6965,
    lng: 83.2980,
    zoom: 15
  });

  const [swipePos, setSwipePos] = useState<number>(50);
  const isDraggingSwipe = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [queryText, setQueryText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeScenario, setActiveScenario] = useState<string>('Custom Spatial Ingestion Swath');

  const [fileT1, setFileT1] = useState<File | null>(null);
  const [fileT2, setFileT2] = useState<File | null>(null);
  const [t1DataUrl, setT1DataUrl] = useState<string | null>(null);
  const [t2DataUrl, setT2DataUrl] = useState<string | null>(null);
  const [changeMaskUrl, setChangeMaskUrl] = useState<string | null>(null);

  const [entities, setEntities] = useState<MapEntity[]>([]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'BhuViksana Engine Initialized. Select or upload swaths to begin analysis.'
    }
  ]);

  const fileInputT1Ref = useRef<HTMLInputElement>(null);
  const fileInputT2Ref = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const handleMapUpdate = (lat?: number, lng?: number, zoom?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    setLiveCoords({
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      zoom: zoom ?? 15
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage('canvas');
  };

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

  const processRaster = async (file: File): Promise<string> => {
    if (file.name.endsWith('.tif') || file.name.endsWith('.tiff')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const width = image.getWidth();
        const height = image.getHeight();
        const rgb = (await image.readRGB({ interleave: true })) as any;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const imgData = ctx.createImageData(width, height);
          const is16Bit = !(rgb instanceof Uint8Array || rgb instanceof Uint8ClampedArray);

          for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
            const r = rgb[j];
            const g = rgb[j + 1];
            const b = rgb[j + 2];

            imgData.data[i] = is16Bit ? Math.min(255, Math.floor(r / 256)) : r;
            imgData.data[i + 1] = is16Bit ? Math.min(255, Math.floor(g / 256)) : g;
            imgData.data[i + 2] = is16Bit ? Math.min(255, Math.floor(b / 256)) : b;
            imgData.data[i + 3] = 255;
          }
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        }
      } catch (err) {
        console.error('GeoTIFF preview decoding failed:', err);
      }
    }
    return URL.createObjectURL(file);
  };

  const autoDetectPipeline = (f1: File | null, f2: File | null) => {
    if (!f1 && !f2) {
      setDetectedPipeline('Auto-Routing Engine Idle');
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
      } else {
        setDetectedPipeline('Dual Temporal Swaths detected (Pre/Post) → Routed to Open-CD Bi-Temporal Siamese');
      }
      if (targetMethod === 'auto') {
        setActiveWorkstationTab('bitemporal');
        setActiveViewTool('tripane');
      }
    }
  };

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (files.length === 1) {
        const f1 = files[0];
        setFileT1(f1);
        setFileT2(null);
        setT2DataUrl(null);
        setChangeMaskUrl(null);
        const url1 = await processRaster(f1);
        setT1DataUrl(url1);
        autoDetectPipeline(f1, null);
      } else if (files.length >= 2) {
        const f1 = files[0];
        const f2 = files[1];
        setFileT1(f1);
        setFileT2(f2);
        const url1 = await processRaster(f1);
        const url2 = await processRaster(f2);
        setT1DataUrl(url1);
        setT2DataUrl(url2);
        autoDetectPipeline(f1, f2);
      }
    }
  };

  const handleClearFiles = () => {
    setFileT1(null);
    setFileT2(null);
    setT1DataUrl(null);
    setT2DataUrl(null);
    setChangeMaskUrl(null);
    setEntities([]);
    setDetectedPipeline('Auto-Routing Engine Idle');
    if (fileInputT1Ref.current) fileInputT1Ref.current.value = '';
    if (fileInputT2Ref.current) fileInputT2Ref.current.value = '';
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleLaunchWorkstation = () => {
    setIsLoading(true);
    let effectiveMethod = targetMethod;
    if (targetMethod === 'auto') {
      if (fileT1 && fileT2) {
        const nameCheck = (fileT1.name + ' ' + fileT2.name).toLowerCase();
        effectiveMethod = (nameCheck.includes('sar') || nameCheck.includes('s1')) ? 'opticalsar' : 'bitemporal';
      } else {
        effectiveMethod = 'single';
      }
    }

    if (fileT1) {
      setActiveScenario(`${fileT1.name}${fileT2 ? ' ⟷ ' + fileT2.name : ''}`);
      setEntities([]);
      setChatMessages([
        {
          sender: 'ai',
          text: `Autonomous router initialized [Pipeline: ${effectiveMethod.toUpperCase()}]. Active raster swath loaded. Ask a question or request feature segmentation.`
        }
      ]);
    }

    if (effectiveMethod === 'bitemporal' || effectiveMethod === 'opticalsar') {
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
    } else {
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
    }

    const newHistory: HistoryItem = {
      id: `hist-${Date.now()}`,
      title: fileT1 ? fileT1.name : activeScenario,
      timestamp: 'Just now',
      method: effectiveMethod,
      pipeline: effectiveMethod === 'bitemporal' ? 'Open-CD (Bi-Temporal Siamese)' : effectiveMethod === 'opticalsar' ? 'Cross-Attention Optical-SAR' : 'Falcon-0.7B-RS (Single RS-VQA)',
      entitiesCount: 0,
      coordinates: { lat: liveCoords.lat, lng: liveCoords.lng }
    };
    setHistoryList((prev) => [newHistory, ...prev]);
    setIsLoading(false);
    setCurrentPage('workstation');
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
        {
          id: 1,
          name: 'Container Cargo Ship (Berth 4)',
          confidence: 0.990,
          area_m2: 6200,
          top: 42,
          left: 26,
          width: 22,
          height: 16,
          color: '#1a73e8'
        }
      ]);
    } else {
      setActiveScenario('Brahmaputra Basin, Assam (Flood Inundation)');
      setTargetMethod('bitemporal');
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
      setMapCenter([26.1900, 91.7300]);
      setMapZoom(14);
      setLiveCoords({ lat: 26.1900, lng: 91.7300, zoom: 14 });
      setEntities([
        {
          id: 1,
          name: 'Submerged Highway NH-27 Corridor',
          confidence: 0.992,
          area_m2: 24500,
          top: 35,
          left: 30,
          width: 38,
          height: 25,
          color: '#d93025'
        }
      ]);
    }
    setCurrentPage('workstation');
  };

  const handleSendAlertSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim()) return;

    setIsSendingSms(true);
    setSmsStatus('idle');

    setTimeout(() => {
      setIsSendingSms(false);
      setSmsStatus('success');
      setTimeout(() => {
        setShowSmsModal(false);
        setSmsStatus('idle');
        setRecipientPhone('');
      }, 1600);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');
    setIsLoading(true);

    setTimeout(() => {
      let aiReply = `Analyzed spatial raster at ${liveCoords.lat}°N, ${liveCoords.lng}°E.`;
      const q = userQ.toLowerCase();

      if (q.includes('flood') || q.includes('water')) {
        aiReply = `Identified surface water accumulation across low-elevation zones. Specular radar backscatter confirms inundation.`;
        setEntities([
          {
            id: 1,
            name: 'Inundated Water Body / Flood Extent',
            confidence: 0.984,
            area_m2: 32400,
            top: 32,
            left: 28,
            width: 38,
            height: 26,
            color: '#0284c7'
          }
        ]);
      } else {
        aiReply = `Processed query: "${userQ}". Grounded primary sector.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
      setIsLoading(false);
    }, 400);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSwipe.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSwipePos(pct);
  };

  // =========================================================================
  // PAGE 1: AUTHENTICATION
  // =========================================================================
  if (currentPage === 'login') {
    return (
      <div 
        className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-between"
        style={{
          background: 'linear-gradient(135deg, #ffe3c2 0%, #fff1e0 22%, #f4f9ff 50%, #e2f0ff 72%, #d7ecff 100%)'
        }}
      >
        <div className="absolute -top-[6%] -left-[6%] w-[34rem] h-[34rem] rounded-full bg-[#f97316] blur-[95px] pointer-events-none opacity-30" />
        <div className="absolute -bottom-[8%] -right-[6%] w-[36rem] h-[36rem] rounded-full bg-[#0284c7] blur-[100px] pointer-events-none opacity-30" />

        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-5 flex items-center justify-between shadow-sm z-30 relative">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/isro-logo.png" alt="ISRO Logo" className="h-14 w-auto object-contain" />
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-sm font-bold text-slate-800 tracking-tight uppercase">Department of Space</span>
                <span className="text-xs font-medium text-slate-500">Government of India</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="BhuViksana Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
              <div className="flex flex-col text-left">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                  BhuViksana <span className="text-sm font-mono text-[#0284c7]">AI</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  Earth Observation Portal
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
            <span className="hidden md:inline">NIC Security Certified • AES-256</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-20">
          <div className="w-full max-w-[460px] bg-white/95 rounded-[26px] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] p-8 sm:p-10 backdrop-blur-xl relative">
            <div className="text-center mb-7">
              <div className="w-14 h-14 mx-auto mb-3.5 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm">
                <img src="/logo.png" alt="BhuViksana" className="w-9 h-9 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
              <p className="text-xs text-slate-500 mt-1">Enter official credentials to access the geospatial workstation.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">Designated Command Unit</label>
                <div className="relative">
                  <select
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#0284c7] focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="ISRO-SAC">ISRO — Space Applications Centre (SAC)</option>
                    <option value="ISRO-NRSC">ISRO — National Remote Sensing Centre (NRSC)</option>
                    <option value="NDRF-HQ">NDRF — Disaster Response Command</option>
                    <option value="STATE-DMA">State Disaster Management Authority (SDMA)</option>
                    <option value="SIH-JURY">SIH2026 Evaluation Panel / Auditor</option>
                  </select>
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">Official Government Email ID</label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer.name@isro.gov.in / @nic.in"
                    required
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Security Passkey</label>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('reset-password')}
                    className="text-[11px] font-medium text-[#0284c7] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 pr-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.98] transition mt-2"
              >
                <span>Sign In with Gov Auth</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // PAGE: RESET / CHANGE PASSWORD VIEW
  // =========================================================================
  if (currentPage === 'reset-password') {
    return (
      <div 
        className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-center items-center p-4"
        style={{
          background: 'linear-gradient(135deg, #ffe3c2 0%, #fff1e0 22%, #f4f9ff 50%, #e2f0ff 72%, #d7ecff 100%)'
        }}
      >
        <div className="w-full max-w-[440px] bg-white rounded-[26px] border border-slate-200 shadow-2xl p-8 backdrop-blur-xl relative">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <button
              onClick={() => setCurrentPage('canvas')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Change Security Passkey</h2>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[280px]">For: {loginEmail}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new passkey..."
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 pr-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Re-type New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new passkey..."
                  required
                  className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Password updated successfully! Returning...</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.98] transition mt-2 flex items-center justify-center gap-2"
            >
              <span>Save & Update Passkey</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PAGE 2: SETUP CANVAS
  // =========================================================================
  if (currentPage === 'canvas') {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 select-none relative">
        {/* LEFT DOCK PANEL */}
        <aside className="w-[72px] h-full flex flex-col items-center justify-between py-6 border-r border-slate-200/70 bg-white/70 backdrop-blur-md z-30 relative">
          <div className="flex flex-col items-center gap-6">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <nav className="flex flex-col items-center gap-4 pt-4">
              <button className="p-2.5 rounded-xl text-white bg-[#0284c7] shadow-sm shadow-cyan-500/30 transition hover:scale-105" title="Home Setup">
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
                className={`p-2.5 rounded-xl transition hover:scale-105 ${
                  isHistoryDrawerOpen ? 'bg-[#1a73e8] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Telemetry & Query History"
              >
                <History className="w-5 h-5" />
              </button>
            </nav>
          </div>

          {/* ⬇️ BOTTOM USER PROFILE BUTTON WITH INITIALS & POPUP ⬇️ */}
          <div className="flex flex-col items-center gap-3 relative">
            {/* Popover Card */}
            {showUserPopover && (
              <div className="absolute bottom-2 left-16 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-cyan-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {getUserInitial()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">{loginEmail}</div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">{agencyCode} Authorized</div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserPopover(false);
                      setCurrentPage('reset-password');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition group"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#0284c7]" />
                      <span>Change Password</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserPopover(false);
                      setCurrentPage('login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Circular Avatar Button */}
            <button
              onClick={() => setShowUserPopover(!showUserPopover)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-cyan-500 text-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition flex items-center justify-center ring-2 ring-white border border-cyan-300"
              title="User Account Profile"
            >
              {getUserInitial()}
            </button>

            {/* Direct Sign Out */}
            <button
              onClick={() => setCurrentPage('login')}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-center text-slate-900 leading-snug">
              <span className="text-[#0284c7]">Good Afternoon,</span> What Satellite<br />
              scene you would like to <span className="text-[#f37021]">Discover?</span>
            </h1>

            <div className="w-full bg-white rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-xs">Model Pipeline Mode</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-mono">
                    Autonomous Dispatcher
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={targetMethod}
                    onChange={(e) => {
                      setTargetMethod(e.target.value as any);
                      autoDetectPipeline(fileT1, fileT2);
                    }}
                    className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-9 outline-none focus:border-[#0284c7] focus:bg-white transition cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="auto">Auto-Detect (Model routes by uploaded photos)</option>
                    <option value="single">Single Swath (Falcon-0.7B-RS VQA)</option>
                    <option value="bitemporal">Bi-Temporal (Open-CD Siamese Change Detection)</option>
                    <option value="opticalsar">Optical SAR (Cross-Attention Fusion)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="pt-1">
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  rows={3}
                  placeholder="Ask Question or Analysis Requirements..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition">
                    <UploadCloud className="w-4 h-4 text-[#0284c7]" />
                    <span>
                      {fileT1 && fileT2
                        ? `${fileT1.name.slice(0, 10)}... + ${fileT2.name.slice(0, 10)}...`
                        : fileT1
                        ? fileT1.name.slice(0, 18) + '...'
                        : 'Upload 1 or 2 Satellite Swaths'}
                    </span>
                    <input
                      ref={multiFileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".tif,.tiff,.png,.jpg,.jpeg"
                      onChange={handleMultiFileUpload}
                    />
                  </label>
                  {(fileT1 || fileT2) && (
                    <button onClick={handleClearFiles} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleLaunchWorkstation}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f37021] to-[#f97316] hover:from-[#ea580c] hover:to-[#f37021] text-white text-xs font-semibold shadow-md active:scale-[0.98] transition disabled:opacity-50"
                >
                  <span>Launch Workstation</span>
                  <Rocket className="w-3.5 h-3.5 fill-white" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLoadScenario('port')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs font-medium text-slate-700 shadow-sm transition hover:scale-105"
              >
                <Anchor className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Visakhapatnam Port</span>
              </button>
              <button
                onClick={() => handleLoadScenario('flood')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs font-medium text-slate-700 shadow-sm transition hover:scale-105"
              >
                <CloudRain className="w-3.5 h-3.5 text-[#f37021]" />
                <span>Assam Flood Inundation</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // PAGE 3: WORKSTATION VIEW
  // =========================================================================
  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#e5e3df] font-sans text-[#202124] select-none relative"
      onMouseUp={() => { isDraggingSwipe.current = false; }}
    >
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-32px)]">
        <div className="flex items-center h-12 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] px-3 gap-2 w-[360px] sm:w-[390px]">
          <button onClick={() => setCurrentPage('canvas')} className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 truncate text-xs font-semibold text-[#202124]">
            {activeScenario}
          </div>
          <button onClick={() => handleLoadScenario(activeScenario.includes('Visakhapatnam') ? 'flood' : 'port')} className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#1a73e8] transition">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => handleLoadScenario('port')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeScenario.includes('Visakhapatnam') ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Port Recon</span>
          </button>
          <button
            onClick={() => handleLoadScenario('flood')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeScenario.includes('Assam') ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Flood Analysis</span>
          </button>
          <button
            onClick={() => {
              setActiveViewTool(activeViewTool === 'tripane' ? 'single' : 'tripane');
              setActiveWorkstationTab('bitemporal');
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeViewTool === 'tripane' ? 'bg-[#1a73e8] text-white font-bold' : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>3-Pane Bit-CD</span>
          </button>
          <button
            onClick={() => setActiveViewTool(activeViewTool === 'swipe' ? 'single' : 'swipe')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeViewTool === 'swipe' ? 'bg-[#e37400] text-white' : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Swipe Tool</span>
          </button>
        </div>
      </div>

      {/* VIEWPORT CANVAS */}
      <div className="flex flex-1 h-full w-full relative">
        <div ref={containerRef} onMouseMove={handleMouseMove} className="flex-1 relative bg-[#e5e3df] overflow-hidden select-none">
          
          <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(225,29,72,0.35)] transition active:scale-95 animate-pulse"
              title="Broadcast Emergency SMS"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>SMS Alert</span>
            </button>

            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#f8f9fa] border border-[#dadce0] text-xs font-medium text-[#3c4043] shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition"
            >
              <Activity className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Audit Trace</span>
            </button>
          </div>

          {activeViewTool === 'tripane' ? (
            <div className="w-full h-full grid grid-cols-3 gap-1.5 bg-slate-950 p-2.5">
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex flex-col shadow-inner">
                {t1DataUrl ? <img src={t1DataUrl} alt="T1" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Pre-Event Baseline</div>}
              </div>
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex flex-col shadow-inner">
                {t2DataUrl || t1DataUrl ? <img src={t2DataUrl || t1DataUrl} alt="T2" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Post-Event Target</div>}
              </div>
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-rose-950/60 bg-black flex flex-col shadow-inner">
                {changeMaskUrl ? <img src={changeMaskUrl} alt="Mask" className="w-full h-full object-cover filter contrast-150" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Awaiting Mask Matrix</div>}
              </div>
            </div>
          ) : t1DataUrl ? (
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
              <img src={t2DataUrl || t1DataUrl} alt="Post" className="absolute inset-0 w-full h-full object-cover" />
              {showBBoxes && entities.map((box, idx) => (
                <div
                  key={box.id ?? idx}
                  className="absolute border-2 border-[#1a73e8] bg-[#1a73e8]/20 rounded pointer-events-none z-20 transition-all duration-300"
                  style={{
                    top: `${box.top ?? 30}%`,
                    left: `${box.left ?? 30}%`,
                    width: `${box.width ?? 25}%`,
                    height: `${box.height ?? 20}%`
                  }}
                >
                  <span className="absolute -top-6 left-0 text-[10px] font-sans font-medium px-2 py-0.5 bg-white text-[#1a73e8] border border-[#dadce0] rounded-full shadow whitespace-nowrap">
                    {box.name} • {(box.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            isClient && (
              <WorkstationMap
                center={mapCenter}
                zoom={mapZoom}
                baseMapType={baseMapType}
                showBBoxes={showBBoxes}
                entities={entities}
                onUpdate={handleMapUpdate}
              />
            )
          )}

          <div className="absolute bottom-2 right-4 z-[400] text-[11px] font-mono text-[#5f6368] bg-white/85 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-sm border border-[#dadce0]">
            {liveCoords.lat.toFixed(4)}°N, {liveCoords.lng.toFixed(4)}°E • Zoom: {liveCoords.zoom}x
          </div>
        </div>

        {/* SIDEBAR */}
        {isSidebarOpen && (
          <aside className="w-[410px] h-full bg-white border-l border-[#dadce0] flex flex-col justify-between z-30 relative flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-xs leading-relaxed p-3 rounded-2xl border ${
                      msg.sender === 'user' ? 'bg-[#e8f0fe] border-[#d2e3fc] text-[#174ea6] ml-6' : 'bg-[#f1f3f4] border-[#dadce0] text-[#202124] mr-4'
                    }`}
                  >
                    <span className="font-semibold text-[11px] block mb-1">
                      {msg.sender === 'user' ? 'Operator' : 'BhuViksana Assistant'}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-[#dadce0] bg-white">
              <div className="flex items-center gap-2 bg-[#f1f3f4] border border-[#dadce0] rounded-full px-3.5 py-1.5 focus-within:bg-white focus-within:border-[#1a73e8]">
                <Sparkles className="w-4 h-4 text-[#1a73e8]" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about structures or flood water..."
                  className="w-full bg-transparent text-xs text-[#202124] focus:outline-none"
                />
                <button onClick={handleSendMessage} className="p-1.5 rounded-full bg-[#1a73e8] text-white">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* EMERGENCY SMS ALERT MODAL */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-[26px] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Broadcast Disaster SMS Alert</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Disaster Emergency Telemetry Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAlertSMS} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Enter Mobile Number to receive SMS Alert
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 pl-10 outline-none focus:border-rose-500 focus:bg-white transition"
                  />
                  <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {smsStatus === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Emergency telemetry SMS transmitted to {recipientPhone}!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingSms || !recipientPhone.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition"
                >
                  {isSendingSms ? <span>Transmitting...</span> : <span>Dispatch Alert</span>}
                  <Radio className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}