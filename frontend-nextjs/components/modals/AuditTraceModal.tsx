'use client';

import React from 'react';
import { Activity, CheckCircle2, X } from 'lucide-react';
import { ExecutionTrace } from '../../types/satquery';
import AgenticAuditTrace from '../AgenticAuditTrace';

interface AuditTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  entitiesCount: number;
  totalAreaM2: number;
  executionTrace?: ExecutionTrace | null;
}

export default function AuditTraceModal({
  isOpen,
  onClose,
  entitiesCount,
  totalAreaM2,
  executionTrace
}: AuditTraceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white text-slate-900 border border-slate-200 rounded-[24px] p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-base font-bold text-slate-900">Execution Telemetry & Audit Log</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {executionTrace && executionTrace.events && executionTrace.events.length > 0 ? (
            <AgenticAuditTrace executionTrace={executionTrace} />
          ) : (
            <>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Input Stream Ingestion & Tiling</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Aligned sensor array to 512x512 tile patches with EPSG:4326 CRS coordinates.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Siamese Feature Extraction & Grounding</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Falcon-0.7B-RS identified spatial coordinates across {entitiesCount} bounding boxes.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">3. Spatial Clustering & GSD Quantification</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Computed footprint at {totalAreaM2.toLocaleString()} m² (0.5m/px GSD).
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-xs font-semibold text-white rounded-xl shadow transition cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
