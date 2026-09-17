'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Radio,
  Activity,
  FileDown,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { MapEntity } from '../../types/satquery';
import { extractChangeMetrics } from '../../lib/adapters';
import MarkdownRenderer from '../MarkdownRenderer';
import ChangeDetectionPanel from '../ChangeDetectionPanel';
import OpticalSarMetrics from './OpticalSarMetrics';

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
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-[450] bg-white hover:bg-[#f8f9fa] border-y border-l border-[#dadce0] py-3 px-1 rounded-l-xl text-[#5f6368] shadow-[-2px_0_6px_rgba(0,0,0,0.12)] transition cursor-pointer"
        title={isSidebarOpen ? 'Collapse Details' : 'Expand Details'}
      >
        {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Main Sidebar */}
      {isSidebarOpen && (
        <aside className="w-[410px] h-full bg-white border-l border-[#dadce0] flex flex-col justify-between z-30 shadow-[-4px_0_16px_rgba(0,0,0,0.06)] relative flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-[#dadce0] px-3 pt-3 text-xs font-semibold bg-white sticky top-0 z-10">
              <button
                onClick={() => setActiveWorkstationTab('rsvqa')}
                className={`pb-3 px-3 transition border-b-2 flex-1 text-center cursor-pointer ${
                  activeWorkstationTab === 'rsvqa'
                    ? 'text-[#1a73e8] border-[#1a73e8]'
                    : 'text-[#5f6368] border-transparent hover:text-[#202124]'
                }`}
              >
                Overview & Q&A
              </button>
              <button
                onClick={() => setActiveWorkstationTab('bitemporal')}
                className={`pb-3 px-3 transition border-b-2 flex-1 text-center cursor-pointer ${
                  activeWorkstationTab === 'bitemporal'
                    ? 'text-[#1a73e8] border-[#1a73e8]'
                    : 'text-[#5f6368] border-transparent hover:text-[#202124]'
                }`}
              >
                {targetMethod === 'opticalsar' ? 'Optical-SAR Fusion' : 'Change Detection'}
              </button>
              <button
                onClick={onOpenAuditModal}
                className="pb-3 px-3 transition text-[#5f6368] border-b-2 border-transparent hover:text-[#202124] flex-1 text-center cursor-pointer"
              >
                Audit Trace
              </button>
            </div>

            {/* Pipeline Status Indicator */}
            <div className="p-3.5 bg-[#f8fafd] border-b border-[#dadce0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#188038]" />
                <span className="text-xs font-medium text-[#3c4043] truncate max-w-[280px]">
                  Pipeline: {detectedPipeline}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333]">
                READY
              </span>
            </div>

            {/* Tab Content */}
            {activeWorkstationTab === 'bitemporal' ? (
              <div className="flex flex-col flex-1">
                {targetMethod === 'opticalsar' ? (
                  <OpticalSarMetrics visualEvidenceData={visualEvidenceData} />
                ) : (
                  <ChangeDetectionPanel
                    changeMetrics={extractChangeMetrics(visualEvidenceData || {})}
                    modelName="OPEN-CD (BI-TEMPORAL SIAMESE)"
                  />
                )}

                {/* Conversation feed for change detection */}
                <div className="p-4 border-t border-[#dadce0] space-y-3">
                  <span className="text-xs font-bold text-[#3c4043] uppercase tracking-wider block">
                    Analyst Conversation
                  </span>
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
                      {msg.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#1a73e8] p-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying Siamese Model Engine...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Overview & Q&A Tab Content */
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
                      {msg.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#1a73e8] p-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying Model Engine...
                    </div>
                  )}
                </div>

                {/* Grounded Entities List */}
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
            )}
          </div>

          {/* Actions Bar & Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={onNavigateCanvas}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Canvas</span>
              </button>

              <button
                onClick={onOpenSmsModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-[11px] font-semibold text-white shadow transition cursor-pointer"
              >
                <Radio className="w-3 h-3" />
                <span>SMS</span>
              </button>

              <button
                onClick={onOpenAuditModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-[11px] font-semibold text-white shadow transition cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                <span>Audit</span>
              </button>

              <button
                onClick={onExportPdf}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-[11px] font-semibold text-white shadow transition cursor-pointer"
              >
                <FileDown className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 focus-within:bg-white focus-within:border-[#1a73e8]">
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
                disabled={isLoading || !chatInput.trim()}
                className="p-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-40 transition cursor-pointer"
                title="Send Query"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
