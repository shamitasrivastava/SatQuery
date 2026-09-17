'use client';

import React from 'react';
import { Sparkles, Layers } from 'lucide-react';

interface OpticalSarMetricsProps {
  visualEvidenceData: Record<string, any> | null;
}

export default function OpticalSarMetrics({ visualEvidenceData }: OpticalSarMetricsProps) {
  const classification = visualEvidenceData?.classification || 'WATER / LAND COVER';
  const isWater = classification === 'WATER';

  return (
    <div className="p-4 space-y-3 font-sans text-xs">
      <div className="bg-[#f8fafd] border border-[#dadce0] rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0284c7] flex items-center gap-1.5 font-sans">
            <Sparkles className="w-4 h-4 text-[#0284c7]" /> Multi-Sensor Fusion
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] font-bold border border-[#bae6fd]">
            CROMA Dual-Modal
          </span>
        </div>

        {/* Classification Result Badge */}
        <div className="p-3 rounded-xl border bg-white flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] text-[#5f6368] uppercase font-mono font-medium">Classified Target State</div>
            <div className={`text-sm font-bold mt-0.5 ${isWater ? 'text-[#0284c7]' : 'text-[#ea580c]'}`}>
              {classification}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              isWater
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isWater ? 'Hydrological' : 'Structural'}
          </span>
        </div>

        {/* Dual Indices Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] text-[#5f6368] uppercase font-mono font-medium">SAR Mean VV</div>
            <div className="text-[#202124] font-semibold font-mono mt-0.5">
              {visualEvidenceData?.vv_db !== undefined ? `${visualEvidenceData.vv_db} dB` : '-15.80 dB'}
            </div>
            <div className="text-[9px] text-[#70757a] mt-0.5">Threshold: -10.9 dB</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-[#dadce0]">
            <div className="text-[10px] text-[#5f6368] uppercase font-mono font-medium">Sentinel-2 NDWI</div>
            <div className="text-[#202124] font-semibold font-mono mt-0.5">
              {visualEvidenceData?.ndwi !== undefined
                ? `${visualEvidenceData.ndwi > 0 ? '+' : ''}${visualEvidenceData.ndwi}`
                : '+0.655'}
            </div>
            <div className="text-[9px] text-[#70757a] mt-0.5">&gt;0: Water | &lt;0: Land</div>
          </div>
        </div>

        {/* CROMA Vector Info */}
        <div className="bg-white p-3 rounded-xl border border-[#dadce0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#5f6368]" />
            <span className="text-[#3c4043] font-medium text-[11px]">CROMA Latent Space</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#188038] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
            768-dim GAP
          </span>
        </div>
      </div>
    </div>
  );
}
