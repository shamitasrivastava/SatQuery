'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface WorkstationTopBarProps {
  activeScenario: string;
  onNavigateCanvas: () => void;
  activeViewTool?: 'single' | 'swipe' | 'tripane';
  setActiveViewTool?: (tool: 'single' | 'swipe' | 'tripane') => void;
  setActiveWorkstationTab?: (tab: 'rsvqa' | 'bitemporal' | 'audittrace') => void;
  targetMethod?: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  baseMapType?: 'esri' | 'osm';
  setBaseMapType?: (type: 'esri' | 'osm') => void;
}

export default function WorkstationTopBar({
  activeScenario,
  onNavigateCanvas
}: WorkstationTopBarProps) {
  return (
    <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-32px)]">
      {/* Search & Scenario Title */}
      <div className="flex items-center h-12 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] px-3 gap-2 w-[360px] sm:w-[390px]">
        <button
          onClick={onNavigateCanvas}
          className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition cursor-pointer"
          title="Back to Setup Canvas"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 truncate text-xs font-semibold text-[#202124]">
          {activeScenario}
        </div>
      </div>
    </div>
  );
}
