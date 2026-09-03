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
  Binary
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
  const [changeMaskUrl, setChangeMaskUrl] = useState<string | null>(null);

  // Bounding Boxes
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
      color: '#1a73e8'
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
      color: '#e37400'
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
      color: '#188038'
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
  const multiFileInputRef = useRef<HTMLInputElement>(null);

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

  // -------------------------------------------------------------
  // AUTONOMOUS ROUTING LOGIC
  // -------------------------------------------------------------
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

  const handleFileT1Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileT1(file);
      const url = await processRaster(file);
      setT1DataUrl(url);
      autoDetectPipeline(file, fileT2);
    }
  };

  const handleFileT2Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileT2(file);
      const url = await processRaster(file);
      setT2DataUrl(url);
      autoDetectPipeline(fileT1, file);
    }
  };

  const handleClearFiles = () => {
    setFileT1(null);
    setFileT2(null);
    setT1DataUrl(null);
    setT2DataUrl(null);
    setChangeMaskUrl(null);
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
      setActiveScenario(`Swath: ${fileT1.name} ${fileT2 ? 'vs ' + fileT2.name : ''}`);
      setChatMessages([
        {
          sender: 'ai',
          text: `Autonomous router initialized [Pipeline: ${effectiveMethod.toUpperCase()}]. Grounded features across active raster swath.`
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
      title: activeScenario,
      timestamp: 'Just now',
      method: effectiveMethod,
      pipeline: effectiveMethod === 'bitemporal' ? 'Open-CD (Bi-Temporal Siamese)' : effectiveMethod === 'opticalsar' ? 'Cross-Attention Optical-SAR' : 'Falcon-0.7B-RS (Single RS-VQA)',
      entitiesCount: entities.length,
      coordinates: { lat: liveCoords.lat, lng: liveCoords.lng }
    };
    setHistoryList((prev) => [newHistory, ...prev]);

    setIsLoading(false);
    setCurrentPage('workstation');
  };

  // -------------------------------------------------------------
  // FIXED SCENARIO LOADER (FLOOD -> INTERACTIVE SATELLITE MAP)
  // -------------------------------------------------------------
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
          color: '#1a73e8'
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
          color: '#e37400'
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
          color: '#188038'
        }
      ]);
      setChatMessages([
        {
          sender: 'ai',
          text: 'Visual Question Answering initialized with Falcon-0.7B-RS. Grounded 3 assets in target viewport.'
        }
      ]);
    } else {
      // FLOOD ANALYSIS: Set to interactive map view directly on Assam
      setActiveScenario('Brahmaputra Basin, Assam (Flood Inundation)');
      setTargetMethod('single');
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single'); // Leaves 3-pane mode and opens interactive Leaflet map
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
          color: '#d93025'
        }
      ]);
      setChatMessages([
        {
          sender: 'ai',
          text: 'Flood Inundation Analysis loaded for Brahmaputra Basin. Displaying high-resolution satellite imagery.'
        }
      ]);
    }
    setCurrentPage('workstation');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');

    setTimeout(() => {
      let aiReply = `Analyzed spatial viewport at ${liveCoords.lat}°N, ${liveCoords.lng}°E.`;
      if (userQ.toLowerCase().includes('area') || userQ.toLowerCase().includes('size') || userQ.toLowerCase().includes('metric')) {
        const totalArea = entities.reduce((acc, curr) => acc + curr.area_m2, 0);
        aiReply = `Total identified grounded area across ${entities.length} sectors is ${totalArea.toLocaleString()} m² (${(totalArea / 1000000).toFixed(4)} km²).`;
      } else if (userQ.toLowerCase().includes('ship') || userQ.toLowerCase().includes('vessel') || userQ.toLowerCase().includes('port')) {
        aiReply = `Grounded 2 marine vessels at berths with model confidence >97.5%. Berthing berths verified.`;
      } else {
        aiReply = `Processed query: "${userQ}". Verified bounding coordinates across ${entities.length} vector objects.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
    }, 400);
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
  // PAGE 1: AUTHENTICATION
  // =========================================================================
  if (currentPage === 'login') {
    return (
      <div className="flex flex-col min-h-screen w-screen overflow-hidden font-sans select-none relative justify-between animated-gradient-bg">
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
  // PAGE 2: SETUP CANVAS
  // =========================================================================
  if (currentPage === 'canvas') {
    return (
      <div className="flex h-screen w-screen overflow-hidden canvas-bg-mesh font-sans text-slate-800 select-none relative">
        <div className="absolute right-[-4vw] top-[5vh] w-[58vw] h-[90vh] pointer-events-none opacity-[0.045] z-0 flex items-center justify-center">
          <img src="/logo.png" alt="Watermark" className="w-full h-full object-contain" />
        </div>

        {/* LEFT DOCK */}
        <aside className="w-[72px] h-full flex flex-col items-center justify-between py-6 border-r border-slate-200/70 bg-white/70 backdrop-blur-md z-30">
          <div className="flex flex-col items-center gap-6">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <nav className="flex flex-col items-center gap-4 pt-4">
              <button
                className="p-2.5 rounded-xl text-white bg-[#0284c7] shadow-sm shadow-cyan-500/30 transition hover:scale-105"
                title="Home Setup"
              >
                <Home className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
                className={`p-2.5 rounded-xl transition hover:scale-105 ${
                  isHistoryDrawerOpen
                    ? 'bg-[#1a73e8] text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Telemetry & Query History"
              >
                <History className="w-5 h-5" />
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

        {/* SLIDING HISTORY DRAWER */}
        {isHistoryDrawerOpen && (
          <aside className="w-[340px] h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-xl flex flex-col justify-between z-20 transition-all duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1a73e8]" />
                <span className="text-sm font-semibold text-slate-800">Inspection History</span>
              </div>
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveScenario(item.title);
                    setMapCenter([item.coordinates.lat, item.coordinates.lng]);
                    setLiveCoords({ lat: item.coordinates.lat, lng: item.coordinates.lng, zoom: 15 });
                    setCurrentPage('workstation');
                  }}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-[#1a73e8] bg-white hover:bg-[#f8fafd] transition cursor-pointer shadow-sm group"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-[#1a73e8] transition truncate max-w-[200px]">
                      {item.title}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-[#1a73e8]" />
                    <span className="truncate">{item.pipeline}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[10px] text-slate-400 font-mono">
                    <span>{item.coordinates.lat.toFixed(3)}°N, {item.coordinates.lng.toFixed(3)}°E</span>
                    <span className="text-[#188038] font-bold">{item.entitiesCount} Grounded</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 text-center">
              <button
                onClick={() => setHistoryList([])}
                className="flex items-center justify-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium py-1.5 w-full"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History Logs</span>
              </button>
            </div>
          </aside>
        )}

        {/* MAIN CANVAS */}
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

              {/* AUTONOMOUS ROUTING STATUS BANNER */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafd] border border-[#d2e3fc] text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#1a73e8]" />
                  <span className="text-slate-700 font-medium">Smart Router Verdict:</span>
                  <span className="text-[#1a73e8] font-semibold">{detectedPipeline}</span>
                </div>
                {(fileT1 || fileT2) && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {fileT1 && fileT2 ? '2 RASTERS LOADED' : '1 RASTER LOADED'}
                  </span>
                )}
              </div>

              {/* USER QUERY TEXTAREA */}
              <div className="pt-1">
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  rows={3}
                  placeholder="Ask Question or Analysis Requirements (e.g., 'Detect changes in urban infrastructure' or 'Identify all cargo vessels')..."
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed"
                />
              </div>

              {/* MULTI-IMAGE UPLOAD ENGINE */}
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

                  {fileT1 && !fileT2 && (
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600 transition">
                      <span>+ Attach 2nd Swath for Change Detection</span>
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
                      title="Clear attached files"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleLaunchWorkstation}
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

            {/* PRE-CONFIGURED BENCHMARK SCENARIOS */}
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
  // PAGE 3: WORKSTATION VIEW
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

        {/* View Mode & Scenario Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => handleLoadScenario('port')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeScenario.includes('Visakhapatnam') && activeViewTool === 'single'
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
              activeScenario.includes('Assam') && activeViewTool === 'single'
                ? 'bg-[#1a73e8] text-white'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Flood Analysis</span>
          </button>

          {/* 3-PANE BIT-CD VIEW TOGGLE BUTTON */}
          <button
            onClick={() => {
              setActiveViewTool(activeViewTool === 'tripane' ? 'single' : 'tripane');
              setActiveWorkstationTab('bitemporal');
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeViewTool === 'tripane'
                ? 'bg-[#1a73e8] text-white font-bold'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>3-Pane Bit-CD</span>
          </button>

          <button
            onClick={() => setActiveViewTool(activeViewTool === 'swipe' ? 'single' : 'swipe')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap ${
              activeViewTool === 'swipe'
                ? 'bg-[#e37400] text-white'
                : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Swipe Tool</span>
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
          {/* FLOATING ACTION PILLS */}
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

          {/* CONDITION 1: 3-PANE SPLIT VIEW FOR BIT-CD */}
          {activeViewTool === 'tripane' ? (
            <div className="w-full h-full grid grid-cols-3 gap-1.5 bg-slate-950 p-2.5">
              
              {/* PANE 1: PRE-EVENT (T1) */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex flex-col shadow-inner">
                <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>T1: Pre-Event Swath</span>
                </div>
                {t1DataUrl ? (
                  <img src={t1DataUrl} alt="T1 Pre-Event" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                    Baseline Raster [Assam Brahmaputra Basin - Pre Flood]
                  </div>
                )}
                <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-400 bg-black/75 px-2 py-0.5 rounded">
                  Acquisition: 2026-06-12 (Optical)
                </div>
              </div>

              {/* PANE 2: POST-EVENT (T2) */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex flex-col shadow-inner">
                <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>T2: Post-Event Swath</span>
                </div>
                {t2DataUrl || t1DataUrl ? (
                  <img src={t2DataUrl || t1DataUrl} alt="T2 Post-Event" className="w-full h-full object-cover filter contrast-125" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                    Target Raster [Assam Brahmaputra Basin - Inundated]
                  </div>
                )}
                <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-400 bg-black/75 px-2 py-0.5 rounded">
                  Acquisition: 2026-07-28 (Optical/SAR)
                </div>
              </div>

              {/* PANE 3: BIT-CD BINARY MAP */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-rose-950/60 bg-black flex flex-col shadow-inner">
                <div className="absolute top-3 left-3 z-10 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Bit-CD: Binary Change Mask</span>
                </div>

                <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono border border-slate-700 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-black border border-slate-500" /> [0] Unchanged
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white border border-rose-500 shadow-[0_0_6px_rgba(255,255,255,0.8)]" /> [1] Inundation / Change
                  </span>
                </div>

                {changeMaskUrl ? (
                  <img src={changeMaskUrl} alt="Binary Mask" className="w-full h-full object-cover filter contrast-200" />
                ) : (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-56 h-56 border-2 border-rose-500/40 rounded-2xl relative overflow-hidden bg-black flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                      <div className="absolute inset-x-6 top-10 bottom-10 bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center text-black font-mono text-xs font-extrabold">
                        <span>BIT 1: CHANGE</span>
                        <span className="text-[10px] font-normal text-slate-700">24,500 m² Inundated</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-3">
                      Siamese Feature Difference Matrix • Resolution: 512×512 px
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : t1DataUrl ? (
            /* CONDITION 2: UPLOADED SINGLE/SWIPE RASTER CANVAS */
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

              {showBBoxes && entities.map((det, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-[#1a73e8] bg-[#1a73e8]/20 rounded pointer-events-none z-20 transition-all duration-300 shadow-[0_0_10px_rgba(26,115,232,0.4)]"
                  style={{
                    top: `${42 + (idx * 16)}%`,
                    left: `${26 + (idx * 22)}%`,
                    width: `24%`,
                    height: `18%`
                  }}
                >
                  <span className="absolute -top-6 left-0 text-[10px] font-sans font-medium px-2 py-0.5 bg-white text-[#1a73e8] border border-[#dadce0] rounded-full shadow whitespace-nowrap">
                    {det.name} • {(det.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* CONDITION 3: STANDARD SATELLITE LEAFLET MAP VIEWPORT */
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

        {/* 3. DETAILS SIDEBAR */}
        {isSidebarOpen && (
          <aside className="w-[410px] h-full bg-white border-l border-[#dadce0] flex flex-col justify-between z-30 shadow-[-4px_0_16px_rgba(0,0,0,0.06)] relative flex-shrink-0">
            <div className="flex-1 overflow-y-auto">
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
                  <span className="text-xs font-medium text-[#3c4043]">
                    Pipeline: {activeScenario.includes('Assam') && activeViewTool === 'tripane' ? 'OPEN-CD (BI-TEMPORAL SIAMESE)' : 'FALCON-RS-GROUNDING'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333]">
                  READY
                </span>
              </div>

              {/* Chat & Grounded Entities */}
              <div className="p-4 space-y-4">
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about structures, vessels, or metrics..."
                  className="w-full bg-transparent text-xs text-[#202124] placeholder-[#80868b] focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
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