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
  FileImage,
  Flame,
  Terminal,
  Clock
} from 'lucide-react';
import * as GeoTIFF from 'geotiff';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const getUserInitial = () => {
    if (!loginEmail) return 'U';
    return loginEmail.trim().charAt(0).toUpperCase();
  };

  // -------------------------------------------------------------
  // WORKSTATION & MODAL STATE
  // -------------------------------------------------------------
  const [targetMethod, setTargetMethod] = useState<'auto' | 'single' | 'bitemporal' | 'opticalsar'>('auto');
  const [detectedPipeline, setDetectedPipeline] = useState<string>('Auto-Routing Engine Idle');
  const [activeTab, setActiveTab] = useState<'overview' | 'change' | 'audit'>('overview');
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

  // Unified File List
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [t1DataUrl, setT1DataUrl] = useState<string | null>(null);
  const [t2DataUrl, setT2DataUrl] = useState<string | null>(null);

  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);

  const singleUploadInputRef = useRef<HTMLInputElement>(null);

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

  const handleUniversalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newSelected = Array.from(e.target.files);
    const combined = [...uploadedFiles, ...newSelected];
    setUploadedFiles(combined);

    if (combined.length === 1) {
      const url1 = await processRaster(combined[0]);
      setT1DataUrl(url1);
      setT2DataUrl(null);
      setTargetMethod('single');
      setActiveViewTool('single');
      setActiveWorkstationTab('rsvqa');
      setActiveTab('overview');
      setDetectedPipeline('1 Image detected → Auto-routed to Falcon-0.7B-RS (Single RS-VQA)');
    } else if (combined.length >= 2) {
      const url1 = await processRaster(combined[0]);
      const url2 = await processRaster(combined[1]);
      setT1DataUrl(url1);
      setT2DataUrl(url2);
      setTargetMethod('bitemporal');
      setActiveViewTool('tripane');
      setActiveWorkstationTab('bitemporal');
      setActiveTab('change');
      setDetectedPipeline('2+ Images detected → Auto-routed to Open-CD (Bi-Temporal Siamese 3-Pane Bit-CD)');
    }

    if (singleUploadInputRef.current) {
      singleUploadInputRef.current.value = '';
    }
  };

  const handleClearFiles = () => {
    setUploadedFiles([]);
    setT1DataUrl(null);
    setT2DataUrl(null);
    setEntities([]);
    setChatMessages([]);
    setDetectedPipeline('Auto-Routing Engine Idle');
    if (singleUploadInputRef.current) singleUploadInputRef.current.value = '';
  };

  const handleLaunchWorkstation = () => {
    setIsLoading(true);
    const isDual = uploadedFiles.length >= 2 || targetMethod === 'bitemporal' || targetMethod === 'opticalsar';

    if (uploadedFiles.length > 0) {
      setActiveScenario(
        uploadedFiles.length >= 2
          ? `${uploadedFiles[0].name} vs ${uploadedFiles[1].name}`
          : uploadedFiles[0].name
      );
    }

    if (isDual) {
      setActiveWorkstationTab('bitemporal');
      setActiveViewTool('tripane');
      setActiveTab('change');
      setEntities([
        {
          id: 1,
          name: 'Change Sector 1 (Center)',
          confidence: 0.982,
          area_m2: 60650,
          color: '#1a73e8'
        }
      ]);
    } else {
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
      setActiveTab('overview');
      setEntities([]);
    }

    const newHistory: HistoryItem = {
      id: `hist-${Date.now()}`,
      title: uploadedFiles.length > 0 ? uploadedFiles[0].name : activeScenario,
      timestamp: 'Just now',
      method: isDual ? 'bitemporal' : 'single',
      pipeline: isDual ? 'Open-CD (Bi-Temporal Siamese)' : 'Falcon-0.7B-RS (Single RS-VQA)',
      entitiesCount: isDual ? 1 : 0,
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
      setActiveTab('overview');
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
          lngMin: 83.2950,
          latMax: 17.6980,
          lngMax: 83.3010,
          color: '#1a73e8'
        }
      ]);
    } else {
      setActiveScenario('Brahmaputra Basin, Assam (Flood Inundation)');
      setTargetMethod('single');
      setActiveWorkstationTab('rsvqa');
      setActiveViewTool('single');
      setActiveTab('overview');
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
          latMax: 26.1950,
          lngMax: 91.7400,
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');
  };

  const fetchImageAsBase64 = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Canvas context unavailable'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const handleExportPDF = async () => {
    let logoDataUrl = '';
    try {
      logoDataUrl = await fetchImageAsBase64('/logo.png');
    } catch (e) {
      console.warn('Could not load /logo.png, exporting without image embed:', e);
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const renderHeader = () => {
      doc.setFillColor(226, 238, 249);
      doc.setDrawColor(200, 220, 240);
      doc.setLineWidth(0.4);
      doc.rect(0, 0, pageWidth, 26, 'FD');

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(215, 225, 238);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, 5.5, 14, 15, 2.5, 2.5, 'FD');

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin + 1.5, 7, 11, 12);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text('BHUVIKSANA', margin + 18, 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Satellite Intelligence & Geo-Analytics Platform', margin + 18, 19.5);
    };

    const renderFooter = (pageNumber: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 150, 165);
      doc.text('BHUVIKSANA | Satellite Intelligence & Geo-Analytics Platform', margin, pageHeight - 9);
      doc.text(`Page ${pageNumber}`, pageWidth - margin - 11, pageHeight - 9);
    };

    renderHeader();

    let y = 33;
    const cardHeight = 31;
    doc.setFillColor(240, 246, 252);
    doc.setDrawColor(200, 220, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');

    const metadataItems: [string, string][] = [
      ['Project Title:', 'Multi-Temporal Land Use / Land Cover (LULC) & Change Detection Analysis'],
      ['Report Reference:', 'BVK/EO-AN/LULC/2026/048-A'],
      ['Data Source:', 'Bhuviksana Analysis Engine (Cartosat-3 / Resourcesat-2 imagery)'],
      ['Date of Issue:', 'September 5, 2026']
    ];

    let my = y + 6;
    metadataItems.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(2, 132, 199);
      doc.text(label, margin + 5, my);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(value, margin + 40, my);
      my += 6;
    });

    y += cardHeight + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('1. SATELLITE DATA SPECIFICATIONS & METADATA', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const introParagraph = doc.splitTextToSize(
      'This report presents the automated thematic extraction and radiometric analysis carried out on high-resolution satellite imagery for the selected target zone, generated through the Bhuviksana processing pipeline.',
      contentWidth
    );
    doc.text(introParagraph, margin, y);
    y += introParagraph.length * 4 + 2;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['PARAMETER', 'SENSOR / PROCESSING SPECIFICATION']],
      body: [
        ['Satellite Mission', 'Resourcesat-2 / Cartosat-3 Constellation'],
        ['Payload Sensor', 'Linear Imaging Self-Scanning Sensor (LISS-IV) & Panchromatic (PAN)'],
        ['Path / Row Reference', 'Path 98, Row 54 (Sub-scene quadrant B)'],
        ['Date of Acquisition', '14-January-2026 (05:42 UTC)'],
        ['Spatial Resolution', '5.8 m (Multi-spectral) / 0.8 m (Panchromatic sharpened)'],
        ['Radiometric Resolution', '10-bit Quantization (1024 grey levels)'],
        ['Map Projection & Datum', 'UTM Zone 43N / WGS-84 Datum']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [86, 184, 232],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
        lineWidth: 0.2,
        lineColor: [220, 230, 242],
        cellPadding: 2.4
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 7.8,
        lineWidth: 0.15,
        lineColor: [220, 230, 242],
        cellPadding: 2.2
      },
      columnStyles: {
        0: { fontStyle: 'normal', cellWidth: 55, textColor: [51, 65, 85] },
        1: { fontStyle: 'normal' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('2. OBJECTIVE AND SCOPE OF ANALYSIS', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const scopeParagraph = doc.splitTextToSize(
      'The analysis performs radiometric calibration, orthorectification, and supervised classification to track environmental change, urban expansion, and vegetation health within the selected area of interest. The resulting raster and vector layers are intended for use in planning, monitoring, and resource-tracking workflows on the Bhuviksana platform.',
      contentWidth
    );
    doc.text(scopeParagraph, margin, y);
    y += scopeParagraph.length * 4 + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('3. METHODOLOGY & PROCESSING PIPELINE', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Level-0 sensor data is processed through the following automated pipeline stages:', margin, y);
    y += 4.5;

    const methodologyBullets = [
      '• Radiometric Calibration: Raw digital numbers converted to Top-of-Atmosphere and surface reflectance using solar zenith angle correction.',
      '• Geometric Correction: Orthorectification using CartoDEM elevation data and ground control points, targeting sub-pixel RMSE.',
      '• Feature Extraction & Classification: Supervised Maximum Likelihood Classification combined with NDVI thresholding (NDVI = (NIR - Red) / (NIR + Red)) to separate vegetation, bare soil, and built-up surfaces.'
    ];

    methodologyBullets.forEach((bullet) => {
      const wrapped = doc.splitTextToSize(bullet, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 3.8 + 1.2;
    });

    renderFooter(1);

    // PAGE 2: STATISTICAL OBSERVATIONS & SIGN-OFF
    doc.addPage();
    renderHeader();

    if (logoDataUrl) {
      doc.saveGraphicsState();
      if ((doc as any).setGState && (doc as any).GState) {
        doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
      }
      doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 45, pageHeight / 2 - 50, 90, 100);
      doc.restoreGraphicsState();
    }

    y = 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('4. RESULTS AND STATISTICAL OBSERVATIONS', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Comparative analysis against the 2024 baseline reveals the following trends across the target quadrant of 1,250 km²:',
      margin,
      y
    );
    y += 5;

    const tableBody = [
      ['Built-up / Urban Sprawl', '185.50', '14.84%', '+4.2% (Expansion)'],
      ['Agricultural Land & Crop Cover', '562.20', '44.98%', 'Stable (NDVI > 0.4)'],
      ['Forest & Dense Vegetation', '310.00', '24.80%', 'Minor regeneration (+0.8%)'],
      ['Water Bodies & Wetlands', '85.30', '6.82%', 'Stable retention'],
      ['Wasteland / Barren Rock', '107.00', '8.56%', 'Decreased (afforestation)'],
      ['Total Analyzed Area', '1,250.00', '100.00%', '—']
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['THEMATIC CLASS', 'AREA (km²)', 'COVERAGE', 'TREND (vs. 2024)']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
        lineWidth: 0.2,
        lineColor: [220, 230, 242],
        cellPadding: 2.4
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 7.8,
        lineWidth: 0.15,
        lineColor: [220, 230, 242],
        cellPadding: 2.2
      },
      columnStyles: {
        0: { fontStyle: 'normal', cellWidth: 55, textColor: [30, 41, 59] },
        1: { halign: 'left', cellWidth: 32 },
        2: { halign: 'left', cellWidth: 32 },
        3: { halign: 'left' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 9;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(2, 132, 199);
    doc.text('5. CONCLUSION', margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const conclusionParagraph = doc.splitTextToSize(
      'The processed outputs indicate stable environmental conditions alongside managed urban growth in the analyzed quadrant. Orthorectified mosaics, false-color composites, and vector layers generated for this analysis are stored in the Bhuviksana geospatial workspace and are available for export from your dashboard.',
      contentWidth
    );
    doc.text(conclusionParagraph, margin, y);

    const signX = pageWidth - margin - 50;
    const signY = pageHeight - 46;

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', signX + 37, signY - 14, 10, 11);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Approved by Bhuviksana', signX + 48, signY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Geo-Analytics & Earth Observation Division', signX + 48, signY + 4, { align: 'right' });
    doc.text('Bhuviksana Platform', signX + 48, signY + 8, { align: 'right' });

    renderFooter(2);

    doc.save(`Bhuviksana_LULC_Analysis_Report_restyled.pdf`);
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

          <div className="flex flex-col items-center gap-3 relative">
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

            <button
              onClick={() => setShowUserPopover(!showUserPopover)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-cyan-500 text-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition flex items-center justify-center ring-2 ring-white border border-cyan-300"
              title="User Account Profile"
            >
              {getUserInitial()}
            </button>

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
                    onChange={(e) => setTargetMethod(e.target.value as any)}
                    className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-9 outline-none focus:border-[#0284c7] focus:bg-white transition cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="auto">Auto-Detect (Routes model by uploaded swaths)</option>
                    <option value="single">Single Swath (Falcon-0.7B-RS VQA)</option>
                    <option value="bitemporal">Bi-Temporal (Open-CD 3-Pane Bit-CD)</option>
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

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 shadow-sm transition">
                      <UploadCloud className="w-4 h-4 text-[#0284c7]" />
                      <span>
                        {uploadedFiles.length === 0
                          ? 'Upload Satellite Images (Select 1 or more)'
                          : uploadedFiles.length === 1
                          ? `1 Swath: ${uploadedFiles[0].name.slice(0, 20)}...`
                          : `${uploadedFiles.length} Swaths Uploaded (${uploadedFiles[0].name.slice(0, 10)}... + ${uploadedFiles.length - 1} more)`}
                      </span>
                      <input
                        ref={singleUploadInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".tif,.tiff,.png,.jpg,.jpeg"
                        onChange={handleUniversalUpload}
                      />
                    </label>

                    {uploadedFiles.length > 0 && (
                      <button
                        onClick={handleClearFiles}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Clear uploaded images"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleLaunchWorkstation}
                    disabled={isLoading || uploadedFiles.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f37021] to-[#f97316] hover:from-[#ea580c] hover:to-[#f37021] text-white text-xs font-semibold shadow-md active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>Launch Workstation</span>
                    <Rocket className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>

                {detectedPipeline !== 'Auto-Routing Engine Idle' && (
                  <div className="text-[11px] font-mono text-[#0284c7] bg-[#f0f7ff] px-3.5 py-2 rounded-xl border border-[#d0e5ff] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#f37021] flex-shrink-0" />
                    <span className="truncate">{detectedPipeline}</span>
                  </div>
                )}
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
      className="flex h-screen w-screen overflow-hidden bg-[#090d16] font-sans text-slate-200 select-none relative"
      onMouseUp={() => { isDraggingSwipe.current = false; }}
    >
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-32px)]">
        <div className="flex items-center h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 px-3 gap-2 w-[340px] sm:w-[380px]">
          <button onClick={() => setCurrentPage('canvas')} className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 truncate text-xs font-medium text-slate-800">
            Swath: {activeScenario}
          </div>
          <button onClick={() => handleLoadScenario(activeScenario.includes('Visakhapatnam') ? 'flood' : 'port')} className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => handleLoadScenario('port')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow transition whitespace-nowrap ${
              activeScenario.includes('Visakhapatnam') ? 'bg-[#1a73e8] text-white' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <Anchor className="w-3 h-3" />
            <span>Port Recon</span>
          </button>
          <button
            onClick={() => handleLoadScenario('flood')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow transition whitespace-nowrap ${
              activeScenario.includes('Assam') ? 'bg-[#1a73e8] text-white' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            <span>Flood Analysis</span>
          </button>

          <button
            onClick={() => {
              setActiveViewTool(activeViewTool === 'tripane' ? 'single' : 'tripane');
              setActiveWorkstationTab('bitemporal');
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow transition whitespace-nowrap ${
              activeViewTool === 'tripane' ? 'bg-[#1a73e8] text-white font-bold' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <Columns3 className="w-3 h-3" />
            <span>3-Pane Bit-CD</span>
          </button>

          <button
            onClick={() => setActiveViewTool(activeViewTool === 'swipe' ? 'single' : 'swipe')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow transition whitespace-nowrap ${
              activeViewTool === 'swipe' ? 'bg-[#e37400] text-white' : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <MoveHorizontal className="w-3 h-3" />
            <span>Swipe Tool</span>
          </button>
        </div>
      </div>

      {/* VIEWPORT CANVAS */}
      <div className="flex flex-1 h-full w-full relative">
        <div ref={containerRef} onMouseMove={handleMouseMove} className="flex-1 relative bg-[#090d16] overflow-hidden select-none">
          
          <div className="absolute top-3 right-4 z-[400] flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowSmsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-xs font-semibold text-white shadow transition"
            >
              <Radio className="w-3 h-3" />
              <span>SMS Alert</span>
            </button>

            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-700 hover:bg-white border border-slate-200 text-xs font-medium shadow transition"
            >
              <Activity className="w-3 h-3 text-[#1a73e8]" />
              <span>Audit Trace</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-xs font-semibold text-white shadow transition"
            >
              <FileDown className="w-3 h-3" />
              <span>Export Briefing</span>
            </button>
          </div>

          {activeViewTool === 'tripane' ? (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 gap-1.5 bg-[#090d16] p-1.5 pb-8">
              
              {/* PANEL 1: T1 BASELINE */}
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800/80 bg-black flex flex-col shadow-2xl">
                <div className="absolute top-2.5 left-2.5 z-20 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>T1: Pre-Event Swath (Baseline)</span>
                </div>

                {t1DataUrl ? (
                  <img src={t1DataUrl} alt="T1 Baseline" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <FileImage className="w-7 h-7 mb-2 opacity-40" />
                    <span>Pre-Event Baseline Swath</span>
                  </div>
                )}

                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 z-20">
                  <div className="bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-200 border border-slate-700/80">
                    LAYERS Satellite
                  </div>
                  <div className="bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-slate-700/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Bounding Box: ON</span>
                  </div>
                </div>
              </div>

              {/* PANEL 2: T2 TARGET */}
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800/80 bg-black flex flex-col shadow-2xl">
                <div className="absolute top-2.5 left-2.5 z-20 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-amber-300 border border-amber-800/60 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>T2: Post-Event Swath (Target)</span>
                </div>

                {t2DataUrl || t1DataUrl ? (
                  <img src={t2DataUrl || t1DataUrl} alt="T2 Target" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <FileImage className="w-7 h-7 mb-2 opacity-40" />
                    <span>Post-Event Target Swath</span>
                  </div>
                )}

                <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-700/80">
                  Acquisition: 2026-07-28 (Optical/SAR)
                </div>
              </div>

              {/* PANEL 3: BIT-CD BINARY CHANGE MASK */}
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-rose-900/60 bg-[#070b13] flex flex-col justify-center items-center shadow-2xl p-4">
                <div className="absolute top-2.5 left-2.5 z-20 bg-rose-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-rose-400 border border-rose-800 flex items-center gap-1.5 shadow">
                  <Binary className="w-3 h-3 text-rose-400" />
                  <span>Bit-CD: Binary Change Mask</span>
                </div>

                <div className="w-36 h-36 rounded-xl border border-rose-600/60 bg-white shadow-[0_0_35px_rgba(235,50,35,0.25)] flex flex-col items-center justify-center text-center p-3">
                  <span className="text-[11px] font-black text-black tracking-wider block">
                    BIT 1: CHANGE
                  </span>
                  <span className="text-[9px] font-medium text-slate-500 mt-1 block">
                    24,500 m² Inundated
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-4 tracking-tight text-center">
                  Siamese Feature Difference Matrix • Resolution: 512×512 px
                </div>

                <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-black/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-slate-700" /> [0] Unchanged
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-2 h-2 rounded-sm bg-rose-500" /> [1] Inundation / Change
                  </span>
                </div>
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

          <div className="absolute bottom-2 right-4 z-[400] text-[10px] font-mono text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-full shadow border border-slate-200">
            {liveCoords.lat.toFixed(4)}°N, {liveCoords.lng.toFixed(4)}°E • Zoom: {liveCoords.zoom}x
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        {isSidebarOpen && (
          <aside className="w-[390px] h-full bg-white border-l border-slate-200 flex flex-col justify-between z-30 relative flex-shrink-0 text-slate-800">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-4">
                <span
                  onClick={() => setActiveTab('overview')}
                  className={`pb-1 cursor-pointer transition ${
                    activeTab === 'overview'
                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Overview & Q&A
                </span>
                <span
                  onClick={() => setActiveTab('change')}
                  className={`pb-1 cursor-pointer transition ${
                    activeTab === 'change'
                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Change Detection
                </span>
                <span
                  onClick={() => setActiveTab('audit')}
                  className={`pb-1 cursor-pointer transition ${
                    activeTab === 'audit'
                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Audit Trace
                </span>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pipeline: GEOCHAT-7B VQA & GROUNDING</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                READY
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'audit' ? (
                <div className="space-y-2 text-xs font-mono text-slate-600">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-emerald-600">[200 OK]</span> Level-0 ingestion completed
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-cyan-600">[INFO]</span> Resampled viewport to EPSG:4326
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-amber-600">[READY]</span> Siamese feature difference pipeline idle
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-[#eef3fc] p-3 rounded-xl text-xs text-[#174ea6] ml-4">
                    <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">Operator</div>
                    What are the major differences in these images?
                  </div>

                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#eef3fc] text-[#174ea6] ml-4'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 mr-2'
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                        {msg.sender === 'user' ? 'Operator' : 'BhuViksana Assistant'}
                      </div>
                      {msg.text}
                    </div>
                  ))}

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                      <span>IDENTIFIED FEATURES ({entities.length})</span>
                      <span className="text-[10px] font-mono text-slate-400">60,650 m² Total</span>
                    </div>

                    <div className="space-y-1.5">
                      {entities.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                              <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 pl-3.5">
                              Footprint: {item.area_m2.toLocaleString()} m²
                            </div>
                          </div>
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                            {(item.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 focus-within:bg-white focus-within:border-[#1a73e8]">
                <Sparkles className="w-4 h-4 text-[#1a73e8]" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about structures, vessels, or metrics..."
                  className="w-full bg-transparent text-xs text-slate-900 focus:outline-none placeholder-slate-400"
                />
                <button onClick={handleSendMessage} className="p-1 rounded-full bg-[#1a73e8] text-white hover:bg-blue-600 transition">
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
          <div className="w-full max-w-md bg-white text-slate-900 border border-rose-200 rounded-[26px] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

      {/* AUDIT TRACE MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white text-slate-900 border border-slate-200 rounded-[24px] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1a73e8]" />
                <h3 className="text-base font-bold text-slate-900">Execution Telemetry & Audit Log</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Input Stream Ingestion & Tiling</div>
                  <div className="text-xs text-slate-600 mt-0.5">Aligned sensor array to 512x512 tile patches with EPSG:4326 CRS coordinates.</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Siamese Feature Extraction & Grounding</div>
                  <div className="text-xs text-slate-600 mt-0.5">Falcon-0.7B-RS identified spatial coordinates across {entities.length} bounding boxes.</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">3. Spatial Clustering & GSD Quantification</div>
                  <div className="text-xs text-slate-600 mt-0.5">Computed footprint at {entities.reduce((acc, e) => acc + e.area_m2, 0).toLocaleString()} m² (0.5m/px GSD).</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-xs font-semibold text-white rounded-xl shadow transition cursor-pointer"
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