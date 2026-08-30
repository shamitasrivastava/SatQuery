'use client';

import React from 'react';
import { ScenarioPreset } from '../types/satquery';
import { CalendarRange, Activity, Sparkles } from 'lucide-react';

export default function ChangeDetectionPanel({ scenario }: { scenario: ScenarioPreset }) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      <div className="bg-tactical-950 border border-tactical-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <CalendarRange className="w-4 h-4" /> Bi-Temporal Status
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">LEVIR-CD</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-tactical-900 p-2.5 rounded-lg border border-tactical-800">
            <div className="text-[10px] text-slate-400 uppercase">T1 Baseline</div>
            <div className="text-slate-200 font-bold mt-0.5">{scenario.t1Date || '12 May 2024'}</div>
          </div>
          <div className="bg-tactical-900 p-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/20">
            <div className="text-[10px] text-cyan-400 uppercase">T2 Target</div>
            <div className="text-slate-200 font-bold mt-0.5">{scenario.t2Date || '24 Jul 2024'}</div>
          </div>
        </div>
      </div>

      <div className="bg-tactical-950 border border-tactical-800 rounded-xl p-3.5 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" /> Difference Summary
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-tactical-900 p-2 rounded-lg border border-tactical-800">
            <div className="text-[10px] font-mono text-slate-400">Total Altered</div>
            <div className="text-sm font-mono font-black text-rose-400 mt-0.5">142.6 km²</div>
          </div>
          <div className="bg-tactical-900 p-2 rounded-lg border border-tactical-800">
            <div className="text-[10px] font-mono text-slate-400">Relative Delta</div>
            <div className="text-sm font-mono font-black text-amber-400 mt-0.5">+38.4%</div>
          </div>
          <div className="bg-tactical-900 p-2 rounded-lg border border-tactical-800">
            <div className="text-[10px] font-mono text-slate-400">Severity</div>
            <div className="text-sm font-mono font-black text-cyan-400 mt-0.5">CRITICAL</div>
          </div>
        </div>
      </div>

      <div className="bg-tactical-950 border border-tactical-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-300 font-bold">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Automated Damage Synthesis
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-tactical-900/60 p-3 rounded-lg border border-tactical-800 font-sans">
          Bi-temporal deep feature comparison confirms high structural variation across key arterial points with a high degree of water inundation in low-lying quadrants.
        </p>
      </div>
    </div>
  );
}