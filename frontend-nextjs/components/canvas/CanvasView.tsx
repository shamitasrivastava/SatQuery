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
  Plus
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
  const [previewModalImg, setPreviewModalImg] = React.useState<{ url: string; title: string; label?: string } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewModalImg(null);
    };
    if (previewModalImg) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewModalImg]);

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
          <h1 className="text-4xl font-semibold tracking-tight text-center text-slate-900 leading-snug">
            <span className="text-[#0284c7]">Good Afternoon,</span> What Satellite<br />
            scene you would like to <span className="text-[#f37021]">Discover?</span>
          </h1>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full bg-white rounded-[24px] border shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] p-6 space-y-4 transition-all ${
              isDragging ? 'border-[#0284c7] ring-4 ring-sky-100 bg-sky-50/20' : 'border-slate-200/80'
            }`}
          >
            <div className="flex justify-end">
              <div className="relative w-[340px]">
                <select
                  value={targetMethod}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setTargetMethod(val);
                    if (val === 'opticalsar' && (!queryText.trim() || queryText === 'Analyze target raster scene and ground key features.' || queryText.toLowerCase().includes('change'))) {
                      setQueryText('Classify the water vs built-up areas using optical and SAR fusion.');
                    }
                    autoDetectPipeline(fileT1, fileT2);
                  }}
                  className="w-full text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-400/80 rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-[#0284c7] focus:bg-white transition appearance-none cursor-pointer shadow-sm"
                >
                  <option value="auto">Autodetect</option>
                  <option value="single">Single Satellite Imagery</option>
                  <option value="bitemporal">Bi-Temporal (Change Detection)</option>
                  <option value="opticalsar">Optical and SAR Fusion</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Smart Router Verdict Banner */}
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

            {/* Uploaded Rasters Preview Strip (ChatGPT-style thumbnail) */}
            {(fileT1 || fileT2) && (
              <div className="flex items-center gap-3 pt-2 pb-1 overflow-x-auto">
                {/* T1 Preview Card */}
                {fileT1 && (
                  <div className="group relative flex-shrink-0">
                    <div
                      onClick={() =>
                        t1DataUrl &&
                        setPreviewModalImg({
                          url: t1DataUrl,
                          title: fileT1.name,
                          label: fileT2 ? 'Swath T1 (Baseline)' : 'Satellite Swath'
                        })
                      }
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 hover:border-[#0284c7] hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center group-hover:scale-[1.02]"
                      title={`Click to inspect raster: ${fileT1.name}`}
                    >
                      {t1DataUrl ? (
                        <>
                          <img
                            src={t1DataUrl}
                            alt={fileT1.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0284c7] mb-1" />
                          <span className="text-[9px] font-medium">Processing</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent py-0.5 px-1 flex items-center justify-center">
                        <span className="text-[9px] font-semibold text-white truncate max-w-[62px]">
                          {fileT2 ? 'Swath T1' : 'Swath 1'}
                        </span>
                      </div>
                    </div>
                    {/* Delete / Remove X button floating top right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveT1();
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900/85 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer z-10"
                      title="Remove Swath T1"
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
                          title: fileT2.name,
                          label: 'Swath T2 (Target)'
                        })
                      }
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 hover:border-[#0284c7] hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center group-hover:scale-[1.02]"
                      title={`Click to inspect raster: ${fileT2.name}`}
                    >
                      {t2DataUrl ? (
                        <>
                          <img
                            src={t2DataUrl}
                            alt={fileT2.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0284c7] mb-1" />
                          <span className="text-[9px] font-medium">Processing</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent py-0.5 px-1 flex items-center justify-center">
                        <span className="text-[9px] font-semibold text-white truncate max-w-[62px]">
                          Swath T2
                        </span>
                      </div>
                    </div>
                    {/* Delete / Remove X button floating top right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveT2();
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900/85 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer z-10"
                      title="Remove Swath T2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Optional + Attach 2nd Swath button if only 1 swath is present */}
                {fileT1 && !fileT2 && (
                  <button
                    type="button"
                    onClick={() => fileInputT2Ref.current?.click()}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0284c7] bg-slate-50/60 hover:bg-sky-50/50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#0284c7] transition-all cursor-pointer flex-shrink-0"
                    title="Attach 2nd Swath for Change Detection or SAR Fusion"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px] font-semibold tracking-tight text-center leading-tight px-1">
                      + 2nd Swath
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Query Textarea */}
            <div className="pt-1">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={3}
                placeholder={
                  targetMethod === 'opticalsar'
                    ? 'Classify the water vs built-up areas using optical and SAR fusion.'
                    : "Ask Question or Analysis Requirements (e.g., 'Detect changes in urban infrastructure' or 'Identify all cargo vessels')..."
                }
                className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent border-none resize-none focus:outline-none focus:ring-0 leading-relaxed"
              />
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <label
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:border-slate-300 transition cursor-pointer"
                title="Add satellite imagery (.tif, .png, .jpg)"
              >
                <Plus className="w-4 h-4 text-[#0284c7]" />
                <span>Add Image</span>
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

              <button
                onClick={handleLaunchWorkstation}
                disabled={isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-md active:scale-[0.98] transition disabled:opacity-50 cursor-pointer ${
                  fileT1
                    ? 'bg-gradient-to-r from-[#f37021] to-[#f97316] hover:from-[#ea580c] hover:to-[#f37021]'
                    : 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7]'
                }`}
              >
                {isLoading ? (
                  <>
                    <span>Processing...</span>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </>
                ) : fileT1 ? (
                  <>
                    <span>Launch Workstation</span>
                    <Rocket className="w-3.5 h-3.5 fill-white" />
                  </>
                ) : (
                  <>
                    <span>Ask Gemini Assistant</span>
                    <Sparkles className="w-3.5 h-3.5" />
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

      {/* Lightbox High-Resolution Raster Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[320px] sm:max-w-md">
                  {previewModalImg.title}
                </span>
                {previewModalImg.label && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold">
                    {previewModalImg.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                title="Close preview (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 overflow-auto max-h-[calc(90vh-60px)]">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
