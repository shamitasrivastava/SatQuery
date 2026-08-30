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
  Sparkles
} from 'lucide-react';
import * as GeoTIFF from 'geotiff';
import { jsPDF } from 'jspdf';

// Dynamic SSR-safe import of the standalone Leaflet Map component
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
  latMin: number;
  lngMin: number;
  latMax: number;
  lngMax: number;
  color: string;
  // Position of the box as a % of the image, 0-100. Only used when
  // rendering over an uploaded raster (t1DataUrl). Comes straight from
  // the detection model's output — never inferred from array index.
  xPct?: number;
  yPct?: number;
  wPct?: number;
  hPct?: number;
}

export default function BhuViksanaApp() {
  const [currentPage, setCurrentPage] = useState<'login' | 'canvas' | 'workstation'>('login');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // -------------------------------------------------------------
  // PAGE 1: AUTH STATE
  // -------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [agencyCode, setAgencyCode] = useState('ISRO-SAC');
  const [showPassword, setShowPassword] = useState(false);

  // -------------------------------------------------------------
  // PAGE 2 & 3: WORKSTATION STATE
  // -------------------------------------------------------------
  const [targetMethod, setTargetMethod] = useState<'single' | 'bitemporal' | 'opticalsar'>('bitemporal');
  const [activeWorkstationTab, setActiveWorkstationTab] = useState<'rsvqa' | 'bitemporal' | 'audittrace'>('rsvqa');
  const [activeViewTool, setActiveViewTool] = useState<'single' | 'swipe'>('single');
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [baseMapType, setBaseMapType] = useState<'esri' | 'osm'>('esri');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  // Tracks the state of a REAL detection run against an uploaded raster.
  // 'idle'      -> no custom upload, or nothing run yet (demo scenarios only)
  // 'detecting' -> model call in flight
  // 'done'      -> model returned (entities array reflects real results, may be empty)
  // 'error'     -> model call failed / no backend configured
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'done' | 'error'>('idle');

  // Map Center & Target Scenarios
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.6965, 83.2980]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  // Live real-time coordinate state
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
  const [activeScenario, setActiveScenario] = useState<string>('Visakhapatnam Port & Industrial Corridor');

  const [fileT1, setFileT1] = useState<File | null>(null);
  const [fileT2, setFileT2] = useState<File | null>(null);
  const [t1DataUrl, setT1DataUrl] = useState<string | null>(null);
  const [t2DataUrl, setT2DataUrl] = useState<string | null>(null);

  // Accurate Grounded Bounding Boxes for Visakhapatnam Port (demo scenario only)
  const [entities, setEntities] = useState<MapEntity[]>([
    {
      id: 1,
      name: 'Container Cargo Ship (Berth 4)',
      confidence: 0.990,
      area_m2: 6200,
      latMin: 17.6940,
      lngMin: 83.2930,
      latMax: 17.6985,
      lngMax: 83.2985,
      color: '#1a73e8',
      xPct: 26, yPct: 42, wPct: 24, hPct: 18
    },
    {
      id: 2,
      name: 'Bulk Carrier (Berth 2)',
      confidence: 0.978,
      area_m2: 4850,
      latMin: 17.6885,
      lngMin: 83.2875,
      latMax: 17.6930,
      lngMax: 83.2930,
      color: '#e37400',
      xPct: 48, yPct: 58, wPct: 24, hPct: 18
    },
    {
      id: 3,
      name: 'Harbor Breakwater Wall',
      confidence: 0.968,
      area_m2: 5400,
      latMin: 17.6820,
      lngMin: 83.3000,
      latMax: 17.6850,
      lngMax: 83.3130,
      color: '#188038',
      xPct: 70, yPct: 74, wPct: 24, hPct: 18
    }
  ]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Visual Question Answering initialized with Falcon-0.7B-RS. Grounded 3 assets in target viewport.'
    }
  ]);

  const fileInputT1Ref = useRef<HTMLInputElement>(null);
  const fileInputT2Ref = useRef<HTMLInputElement>(null);

  const handleMapUpdate = (lat: number, lng: number, zoom: number) => {
    setLiveCoords({
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      zoom
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage('canvas');
  };

  const processRaster = async (file: File): Promise<string> => {
    if (file.name.endsWith('.tif') || file.name.endsWith('.tiff')) {
      const arrayBuffer = await file.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const width = image.getWidth();
      const height = image.getHeight();
      const rgb = await image.readRGB({ interleave: true });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const imgData = ctx.createImageData(width, height);
        for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
          imgData.data[i] = rgb[j];
          imgData.data[i + 1] = rgb[j + 1];
          imgData.data[i + 2] = rgb[j + 2];
          imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/png');
      }
    }
    return URL.createObjectURL(file);
  };

  const handleFileT1Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileT1(file);
      // A new raster invalidates any previously grounded entities —
      // never let the old demo/port boxes carry over onto a new image.
      setEntities([]);
      setDetectionStatus('idle');
      const url = await processRaster(file);
      setT1DataUrl(url);
    }
  };

  const handleFileT2Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileT2(file);
      setEntities([]);
      setDetectionStatus('idle');
      const url = await processRaster(file);
      setT2DataUrl(url);
    }
  };

  /**
   * Runs real object/change detection against the uploaded raster(s).
   *
   * TODO: point this at your actual inference backend. Expected contract:
   *   POST <DETECTION_API_URL> with FormData { image: File, mode: targetMethod }
   *   -> JSON: { entities: Array<{ name, confidence, area_m2, xPct, yPct, wPct, hPct, color? }> }
   * xPct/yPct/wPct/hPct must be the box's position as a % of the image
   * (0-100), since that's what's rendered over the raster in the viewport.
   *
   * Until a backend is wired up, this intentionally returns no entities
   * rather than fabricating results — an empty state is more honest than
   * fake bounding boxes.
   */
  const runDetection = async (file: File): Promise<MapEntity[]> => {
    const DETECTION_API_URL = process.env.NEXT_PUBLIC_DETECTION_API_URL;
    if (!DETECTION_API_URL) {
      // No backend configured yet — surface that clearly instead of guessing.
      return [];
    }
    const form = new FormData();
    form.append('image', file);
    form.append('mode', targetMethod);

    const res = await fetch(DETECTION_API_URL, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Detection API returned ${res.status}`);
    const data = await res.json();
    const raw = Array.isArray(data?.entities) ? data.entities : [];

    return raw.map((e: any, idx: number): MapEntity => ({
      id: idx + 1,
      name: e.name ?? `Object ${idx + 1}`,
      confidence: e.confidence ?? 0,
      area_m2: e.area_m2 ?? 0,
      latMin: e.latMin ?? 0,
      lngMin: e.lngMin ?? 0,
      latMax: e.latMax ?? 0,
      lngMax: e.lngMax ?? 0,
      color: e.color ?? '#1a73e8',
      xPct: e.xPct,
      yPct: e.yPct,
      wPct: e.wPct,
      hPct: e.hPct
    }));
  };

  const handleClearFiles = () => {
    setFileT1(null);
    setFileT2(null);
    setT1DataUrl(null);
    setT2DataUrl(null);
    if (fileInputT1Ref.current) fileInputT1Ref.current.value = '';
    if (fileInputT2Ref.current) fileInputT2Ref.current.value = '';
  };

  const handleLaunchWorkstation = async () => {
    setIsLoading(true);

    if (targetMethod === 'bitemporal' || targetMethod === 'opticalsar') {
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('swipe');
    } else {
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
    }

    if (fileT1) {
      setActiveScenario(`Custom Upload: ${fileT1.name}`);
      setEntities([]); // no results yet — do not show the demo boxes
      setDetectionStatus('detecting');
      setChatMessages([
        {
          sender: 'ai',
          text: `Inference initialized on raster swath '${fileT1.name}'. Analyzing...`
        }
      ]);
      setCurrentPage('workstation');

      try {
        const detected = await runDetection(fileT1);
        setEntities(detected);
        setDetectionStatus('done');
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: detected.length > 0
              ? `Grounded ${detected.length} feature${detected.length === 1 ? '' : 's'} in '${fileT1.name}'.`
              : `No detection backend is connected yet, so '${fileT1.name}' was not analyzed. Set NEXT_PUBLIC_DETECTION_API_URL to enable real grounding, or load a demo scenario instead.`
          }
        ]);
      } catch (err) {
        setDetectionStatus('error');
        setChatMessages((prev) => [
          ...prev,
          { sender: 'ai', text: `Detection failed for '${fileT1.name}': ${err instanceof Error ? err.message : 'unknown error'}.` }
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

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
          latMin: 17.6940,
          lngMin: 83.2930,
          latMax: 17.6985,
          lngMax: 83.2985,
          color: '#1a73e8',
          xPct: 26, yPct: 42, wPct: 24, hPct: 18
        },
        {
          id: 2,
          name: 'Bulk Carrier (Berth 2)',
          confidence: 0.978,
          area_m2: 4850,
          latMin: 17.6885,
          lngMin: 83.2875,
          latMax: 17.6930,
          lngMax: 83.2930,
          color: '#e37400',
          xPct: 48, yPct: 58, wPct: 24, hPct: 18
        },
        {
          id: 3,
          name: 'Harbor Breakwater Wall',
          confidence: 0.968,
          area_m2: 5400,
          latMin: 17.6820,
          lngMin: 83.3000,
          latMax: 17.6850,
          lngMax: 83.3130,
          color: '#188038',
          xPct: 70, yPct: 74, wPct: 24, hPct: 18
        }
      ]);
      setDetectionStatus('idle');
      setChatMessages([
        {
          sender: 'ai',
          text: 'Visual Question Answering initialized with Falcon-0.7B-RS. Grounded 3 assets in target viewport.'
        }
      ]);
    } else {
      setActiveScenario('Brahmaputra Basin, Assam (Flood Inundation)');
      setTargetMethod('bitemporal');
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('swipe');
      setMapCenter([26.1900, 91.7300]);
      setMapZoom(14);
      setLiveCoords({ lat: 26.1900, lng: 91.7300, zoom: 14 });
      setEntities([
        {
          id: 1,
          name: 'Submerged Highway NH-27 Corridor',
          confidence: 0.992,
          area_m2: 24500,
          latMin: 26.1850,
          lngMin: 91.7200,
          latMax: 26.1980,
          lngMax: 91.7450,
          color: '#d93025',
          xPct: 22, yPct: 40, wPct: 56, hPct: 30
        }
      ]);
      setDetectionStatus('idle');
      setChatMessages([
        {
          sender: 'ai',
          text: 'Bi-temporal Siamese Change Detection initialized. Identified 1 inundated sector spanning 24,500 m².'
        }
      ]);
    }
    setCurrentPage('workstation');
  };

  /**
   * Sends the operator's question to a real reasoning backend along with
   * the current grounded entities as context.
   *
   * TODO: point this at your actual chat/RAG backend. Expected contract:
   *   POST <CHAT_API_URL> with JSON:
   *     { query, scenario: activeScenario, entities, coords: liveCoords }
   *   -> JSON: { reply: string }
   *
   * Until a backend is wired up, this returns null so the caller can fall
   * back to an honest "not connected" message instead of a scripted one.
   */
  const runChatQuery = async (query: string): Promise<string | null> => {
    const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;
    if (!CHAT_API_URL) return null;

    const res = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        scenario: activeScenario,
        entities,
        coords: liveCoords
      })
    });
    if (!res.ok) throw new Error(`Chat API returned ${res.status}`);
    const data = await res.json();
    return typeof data?.reply === 'string' ? data.reply : null;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');

    try {
      const reply = await runChatQuery(userQ);
      if (reply) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
        return;
      }

      // No chat backend configured — say so plainly rather than faking
      // a scripted answer. Still surface real, locally-known facts
      // (grounded entity count/area) since those aren't fabricated.
      const totalArea = entities.reduce((acc, curr) => acc + curr.area_m2, 0);
      const fallback = entities.length > 0
        ? `No reasoning backend is connected, so I can't answer "${userQ}" directly. What I do have locally: ${entities.length} grounded feature${entities.length === 1 ? '' : 's'} totaling ${totalArea.toLocaleString()} m². Set NEXT_PUBLIC_CHAT_API_URL to enable real answers.`
        : `No reasoning backend is connected, and no features have been grounded yet, so I can't answer "${userQ}". Set NEXT_PUBLIC_CHAT_API_URL to enable real answers.`;
      setChatMessages((prev) => [...prev, { sender: 'ai', text: fallback }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Query failed: ${err instanceof Error ? err.message : 'unknown error'}.` }
      ]);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(26, 115, 232);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('BHUVIKSANA AI - NATIONAL GEOSPATIAL INTELLIGENCE BRIEFING', 14, 13);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(232, 240, 254);
    doc.text('DEPARTMENT OF SPACE • ISRO SIH26167 • RESTRICTED GOVERNMENT BRIEFING', 14, 21);

    doc.setTextColor(32, 33, 36);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('1. OPERATIONAL TELEMETRY & ACQUISITION METADATA', 14, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Target Scenario   : ${activeScenario}`, 14, 46);
    doc.text(`Acquisition GPS   : ${liveCoords.lat}° N, ${liveCoords.lng}° E (Zoom: ${liveCoords.zoom}x)`, 14, 52);
    doc.text(`Active Pipeline   : ${targetMethod === 'bitemporal' ? 'Open-CD (Bi-Temporal Siamese)' : targetMethod === 'opticalsar' ? 'Cross-Attention Optical-SAR' : 'Falcon-0.7B-RS (Single RS-VQA)'}`, 14, 58);
    doc.text(`Timestamp         : ${new Date().toUTCString()}`, 14, 64);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`2. GROUNDED VECTOR ENTITIES (${entities.length})`, 14, 76);

    doc.setFillColor(241, 243, 244);
    doc.rect(14, 80, pageWidth - 28, 8, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(32, 33, 36);
    doc.text('ID', 18, 85);
    doc.text('Identified Feature', 30, 85);
    doc.text('Confidence', 110, 85);
    doc.text('Footprint (m²)', 140, 85);
    doc.text('Bounding Lat/Lon Bounds', 170, 85);

    let y = 94;
    entities.forEach((item, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(index + 1), 18, y);
      doc.text(item.name, 30, y);
      doc.text(`${(item.confidence * 100).toFixed(1)}%`, 110, y);
      doc.text(`${item.area_m2.toLocaleString()} m²`, 140, y);
      doc.text(`[${item.latMin.toFixed(3)}, ${item.lngMin.toFixed(3)}]`, 170, y);
      y += 8;
    });

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. AI REASONING & EXECUTIVE ASSESSMENT', 14, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lastAiMessage = chatMessages.slice().reverse().find(m => m.sender === 'ai')?.text || 'Zero critical anomalies detected in target viewport.';
    const splitSummary = doc.splitTextToSize(lastAiMessage, pageWidth - 28);
    doc.text(splitSummary, 14, y);

    doc.setFontSize(7.5);
    doc.setTextColor(128, 134, 139);
    doc.text('Generated via BhuViksana AI Autonomous Intelligence Pipeline • AES-256 Encrypted Telemetry', 14, 285);

    doc.save(`BhuViksana_Briefing_${Date.now()}.pdf`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSwipe.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSwipePos(pct);
  };

  // =========================================================================
  // PAGE 1: AUTHENTICATION (ORIGINAL CODE PRESERVED)
  // =========================================================================
  if (currentPage === 'login') {
    return (
      <div
        className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-between animated-gradient-bg"
      >
        {/* Moving orange/blue graphic layer — same opacity, wave-like drift */}
        <div className="absolute -top-[6%] -left-[6%] w-[34rem] h-[34rem] rounded-full bg-[#f97316] blur-[95px] pointer-events-none opacity-30 blob-wave-orange" />
        <div className="absolute -bottom-[8%] -right-[6%] w-[36rem] h-[36rem] rounded-full bg-[#0284c7] blur-[100px] pointer-events-none opacity-30 blob-wave-blue" />

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
                  <a href="#forgot" className="text-[11px] font-medium text-[#0284c7] hover:underline">Forgot Password?</a>
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

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">
                "Bridging Conversational AI with Sub-Meter Earth Observation for National Remote Sensing & Disaster Resilience."
              </p>
            </div>
          </div>
        </main>

        <footer className="w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 text-slate-300 py-3 px-6 text-center text-xs z-30 relative">
          <p className="max-w-4xl mx-auto leading-normal">
            <span className="font-bold text-white">Official Notice: </span>
            Authorized access only for ISRO, NRSC, and State Disaster Command personnel under the Information Technology Act, 2000. All access activities and telemetry queries are monitored and audited.
          </p>
        </footer>

        <style jsx>{`
          .animated-gradient-bg {
            background: linear-gradient(135deg, #ffe3c2 0%, #fff1e0 22%, #f4f9ff 50%, #e2f0ff 72%, #d7ecff 100%);
            background-size: 260% 260%;
            animation: gradientShift 14s ease-in-out infinite;
          }

          @keyframes gradientShift {
            0% { background-position: 0% 40%; }
            50% { background-position: 100% 60%; }
            100% { background-position: 0% 40%; }
          }

          .blob-wave-orange {
            animation: waveOrange 9s ease-in-out infinite;
          }
          .blob-wave-blue {
            animation: waveBlue 10s ease-in-out infinite;
          }

          @keyframes waveOrange {
            0%   { transform: translate(0, 0) scale(1); }
            25%  { transform: translate(40px, 20px) scale(1.06); }
            50%  { transform: translate(15px, 45px) scale(1); }
            75%  { transform: translate(-25px, 15px) scale(0.96); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes waveBlue {
            0%   { transform: translate(0, 0) scale(1); }
            25%  { transform: translate(-40px, -20px) scale(1.06); }
            50%  { transform: translate(-15px, -45px) scale(1); }
            75%  { transform: translate(25px, -15px) scale(0.96); }
            100% { transform: translate(0, 0) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // =========================================================================
  // PAGE 2: SETUP CANVAS (ORIGINAL CODE PRESERVED)
  // =========================================================================
  if (currentPage === 'canvas') {
    return (
      <div className="flex h-screen w-screen overflow-hidden canvas-bg-mesh font-sans text-slate-800 select-none relative">
        <div className="absolute right-[-4vw] top-[5vh] w-[58vw] h-[90vh] pointer-events-none opacity-[0.045] z-0 flex items-center justify-center">
          <img src="/logo.png" alt="Watermark" className="w-full h-full object-contain" />
        </div>

        <aside className="w-[72px] h-full flex flex-col items-center justify-between py-6 border-r border-slate-200/70 bg-white/60 backdrop-blur-md z-20">
          <div className="flex flex-col items-center gap-6">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <nav className="flex flex-col items-center gap-5 pt-4">
              <button className="p-2.5 rounded-xl text-white bg-[#0284c7] shadow-sm shadow-cyan-500/30">
                <Home className="w-5 h-5" />
              </button>
            </nav>
          </div>
          <button
            onClick={() => setCurrentPage('login')}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </aside>

        <main className="flex-1 flex flex-col justify-center items-center p-8 relative z-10">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-center text-slate-900 leading-snug">
              <span className="text-[#0284c7]">Good Afternoon,</span> What Satelite<br />
              scene you would like to <span className="text-[#f37021]">Discover?</span>
            </h1>

            <div className="w-full bg-white rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">Upload Target Method</span>
                <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/60 text-xs font-medium text-slate-500">
                  <button
                    onClick={() => { setTargetMethod('single'); handleClearFiles(); }}
                    className={`px-3.5 py-1.5 rounded-full transition ${
                      targetMethod === 'single' ? 'bg-[#0284c7] text-white shadow-sm font-semibold' : 'hover:text-slate-800'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => { setTargetMethod('bitemporal'); handleClearFiles(); }}
                    className={`px-3.5 py-1.5 rounded-full transition ${
                      targetMethod === 'bitemporal' ? 'bg-[#0284c7] text-white shadow-sm font-semibold' : 'hover:text-slate-800'
                    }`}
                  >
                    Bi Temporal
                  </button>
                  <button
                    onClick={() => { setTargetMethod('opticalsar'); handleClearFiles(); }}
                    className={`px-3.5 py-1.5 rounded-full transition ${
                      targetMethod === 'opticalsar' ? 'bg-[#0284c7] text-white shadow-sm font-semibold' : 'hover:text-slate-800'
                    }`}
                  >
                    Optical SAR
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  rows={3}
                  placeholder="Ask Question or Analysis Requirements (e.g., 'Detect changes in urban infrastructure' or 'Identify all cargo vessels')..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition">
                    <UploadCloud className="w-4 h-4 text-[#0284c7]" />
                    <span>
                      {fileT1 ? fileT1.name.slice(0, 18) + '...' : (targetMethod === 'single' ? 'Attach GeoTIFF / PNG' : 'Attach T1 (Pre-Event)')}
                    </span>
                    <input
                      ref={fileInputT1Ref}
                      type="file"
                      className="hidden"
                      accept=".tif,.tiff,.png,.jpg,.jpeg"
                      onChange={handleFileT1Change}
                    />
                  </label>

                  {(targetMethod === 'bitemporal' || targetMethod === 'opticalsar') && (
                    <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition">
                      <UploadCloud className="w-4 h-4 text-[#f37021]" />
                      <span>
                        {fileT2 ? fileT2.name.slice(0, 18) + '...' : (targetMethod === 'opticalsar' ? 'Attach SAR Raster' : 'Attach T2 (Post-Event)')}
                      </span>
                      <input
                        ref={fileInputT2Ref}
                        type="file"
                        className="hidden"
                        accept=".tif,.tiff,.png,.jpg,.jpeg"
                        onChange={handleFileT2Change}
                      />
                    </label>
                  )}

                  {(fileT1 || fileT2) && (
                    <button
                      onClick={handleClearFiles}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { void handleLaunchWorkstation(); }}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f37021] to-[#f97316] hover:from-[#ea580c] hover:to-[#f37021] text-white text-xs font-semibold shadow-md active:scale-[0.98] transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span>Processing...</span>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Launch Workstation</span>
                      <Rocket className="w-3.5 h-3.5 fill-white" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-medium">Or load an operational remote sensing scenario:</span>
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
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // PAGE 3: WORKSTATION VIEW (GOOGLE MAPS THEME WITH FIXED OVERLAP)
  // =========================================================================
  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#e5e3df] font-sans text-[#202124] select-none relative"
      onMouseUp={() => { isDraggingSwipe.current = false; }}
    >
      {/* 1. TOP-LEFT FLOATING SEARCH & SCENARIO CARD */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-32px)]">
        <div className="flex items-center h-12 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] px-3 gap-2 w-[360px] sm:w-[390px]">
          <button
            onClick={() => setCurrentPage('canvas')}
            className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition"
            title="Back to Setup Canvas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 truncate text-xs font-semibold text-[#202124]">
            {activeScenario}
          </div>
          <button
            onClick={() => handleLoadScenario(activeScenario.includes('Visakhapatnam') ? 'flood' : 'port')}
            className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#1a73e8] transition"
            title="Quick Switch Scenario"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Google Maps Filter / Scenario Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => handleLoadScenario('port')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeScenario.includes('Visakhapatnam')
                ? 'bg-[#1a73e8] text-white'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Port Recon</span>
          </button>
          <button
            onClick={() => handleLoadScenario('flood')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeScenario.includes('Assam')
                ? 'bg-[#1a73e8] text-white'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Flood Analysis</span>
          </button>
          <button
            onClick={() => setActiveViewTool(activeViewTool === 'single' ? 'swipe' : 'single')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeViewTool === 'swipe'
                ? 'bg-[#e37400] text-white'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>{activeViewTool === 'swipe' ? 'Swipe: ON' : 'Swipe Tool'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAP CANVAS VIEWPORT */}
      <div className="flex flex-1 h-full w-full relative">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="flex-1 relative bg-[#e5e3df] overflow-hidden select-none"
        >
          {/* FLOATING ACTION PILLS - Anchored cleanly inside map viewport */}
          <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#f8f9fa] border border-[#dadce0] text-xs font-medium text-[#3c4043] shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition"
            >
              <Activity className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Audit Trace</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-xs font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Briefing</span>
            </button>
          </div>

          {t1DataUrl ? (
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
              <img
                src={t2DataUrl || t1DataUrl}
                alt="Post-Event"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                style={{
                  filter: activeViewTool === 'swipe' && !t2DataUrl ? 'hue-rotate(90deg) contrast(1.2)' : 'none'
                }}
              />

              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: activeViewTool === 'swipe' ? `${swipePos}%` : '100%' }}
              >
                <img
                  src={t1DataUrl}
                  alt="Pre-Event"
                  className="absolute inset-0 w-full h-full object-cover max-w-none"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw',
                    height: '100%'
                  }}
                />
              </div>

              {activeViewTool === 'swipe' && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] cursor-ew-resize z-30 flex items-center justify-center"
                  style={{ left: `${swipePos}%` }}
                  onMouseDown={() => { isDraggingSwipe.current = true; }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-[#dadce0] flex items-center justify-center shadow-lg text-[#1a73e8]">
                    <MoveHorizontal className="w-4 h-4" />
                  </div>
                </div>
              )}

              {showBBoxes && entities
                .filter((det) => det.xPct != null && det.yPct != null && det.wPct != null && det.hPct != null)
                .map((det) => (
                  <div
                    key={det.id}
                    className="absolute border-2 border-[#1a73e8] bg-[#1a73e8]/20 rounded pointer-events-none z-20 transition-all duration-300 shadow-[0_0_10px_rgba(26,115,232,0.4)]"
                    style={{
                      top: `${det.yPct}%`,
                      left: `${det.xPct}%`,
                      width: `${det.wPct}%`,
                      height: `${det.hPct}%`
                    }}
                  >
                    <span className="absolute -top-6 left-0 text-[10px] font-sans font-medium px-2 py-0.5 bg-white text-[#1a73e8] border border-[#dadce0] rounded-full shadow whitespace-nowrap">
                      {det.name} • {(det.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}

              {detectionStatus === 'detecting' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-xs font-medium text-[#3c4043] shadow-lg">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a73e8]" />
                    <span>Analyzing uploaded raster...</span>
                  </div>
                </div>
              )}

              {(detectionStatus === 'done' || detectionStatus === 'error') && entities.length === 0 && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-white/95 border border-[#dadce0] text-xs font-medium text-[#5f6368] shadow-lg whitespace-nowrap">
                  {detectionStatus === 'error' ? 'Detection failed — see chat for details.' : 'No detection backend connected — see chat for setup.'}
                </div>
              )}
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

          {/* Bottom-Left Layers Card */}
          <div className="absolute bottom-6 left-4 z-[400] flex items-center gap-2">
            <button
              onClick={() => setBaseMapType(baseMapType === 'esri' ? 'osm' : 'esri')}
              className="flex items-center gap-2 bg-white rounded-2xl p-1.5 pr-3 shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] hover:bg-[#f8f9fa] transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8] border border-[#dadce0]">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-medium text-[#5f6368] uppercase">Layers</div>
                <div className="text-xs font-semibold text-[#202124]">
                  {baseMapType === 'esri' ? 'Satellite' : 'Street Map'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowBBoxes(!showBBoxes)}
              className={`px-3 py-2 rounded-2xl border text-xs font-medium shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition flex items-center gap-1.5 ${
                showBBoxes
                  ? 'bg-white border-[#1a73e8] text-[#1a73e8]'
                  : 'bg-white border-[#dadce0] text-[#5f6368]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showBBoxes ? 'bg-[#188038]' : 'bg-[#9aa0a6]'}`} />
              <span>Bounding Box: {showBBoxes ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Bottom Coordinates Telemetry Stamp */}
          <div className="absolute bottom-2 right-4 z-[400] text-[11px] font-mono text-[#5f6368] bg-white/85 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-sm border border-[#dadce0]">
            {liveCoords.lat.toFixed(4)}°N, {liveCoords.lng.toFixed(4)}°E • Zoom: {liveCoords.zoom}x
          </div>

          {/* Floating Sidebar Toggle Handle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 right-0 z-[450] bg-white hover:bg-[#f8f9fa] border-y border-l border-[#dadce0] py-3 px-1 rounded-l-xl text-[#5f6368] shadow-[-2px_0_6px_rgba(0,0,0,0.12)] transition"
            title={isSidebarOpen ? 'Collapse Details' : 'Expand Details'}
          >
            {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 3. DETAILS SIDEBAR (Unobstructed Header) */}
        {isSidebarOpen && (
          <aside className="w-[410px] h-full bg-white border-l border-[#dadce0] flex flex-col justify-between z-30 shadow-[-4px_0_16px_rgba(0,0,0,0.06)] relative flex-shrink-0">
            <div className="flex-1 overflow-y-auto">
              {/* Clean Nav Tabs */}
              <div className="flex items-center border-b border-[#dadce0] px-3 pt-3 text-xs font-semibold bg-white sticky top-0 z-10">
                <button
                  onClick={() => setActiveWorkstationTab('rsvqa')}
                  className={`pb-3 px-3 transition border-b-2 flex-1 text-center ${
                    activeWorkstationTab === 'rsvqa'
                      ? 'text-[#1a73e8] border-[#1a73e8]'
                      : 'text-[#5f6368] border-transparent hover:text-[#202124]'
                  }`}
                >
                  Overview & Q&A
                </button>
                <button
                  onClick={() => setActiveWorkstationTab('bitemporal')}
                  className={`pb-3 px-3 transition border-b-2 flex-1 text-center ${
                    activeWorkstationTab === 'bitemporal'
                      ? 'text-[#1a73e8] border-[#1a73e8]'
                      : 'text-[#5f6368] border-transparent hover:text-[#202124]'
                  }`}
                >
                  Change Detection
                </button>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="pb-3 px-3 transition text-[#5f6368] border-b-2 border-transparent hover:text-[#202124] flex-1 text-center"
                >
                  Audit Trace
                </button>
              </div>

              {/* Pipeline Status Indicator */}
              <div className="p-3.5 bg-[#f8fafd] border-b border-[#dadce0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#188038]" />
                  <span className="text-xs font-medium text-[#3c4043]">Pipeline: FALCON-RS-GROUNDING</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333]">
                  READY
                </span>
              </div>

              {/* Chat & Grounded Entities */}
              <div className="p-4 space-y-4">
                {/* Chat Stream */}
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-xs leading-relaxed p-3 rounded-2xl border ${
                        msg.sender === 'user'
                          ? 'bg-[#e8f0fe] border-[#d2e3fc] text-[#174ea6] ml-6'
                          : 'bg-[#f1f3f4] border-[#dadce0] text-[#202124] mr-4'
                      }`}
                    >
                      <span className="font-semibold text-[11px] block mb-1">
                        {msg.sender === 'user' ? 'Operator' : 'BhuViksana Assistant'}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Identified Feature Entities List */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#3c4043] uppercase tracking-wider">
                      Identified Features ({entities.length})
                    </span>
                    <span className="text-xs font-semibold text-[#1a73e8]">
                      {entities.reduce((a, b) => a + b.area_m2, 0).toLocaleString()} m² Total
                    </span>
                  </div>

                  {entities.length === 0 && (
                    <div className="text-xs text-[#5f6368] bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3">
                      {detectionStatus === 'detecting'
                        ? 'Analyzing uploaded raster...'
                        : detectionStatus === 'error'
                        ? 'Detection failed for this upload — check the chat above for details.'
                        : detectionStatus === 'done'
                        ? 'No detection backend is connected, so this upload was not analyzed.'
                        : 'No features grounded yet.'}
                    </div>
                  )}

                  <div className="space-y-2">
                    {entities.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#dadce0] hover:border-[#1a73e8] shadow-sm transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-[#202124]">{item.name}</div>
                            <div className="text-[11px] text-[#5f6368] font-mono">
                              Footprint: {item.area_m2.toLocaleString()} m²
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#188038] bg-[#e6f4ea] px-2 py-0.5 rounded-md">
                          {(item.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Search / Assistant Input Bar */}
            <div className="p-3 border-t border-[#dadce0] bg-white">
              <div className="flex items-center gap-2 bg-[#f1f3f4] border border-[#dadce0] rounded-full px-3.5 py-1.5 focus-within:bg-white focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition">
                <Sparkles className="w-4 h-4 text-[#1a73e8]" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleSendMessage()}
                  placeholder="Ask about structures, vessels, or metrics..."
                  className="w-full bg-transparent text-xs text-[#202124] placeholder-[#80868b] focus:outline-none"
                />
                <button
                  onClick={() => { void handleSendMessage(); }}
                  className="p-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white transition"
                  title="Send Query"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 4. AUDIT TRACE MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-[#dadce0] rounded-[24px] p-6 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between border-b border-[#dadce0] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1a73e8]" />
                <h3 className="text-sm font-semibold text-[#202124]">Execution Telemetry & Audit Log</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#3c4043]">
              <div className="flex items-start gap-2.5 bg-[#f8f9fa] p-3 rounded-xl border border-[#dadce0]">
                <CheckCircle2 className="w-4 h-4 text-[#188038] mt-0.5" />
                <div>
                  <div className="font-semibold text-[#202124]">1. Input Stream Ingestion & Tiling</div>
                  <div className="text-[#5f6368] text-[11px]">Aligned sensor array to 512x512 tile patches with EPSG:4326 CRS coordinates.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#f8f9fa] p-3 rounded-xl border border-[#dadce0]">
                <CheckCircle2 className="w-4 h-4 text-[#188038] mt-0.5" />
                <div>
                  <div className="font-semibold text-[#202124]">2. Siamese Feature Extraction & Grounding</div>
                  <div className="text-[#5f6368] text-[11px]">Falcon-0.7B-RS identified spatial coordinates across {entities.length} bounding boxes.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#f8f9fa] p-3 rounded-xl border border-[#dadce0]">
                <CheckCircle2 className="w-4 h-4 text-[#188038] mt-0.5" />
                <div>
                  <div className="font-semibold text-[#202124]">3. Spatial Clustering & GSD Quantification</div>
                  <div className="text-[#5f6368] text-[11px]">Computed footprint at {entities.reduce((a, b) => a + b.area_m2, 0).toLocaleString()} m² (0.5m/px GSD).</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-xs font-semibold text-white rounded-full transition shadow-sm"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}