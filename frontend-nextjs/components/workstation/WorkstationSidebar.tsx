'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  SearchCheck,
  Download,
  Sparkles,
  Rocket
} from 'lucide-react';
import { MapEntity } from '../../types/satquery';
import { extractChangeMetrics } from '../../lib/adapters';
import ChangeDetectionPanel from '../ChangeDetectionPanel';
import OpticalSarMetrics from './OpticalSarMetrics';
import ChatFeed from './ChatFeed';

interface WorkstationSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  activeWorkstationTab: 'rsvqa' | 'bitemporal' | 'audittrace';
  setActiveWorkstationTab: (tab: 'rsvqa' | 'bitemporal' | 'audittrace') => void;
  detectedPipeline: string;
  targetMethod: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  visualEvidenceData: Record<string, any> | null;
  chatMessages: Array<{ sender: 'user' | 'ai'; text: string }>;
  isLoading: boolean;
  entities: MapEntity[];
  onNavigateCanvas: () => void;
  onOpenSmsModal: () => void;
  onOpenAuditModal: () => void;
  onExportPdf: () => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: () => void;
}

export default function WorkstationSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeWorkstationTab,
  setActiveWorkstationTab,
  detectedPipeline,
  targetMethod,
  visualEvidenceData,
  chatMessages,
  isLoading,
  entities,
  onNavigateCanvas,
  onOpenSmsModal,
  onOpenAuditModal,
  onExportPdf,
  chatInput,
  setChatInput,
  handleSendMessage
}: WorkstationSidebarProps) {
  return (
    <>
      {/* Floating Toggle Handle */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-[450] bg-white hover:bg-[#f8f9fa] border-y border-l border-[#dadce0] py-3 px-1 rounded-l-xl text-[#5f6368] shadow-[-2px_0_6px_rgba(0,0,0,0.12)] transition cursor-pointer"
        title={isSidebarOpen ? 'Collapse Details' : 'Expand Details'}
      >
        {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Sidebar */}
      {isSidebarOpen && (
        <aside className="w-[380px] sm:w-[410px] h-full bg-white border-l border-slate-200 flex flex-col justify-between z-30 shadow-[-4px_0_16px_rgba(0,0,0,0.06)] relative flex-shrink-0">
          {/* 1. Header matching exact user mockup */}
          <div className="px-4 py-3 bg-[#f0f4f8] border-b border-slate-200/90 flex items-center justify-between flex-shrink-0">
            {/* Left: Logo & Titles */}
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Bhuviksana" className="w-9 h-9 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
                  Bhuviksana
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    const nextTab = activeWorkstationTab === 'rsvqa' ? 'bitemporal' : 'rsvqa';
                    setActiveWorkstationTab(nextTab);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition mt-0.5 flex items-center gap-1 cursor-pointer text-left"
                  title="Click to toggle Overview / Change Detection mode"
                >
                  {activeWorkstationTab === 'bitemporal'
                    ? targetMethod === 'opticalsar'
                      ? 'Optical-SAR Fusion'
                      : 'Change Detection'
                    : 'Overview & QnA'}
                </button>
              </div>
            </div>

            {/* Right: Green Audit button & Blue Export button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="w-8 h-8 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-sm transition cursor-pointer flex-shrink-0"
                title="Audit Trace"
              >
                <SearchCheck className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={onExportPdf}
                className="h-8 px-3 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                title="Export PDF Report"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* 2. Middle Scrollable Conversation Area */}
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-4">
            {activeWorkstationTab === 'bitemporal' ? (
              <div className="flex flex-col space-y-4">
                {targetMethod === 'opticalsar' ? (
                  <OpticalSarMetrics visualEvidenceData={visualEvidenceData} />
                ) : (
                  <ChangeDetectionPanel
                    changeMetrics={extractChangeMetrics(visualEvidenceData || {})}
                    modelName="OPEN-CD (BI-TEMPORAL SIAMESE)"
                  />
                )}

                <div className="pt-2 border-t border-slate-100">
                  <ChatFeed
                    messages={chatMessages}
                    isLoading={isLoading}
                    loadingLabel="Querying Siamese Model Engine..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ChatFeed
                  messages={chatMessages}
                  isLoading={isLoading}
                  loadingLabel="Querying Model Engine..."
                />

                {/* Grounded Entities List (if detected) */}
                {entities.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Identified Features ({entities.length})
                      </span>
                      <span className="text-xs font-semibold text-[#0284c7]">
                        {entities.reduce((a, b) => a + b.area_m2, 0).toLocaleString()} m² Total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {entities.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#0284c7] shadow-sm transition"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Footprint: {item.area_m2.toLocaleString()} m²
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {(item.confidence * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Bottom Query Input matching exact user mockup */}
          <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
              <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your query..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || !chatInput.trim()}
                className="w-8 h-8 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center disabled:opacity-40 transition cursor-pointer flex-shrink-0 shadow-sm"
                title="Send Query"
              >
                <Rocket className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
