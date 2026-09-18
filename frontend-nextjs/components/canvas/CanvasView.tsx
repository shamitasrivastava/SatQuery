'use client';

import React, { useRef } from 'react';
import {
  Home,
  History,
  LogOut,
  ChevronDown,
  Cpu,
  X,
  Rocket,
  Sparkles,
  Loader2,
  Maximize2,
  Plus,
  Upload,
  Settings
} from 'lucide-react';
import UserProfilePopover from '../modals/UserProfilePopover';
import HistoryDrawer, { HistoryItem } from './HistoryDrawer';
import InlineAssistantCard from './InlineAssistantCard';

interface CanvasViewProps {
  loginEmail: string;
  agencyCode: string;
  userInitial: string;
  showUserPopover: boolean;
  setShowUserPopover: (val: boolean) => void;
  isHistoryDrawerOpen: boolean;
  setIsHistoryDrawerOpen: (val: boolean) => void;
  historyList: HistoryItem[];
  setHistoryList: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  onSelectHistory: (item: HistoryItem) => void;
  onNavigateResetPassword: () => void;
  onSignOut: () => void;
  targetMethod: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  setTargetMethod: (method: 'auto' | 'single' | 'bitemporal' | 'opticalsar') => void;
  detectedPipeline: string;
  queryText: string;
  setQueryText: (text: string) => void;
  fileT1: File | null;
  fileT2: File | null;
  t1DataUrl?: string | null;
  t2DataUrl?: string | null;
  onRemoveT1: () => void;
  onRemoveT2: () => void;
  handleMultiFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileT2Change: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearFiles: () => void;
  isLoading: boolean;
  handleLaunchWorkstation: () => void;
  canvasResponse: any;
  setCanvasResponse: (val: any) => void;
  onNavigateWorkstation: () => void;
  autoDetectPipeline: (f1: File | null, f2: File | null) => void;
}

const MODEL_OPTIONS: { value: 'auto' | 'single' | 'bitemporal' | 'opticalsar'; label: string }[] = [
  { value: 'auto', label: 'Model (Autodetect)' },
  { value: 'single', label: 'Model (Single Satellite Imagery)' },
  { value: 'bitemporal', label: 'Model (Bi-Temporal Change Detection)' },
  { value: 'opticalsar', label: 'Model (Optical & SAR Fusion)' }
];

export default function CanvasView({
  loginEmail,
  agencyCode,
  userInitial,
  showUserPopover,
  setShowUserPopover,
  isHistoryDrawerOpen,
  setIsHistoryDrawerOpen,
  historyList,
  setHistoryList,
  onSelectHistory,
  onNavigateResetPassword,
  onSignOut,
  targetMethod,
  setTargetMethod,
  detectedPipeline,
  queryText,
  setQueryText,
  fileT1,
  fileT2,
  t1DataUrl,
  t2DataUrl,
  onRemoveT1,
  onRemoveT2,
  handleMultiFileUpload,
  handleFileT2Change,
  handleClearFiles,
  isLoading,
  handleLaunchWorkstation,
  canvasResponse,
  setCanvasResponse,
  onNavigateWorkstation,
  autoDetectPipeline
}: CanvasViewProps) {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputT2Ref = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState(false);
  const [previewModalImg, setPreviewModalImg] = React.useState<{ url: string; title: string; label?: string } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewModalImg(null);
        setIsModelDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = {
        target: { files: e.dataTransfer.files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleMultiFileUpload(fakeEvent);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden canvas-bg-mesh font-sans text-slate-800 select-none relative">
      <div className="absolute right-[-4vw] top-[5vh] w-[58vw] h-[90vh] pointer-events-none opacity-[0.045] z-0 flex items-center justify-center">
        <img src="/logo.png" alt="Watermark" className="w-full h-full object-contain" />
      </div>

      {/* Left Dock */}
      <aside className="w-[72px] h-full flex flex-col items-center justify-between py-6 border-r border-slate-200/70 bg-white/70 backdrop-blur-md z-30">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          </div>
          <nav className="flex flex-col items-center gap-4 pt-4">
            <button
              className="p-2.5 rounded-xl text-white bg-[#0284c7] shadow-sm shadow-cyan-500/30 transition hover:scale-105 cursor-pointer"
              title="Home Setup"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
              className={`p-2.5 rounded-xl transition hover:scale-105 cursor-pointer ${
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

        <div className="flex flex-col items-center gap-3 relative">
          <UserProfilePopover
            isOpen={showUserPopover}
            onClose={() => setShowUserPopover(false)}
            email={loginEmail}
            agencyCode={agencyCode}
            userInitial={userInitial}
            onNavigateResetPassword={onNavigateResetPassword}
            onSignOut={onSignOut}
          />

          <button
            onClick={() => setShowUserPopover(!showUserPopover)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0284c7] to-cyan-500 text-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition flex items-center justify-center ring-2 ring-white border border-cyan-300 cursor-pointer"
            title="User Account Profile"
          >
            {userInitial}
          </button>

          <button
            onClick={onSignOut}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Sliding History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        historyList={historyList}
        onSelectHistory={onSelectHistory}
        onClearHistory={() => setHistoryList([])}
      />

      {/* Main Canvas Workspace */}
      <main className="flex-1 flex flex-col justify-center items-center p-8 relative z-10 overflow-y-auto">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] transform scale-150">
          <img src="/logo.png" alt="Watermark" className="w-[520px] h-[520px] object-contain" />
        </div>

        <div className="w-full max-w-3xl mx-auto flex flex-col items-center space-y-6 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center text-slate-900 leading-tight">
            <span className="text-[#0284c7]">Good Afternoon,</span> What Satelite<br />
            scene you would like to <span className="text-[#f37021]">Discover?</span>
          </h1>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full bg-white rounded-[28px] border shadow-[0_10px_35px_-10px_rgba(0,0,0,0.06)] p-6 space-y-4 transition-all ${
              isDragging ? 'border-[#0284c7] ring-4 ring-sky-100 bg-sky-50/20' : 'border-slate-200/90'
            }`}
          >
            {/* Uploaded Rasters Preview Strip */}
            {(fileT1 || fileT2) && (
              <div className="flex items-center gap-3 pt-1 pb-1 overflow-x-auto">
                {/* T1 Preview Card */}
                {fileT1 && (
                  <div className="group relative flex-shrink-0">
                    <div
                      onClick={() =>
                        t1DataUrl &&
                        setPreviewModalImg({
                          url: t1DataUrl,
                          title: fileT1.name
                        })
                      }
                      className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100 hover:border-[#0284c7] hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center group-hover:scale-[1.02]"
                      title={`Click to inspect: ${fileT1.name}`}
                    >
                      {t1DataUrl ? (
                        <>
                          <img
                            src={t1DataUrl}
                            alt={fileT1.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0284c7] mb-1" />
                          <span className="text-[9px] font-medium">Processing</span>
                        </div>
                      )}
                    </div>
                    {/* Delete / Remove X button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveT1();
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer z-10"
                      title="Remove Image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* T2 Preview Card */}
                {fileT2 && (
                  <div className="group relative flex-shrink-0">
                    <div
                      onClick={() =>
                        t2DataUrl &&
                        setPreviewModalImg({
                          url: t2DataUrl,
                          title: fileT2.name
                        })
                      }
                      className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100 hover:border-[#0284c7] hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center group-hover:scale-[1.02]"
                      title={`Click to inspect: ${fileT2.name}`}
                    >
                      {t2DataUrl ? (
                        <>
                          <img
                            src={t2DataUrl}
                            alt={fileT2.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0284c7] mb-1" />
                          <span className="text-[9px] font-medium">Processing</span>
                        </div>
                      )}
                    </div>
                    {/* Delete / Remove X button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveT2();
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer z-10"
                      title="Remove Image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Query Textarea */}
            <div className="pt-1">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={2}
                placeholder="Ask Question or Analysis Requirements..."
                className="w-full text-base font-normal text-slate-800 placeholder-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed"
              />
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* 1. Attach Image Button */}
                <label
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/90 text-slate-700 hover:text-slate-900 text-xs font-medium shadow-2xs hover:border-slate-300 transition cursor-pointer"
                  title="Attach Satellite Imagery (.tif, .png, .jpg)"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Attach Image</span>
                  <input
                    ref={multiFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".tif,.tiff,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      handleMultiFileUpload(e);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={fileInputT2Ref}
                    type="file"
                    className="hidden"
                    accept=".tif,.tiff,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      handleFileT2Change(e);
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* 2. Custom Model Selection Dropdown (Matches Screenshot) */}
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/90 text-slate-700 hover:text-slate-900 text-xs font-medium shadow-2xs hover:border-slate-300 transition cursor-pointer"
                    title="Select Model Pipeline"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>
                      Model ({targetMethod === 'auto' ? 'Autodetect' : targetMethod === 'single' ? 'Single RS' : targetMethod === 'bitemporal' ? 'Bi-Temporal' : 'Optical-SAR'})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Popover matching media_1789731507955.png */}
                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full mb-2 left-0 sm:bottom-auto sm:top-full sm:mt-2 z-50 w-72 bg-[#f8fafc] rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-300/40 p-2 animate-in fade-in zoom-in-95 duration-150">
                      {/* Header inside popover */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/70 mb-1.5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-semibold text-slate-700">
                            Model ({targetMethod === 'auto' ? 'Autodetect' : targetMethod === 'single' ? 'Single RS' : targetMethod === 'bitemporal' ? 'Bi-Temporal' : 'Optical-SAR'})
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>

                      {/* Options with subtle dividers and active highlight */}
                      <div className="space-y-1">
                        {MODEL_OPTIONS.map((opt, idx) => {
                          const isSelected = targetMethod === opt.value;
                          return (
                            <React.Fragment key={opt.value}>
                              {idx > 0 && <div className="border-t border-slate-200/60 my-0.5" />}
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetMethod(opt.value);
                                  setIsModelDropdownOpen(false);
                                  autoDetectPipeline(fileT1, fileT2);
                                }}
                                className={`w-full py-2.5 px-3 rounded-xl text-[13.5px] font-medium text-center transition cursor-pointer block ${
                                  isSelected
                                    ? 'bg-[#0284c7] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                }`}
                              >
                                {opt.label}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Button: Orange Launch Workstation with images, Blue Ask Gemini Assistant without images */}
              <button
                onClick={handleLaunchWorkstation}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer ${
                  fileT1 || fileT2
                    ? 'bg-[#f37021] hover:bg-[#ea580c] shadow-orange-500/25'
                    : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] shadow-sky-500/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <span>Processing...</span>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : fileT1 || fileT2 ? (
                  <>
                    <span>Launch Workstation</span>
                    <Rocket className="w-4 h-4 fill-white" />
                  </>
                ) : (
                  <>
                    <span>Ask Gemini Assistant</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Inline AI Assistant Card */}
          <InlineAssistantCard
            canvasResponse={canvasResponse}
            isLoading={isLoading}
            hasFiles={Boolean(fileT1 || fileT2)}
            queryText={queryText}
            onNavigateWorkstation={onNavigateWorkstation}
            onDismiss={() => setCanvasResponse(null)}
          />
        </div>
      </main>

      {/* Lightbox High-Resolution Raster Preview Modal: Wraps tightly around the image size */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative inline-flex flex-col max-w-[90vw] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 gap-4">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[280px] sm:max-w-md">
                {previewModalImg.title}
              </span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                title="Close preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center overflow-auto max-h-[calc(90vh-48px)]">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="max-h-[75vh] max-w-[85vw] w-auto h-auto object-contain rounded-lg shadow-md block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
