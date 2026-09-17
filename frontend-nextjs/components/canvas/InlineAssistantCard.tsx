'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader2, Copy } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';

interface CanvasResponseData {
  query: string;
  text: string;
  model: string;
  duration_ms?: number;
  timestamp?: string;
}

interface InlineAssistantCardProps {
  canvasResponse: CanvasResponseData | null;
  isLoading: boolean;
  hasFiles: boolean;
  queryText: string;
  onNavigateWorkstation: () => void;
  onDismiss: () => void;
}

export default function InlineAssistantCard({
  canvasResponse,
  isLoading,
  hasFiles,
  queryText,
  onNavigateWorkstation,
  onDismiss
}: InlineAssistantCardProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  if (!canvasResponse && !(isLoading && !hasFiles)) return null;

  return (
    <div className="w-full bg-white rounded-[24px] border border-sky-100 shadow-[0_12px_40px_-15px_rgba(2,132,199,0.12)] p-6 space-y-4 animate-in fade-in-50 duration-300 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-white shadow-sm shadow-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                BhuVikshana Geospatial Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-[#0284c7] font-semibold border border-sky-200 font-mono">
                {canvasResponse?.model || 'Gemini Flash-Lite'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-md">
              Query: "{canvasResponse?.query || queryText}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canvasResponse?.duration_ms && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg">
              {canvasResponse.duration_ms} ms
            </span>
          )}
          <button
            onClick={onNavigateWorkstation}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0284c7] hover:text-[#0284c7] text-slate-600 text-xs font-medium transition shadow-sm cursor-pointer"
            title="Open in Full GIS Workstation"
          >
            <span>Open Workstation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Dismiss Answer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading && !hasFiles ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-[#0284c7] animate-spin" />
          <span className="text-xs text-slate-600 font-medium">
            Consulting Gemini Flash-Lite Geospatial Engine...
          </span>
        </div>
      ) : canvasResponse ? (
        <div className="max-h-[380px] overflow-y-auto pr-2">
          <MarkdownRenderer content={canvasResponse.text} />
        </div>
      ) : null}

      {/* Footer */}
      {canvasResponse && !isLoading && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Fallback Engine • No Image Swaths Attached
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (canvasResponse?.text) {
                  navigator.clipboard.writeText(canvasResponse.text);
                  setCopyStatus('Copied!');
                  setTimeout(() => setCopyStatus(null), 2000);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copyStatus || 'Copy Answer'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
