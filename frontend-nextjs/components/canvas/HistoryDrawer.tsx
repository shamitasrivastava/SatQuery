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
    <aside className="w-[340px] h-full bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-xl flex flex-col justify-between z-20 transition-all duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#1a73e8]" />
          <span className="text-sm font-semibold text-slate-800">Inspection History</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {historyList.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectHistory(item)}
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
          onClick={onClearHistory}
          className="flex items-center justify-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium py-1.5 w-full cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History Logs</span>
        </button>
      </div>
    </aside>
  );
}
