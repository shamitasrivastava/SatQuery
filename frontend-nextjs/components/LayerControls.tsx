'use client';

import React from 'react';
import { AnalysisMode } from '../types/satquery';
import { Square, SplitSquareVertical, Layers, UploadCloud } from 'lucide-react';

interface LayerControlsProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  showBBoxes: boolean;
  onToggleBBoxes: () => void;
  maskOpacity: number;
  onOpacityChange: (val: number) => void;
}

export default function LayerControls({
  mode,
  onModeChange,
  showBBoxes,
  onToggleBBoxes,
  maskOpacity,
  onOpacityChange,
}: LayerControlsProps) {
  return (
    <div className="bg-tactical-900/90 backdrop-blur border-b border-tactical-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20 text-xs font-mono">
      <div className="flex items-center gap-1 bg-tactical-950 p-1 rounded-lg border border-tactical-800">
        <button
          onClick={() => onModeChange('single')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition ${mode === 'single' ? 'bg-cyan-900/80 text-cyan-200 font-medium border border-cyan-700/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Square className="w-3.5 h-3.5" /> Single (RS-VQA)
        </button>
        <button
          onClick={() => onModeChange('swipe')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition ${mode === 'swipe' ? 'bg-cyan-900/80 text-cyan-200 font-medium border border-cyan-700/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" /> Swipe Compare
        </button>
        <button
          onClick={() => onModeChange('diff')}
          className={`px-3 py-1 rounded flex items-center gap-1.5 transition ${mode === 'diff' ? 'bg-cyan-900/80 text-cyan-200 font-medium border border-cyan-700/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Layers className="w-3.5 h-3.5" /> Change Heatmap
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 bg-tactical-950 px-2.5 py-1 rounded border border-tactical-800 cursor-pointer">
          <input type="checkbox" checked={showBBoxes} onChange={onToggleBBoxes} className="rounded accent-cyan-500" />
          <span className="text-[11px] text-slate-300">BBox Grounding</span>
        </label>

        {mode === 'diff' && (
          <div className="flex items-center gap-2 bg-tactical-950 px-2.5 py-1 rounded border border-tactical-800">
            <span className="text-[11px] text-slate-400">Opacity:</span>
            <input type="range" min="0" max="1" step="0.05" value={maskOpacity} onChange={(e) => onOpacityChange(parseFloat(e.target.value))} className="w-16 accent-cyan-500" />
          </div>
        )}

        <button className="flex items-center gap-1 px-2.5 py-1 bg-tactical-800 hover:bg-tactical-700 text-slate-300 rounded border border-tactical-700 text-[11px]">
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" /> GeoTIFF
        </button>
      </div>
    </div>
  );
}