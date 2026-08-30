'use client';

import React from 'react';
import { ChangeMetrics, ScenarioPreset } from '../types/satquery';
import { CalendarRange, Activity, Sparkles, AlertTriangle, Layers } from 'lucide-react';

interface ChangeDetectionPanelProps {
  scenario?: ScenarioPreset | null;
  changeMetrics?: ChangeMetrics | null;
  t1Date?: string;
  t2Date?: string;
  modelName?: string;
}

export default function ChangeDetectionPanel({
  scenario,
  changeMetrics,
  t1Date,
  t2Date,
  modelName = 'BIT-LEVIR-CD (Bi-Temporal Transformer)'
}: ChangeDetectionPanelProps) {
  const metrics = changeMetrics || scenario?.changeMetrics || {
    areaKm2: '0.0343 km²',
    areaM2: 34250.5,
    relativeDeltaPercent: '+38.4%',
    riskLevel: 'HIGH' as const,
    waterInundationPercent: 42,
    agriculturalLossPercent: 28,
    settlementImpactPercent: 35,
    dominantLocation: 'North-East & Central Corridor',
    clusterCount: 4,
    changeType: 'Urban Expansion & Structural Modification',
    executiveSummary: 'Bi-temporal feature comparison confirms significant structural variation across active quadrants.'
  };

  const t1Label = t1Date || scenario?.t1Date || 'Baseline (T1 Pre-Event)';
  const t2Label = t2Date || scenario?.t2Date || 'Target (T2 Post-Event)';

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 font-sans text-xs">
      {/* Pipeline & Temporal Status */}
      <div className="bg-[#f8fafd] border border-[#dadce0] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#1a73e8] flex items-center gap-1.5 font-sans">
            <CalendarRange className="w-4 h-4 text-[#1a73e8]" /> Temporal Comparison
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#174ea6] font-bold border border-[#d2e3fc]">
            {modelName}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] text-[#5f6368] uppercase font-mono font-medium">T1 Baseline</div>
            <div className="text-[#202124] font-semibold mt-0.5 truncate">{t1Label}</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] text-[#e37400] uppercase font-mono font-medium">T2 Target</div>
            <div className="text-[#202124] font-semibold mt-0.5 truncate">{t2Label}</div>
          </div>
        </div>
      </div>

      {/* Difference Metrics Summary */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="text-xs font-semibold text-[#202124] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#188038]" /> Spatial Difference Summary
          </span>
          {metrics.clusterCount != null && (
            <span className="text-[10px] text-[#5f6368] font-mono">
              {metrics.clusterCount} Change Clusters
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#f8f9fa] p-2.5 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] font-mono text-[#5f6368]">Total Altered</div>
            <div className="text-sm font-mono font-bold text-[#d93025] mt-0.5">{metrics.areaKm2}</div>
          </div>
          <div className="bg-[#f8f9fa] p-2.5 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] font-mono text-[#5f6368]">Relative Delta</div>
            <div className="text-sm font-mono font-bold text-[#e37400] mt-0.5">{metrics.relativeDeltaPercent}</div>
          </div>
          <div className="bg-[#f8f9fa] p-2.5 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] font-mono text-[#5f6368]">Risk Level</div>
            <div className={`text-sm font-mono font-bold mt-0.5 ${
              metrics.riskLevel === 'CRITICAL' ? 'text-[#d93025]' : metrics.riskLevel === 'HIGH' ? 'text-[#e37400]' : 'text-[#188038]'
            }`}>
              {metrics.riskLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#1a73e8]" /> Thematic Sector Impact
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[#5f6368]">Water Inundation / Flood</span>
              <span className="font-semibold text-[#1a73e8]">{metrics.waterInundationPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
              <div className="h-full bg-[#1a73e8] rounded-full" style={{ width: `${metrics.waterInundationPercent}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[#5f6368]">Agricultural & Vegetative Loss</span>
              <span className="font-semibold text-[#188038]">{metrics.agriculturalLossPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
              <div className="h-full bg-[#188038] rounded-full" style={{ width: `${metrics.agriculturalLossPercent}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[#5f6368]">Settlement / Built-Up Impact</span>
              <span className="font-semibold text-[#e37400]">{metrics.settlementImpactPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
              <div className="h-full bg-[#e37400] rounded-full" style={{ width: `${metrics.settlementImpactPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Executive AI Synthesis */}
      <div className="bg-[#f8fafd] border border-[#dadce0] rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8]">
          <Sparkles className="w-4 h-4 text-[#1a73e8]" /> Automated Change Assessment
        </div>
        <p className="text-xs text-[#3c4043] leading-relaxed bg-white p-3 rounded-xl border border-[#dadce0]">
          {metrics.executiveSummary || 'Bi-temporal deep feature comparison confirms high structural variation across key arterial points.'}
        </p>
      </div>
    </div>
  );
}