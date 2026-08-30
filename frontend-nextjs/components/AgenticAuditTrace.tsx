'use client';

import React from 'react';
import { AuditTrace } from '../types/satquery';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AgenticAuditTrace({ auditTrace }: { auditTrace: AuditTrace }) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-tactical-800">
        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> AADI Execution Trace
        </div>
        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800">
          {(auditTrace.intentConfidence * 100).toFixed(1)}% Confidence
        </span>
      </div>

      <div className="space-y-3 relative pl-4 border-l-2 border-tactical-800 mt-2">
        {auditTrace.steps.map((step) => (
          <div key={step.stepNumber} className="relative bg-tactical-950 border border-tactical-800 rounded-lg p-3 space-y-1">
            <span className="absolute -left-[23px] top-3 w-3 h-3 rounded-full bg-cyan-500 border-2 border-tactical-950 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-black" />
            </span>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-cyan-400 font-bold">{step.stepNumber}. {step.stepName}</span>
              <span className="text-slate-500 text-[10px]">{step.latencyMs}ms</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">{step.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}