'use client';

import React from 'react';
import { History, X, Cpu, Trash2 } from 'lucide-react';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  method: string;
  pipeline: string;
  entitiesCount: number;
  coordinates: { lat: number; lng: number };
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  historyList,
  onSelectHistory,
  onClearHistory
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-[380px] sm:w-[420px] h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-2xl flex flex-col justify-between z-20 transition-all duration-300">
      {/* Header */}
      <div className="px-5 py-4 sm:py-5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-[#0284c7]" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Inspection History</h2>
          {historyList.length > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">
              {historyList.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Close history drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {historyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center p-6 text-slate-400">
            <History className="w-10 h-10 mb-2.5 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">No inspection history yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Analyses, image discoveries, and routed pipelines will be logged here.
            </p>
          </div>
        ) : (
          historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectHistory(item)}
              className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#0284c7] bg-white hover:bg-sky-50/20 transition-all cursor-pointer shadow-xs hover:shadow-md group space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition truncate max-w-[240px]">
                  {item.title}
                </div>
                <span className="text-xs font-mono font-medium text-slate-400 flex-shrink-0">{item.timestamp}</span>
              </div>

              <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                <span className="truncate tracking-wide text-slate-700">{item.pipeline}</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 font-mono">
                <span>{item.coordinates.lat.toFixed(3)}°N, {item.coordinates.lng.toFixed(3)}°E</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#188038] font-bold text-xs border border-emerald-200/70">
                  {item.entitiesCount} Grounded
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {historyList.length > 0 && (
        <div className="p-4 border-t border-slate-200/70 bg-slate-50/50">
          <button
            onClick={onClearHistory}
            className="flex items-center justify-center gap-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-semibold py-2 px-3 rounded-xl w-full transition cursor-pointer border border-rose-200/60"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History Logs</span>
          </button>
        </div>
      )}
    </aside>
  );
}
