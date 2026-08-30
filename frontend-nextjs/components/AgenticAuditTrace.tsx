'use client';

import React from 'react';
import { ExecutionTrace, AuditTrace } from '../types/satquery';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, Cpu, ArrowRight } from 'lucide-react';

interface AgenticAuditTraceProps {
  executionTrace?: ExecutionTrace | null;
  auditTrace?: AuditTrace | null;
}

export default function AgenticAuditTrace({ executionTrace, auditTrace }: AgenticAuditTraceProps) {
  // If backend ExecutionTrace is provided
  if (executionTrace && executionTrace.events && executionTrace.events.length > 0) {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#dadce0]">
          <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-4 h-4 text-[#1a73e8]" /> LangGraph Execution Trace
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5f6368] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {executionTrace.total_duration_ms.toFixed(1)}ms
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              executionTrace.status === 'Success'
                ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                : executionTrace.status === 'Incompatible'
                ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]'
                : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
            }`}>
              {executionTrace.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-3 relative pl-4 border-l-2 border-[#dadce0] mt-2">
          {executionTrace.events.map((ev) => {
            const isSuccess = ev.status === 'Success';
            const isWarning = ev.status === 'Warning' || ev.status === 'Incompatible';
            return (
              <div
                key={ev.step}
                className="relative bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3 space-y-1.5 shadow-sm"
              >
                <span
                  className={`absolute -left-[23px] top-3 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white ${
                    isSuccess ? 'bg-[#188038]' : isWarning ? 'bg-[#e37400]' : 'bg-[#d93025]'
                  }`}
                >
                  <CheckCircle2 className="w-2 h-2 text-white" />
                </span>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#1a73e8] font-bold">
                    {ev.step}. {ev.event}
                  </span>
                  {ev.duration_ms != null && (
                    <span className="text-[#5f6368] text-[10px]">{ev.duration_ms.toFixed(1)}ms</span>
                  )}
                </div>

                {ev.model_tool && (
                  <div className="flex items-center gap-1 text-[10px] text-[#5f6368]">
                    <Cpu className="w-3 h-3 text-[#1a73e8]" />
                    <span>Model/Node: <strong className="text-[#202124]">{ev.model_tool}</strong></span>
                    {ev.confidence != null && (
                      <span className="text-[#188038] font-semibold ml-1">
                        ({(ev.confidence * 100).toFixed(0)}% conf)
                      </span>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-[#3c4043] font-sans leading-relaxed">
                  {ev.details}
                </p>
              </div>
            );
          })}
        </div>

        {executionTrace.summary && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] text-[11px] text-[#174ea6] font-sans">
            <span className="font-semibold block mb-0.5">Execution Summary:</span>
            {executionTrace.summary}
          </div>
        )}
      </div>
    );
  }

  // Fallback to legacy AuditTrace format
  if (auditTrace) {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#dadce0]">
          <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-4 h-4 text-[#1a73e8]" /> AADI Execution Trace
          </div>
          <span className="px-2 py-0.5 bg-[#e6f4ea] text-[#137333] text-[10px] font-bold rounded border border-[#ceead6]">
            {(auditTrace.intentConfidence * 100).toFixed(1)}% Confidence
          </span>
        </div>

        <div className="space-y-3 relative pl-4 border-l-2 border-[#dadce0] mt-2">
          {auditTrace.steps.map((step) => (
            <div key={step.stepNumber} className="relative bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3 space-y-1 shadow-sm">
              <span className="absolute -left-[23px] top-3 w-3 h-3 rounded-full bg-[#1a73e8] border-2 border-white flex items-center justify-center">
                <CheckCircle2 className="w-2 h-2 text-white" />
              </span>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#1a73e8] font-bold">{step.stepNumber}. {step.stepName}</span>
                <span className="text-[#5f6368] text-[10px]">{step.latencyMs}ms</span>
              </div>
              <p className="text-[11px] text-[#3c4043] font-sans">{step.details}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center text-xs text-[#5f6368]">
      No execution trace available for this session.
    </div>
  );
}