'use client';

import React from 'react';
import { ScenarioPreset } from '../types/satquery';
import { X, FileText } from 'lucide-react';

interface DossierExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioPreset;
}

export default function DossierExportModal({ isOpen, onClose, scenario }: DossierExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-tactical-900 border border-tactical-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl font-sans">
        <div className="flex items-center justify-between border-b border-tactical-800 pb-3">
          <div className="flex items-center gap-2 text-white font-mono font-bold text-sm">
            <FileText className="w-4 h-4 text-cyan-400" /> SATQUERY INTEL REPORT
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-tactical-950 rounded-xl p-4 border border-tactical-800 text-xs font-mono space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-slate-500">Target Area:</span> <span className="text-slate-200 font-bold">{scenario.name}</span></div>
            <div><span className="text-slate-500">Coordinates:</span> <span className="text-slate-200">{scenario.coordinates.join(', ')}</span></div>
          </div>
          <p className="text-slate-300 font-sans leading-relaxed text-xs">
            Verified scan output for target scenario across high-resolution imagery channels. Identified {scenario.detections.length} grounded features with deterministic confidence routing.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 bg-tactical-800 text-slate-200 rounded-lg text-xs font-mono">Close</button>
          <button onClick={() => window.print()} className="px-4 py-1.5 bg-cyan-500 text-slate-950 rounded-lg text-xs font-mono font-bold">Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}