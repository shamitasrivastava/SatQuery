'use client';

import React, { useRef } from 'react';
import {
  Home,
  History,
  LogOut,
  ChevronDown,
  Cpu,
  UploadCloud,
  X,
  Rocket,
  Sparkles,
  Loader2,
  Anchor,
  CloudRain
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
  handleMultiFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileT2Change: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearFiles: () => void;
  isLoading: boolean;
  handleLaunchWorkstation: () => void;
  canvasResponse: any;
  setCanvasResponse: (val: any) => void;
  onNavigateWorkstation: () => void;
  handleLoadScenario: (scenario: 'port' | 'flood') => void;
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
  handleMultiFileUpload,
  handleFileT2Change,
  handleClearFiles,
  isLoading,
  handleLaunchWorkstation,
  canvasResponse,
  setCanvasResponse,
  onNavigateWorkstation,
  handleLoadScenario,
  autoDetectPipeline
}: CanvasViewProps) {
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputT2Ref = useRef<HTMLInputElement>(null);

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

          <div className="w-full bg-white rounded-[24px] border border-slate-200/80 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] p-6 space-y-4">
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

            {/* Multi-Image Upload Engine */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <label
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-sm transition cursor-pointer ${
                    fileT1 || fileT2
                      ? 'bg-[#1a73e8] border-[#1a73e8] text-white shadow-md'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <UploadCloud className={`w-4 h-4 ${fileT1 || fileT2 ? 'text-white' : 'text-[#0284c7]'}`} />
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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    title="Clear attached files"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

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

          {/* Benchmark Use Cases */}
          <div className="w-full flex flex-col items-center space-y-3 pt-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Explore Real-World Remote-Sensing Use Cases
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLoadScenario('port')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs font-medium text-slate-700 shadow-sm transition hover:scale-105 cursor-pointer"
              >
                <Anchor className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Visakhapatnam Port</span>
              </button>
              <button
                onClick={() => handleLoadScenario('flood')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs font-medium text-slate-700 shadow-sm transition hover:scale-105 cursor-pointer"
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
