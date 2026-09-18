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
  onNavigateCanvas
}: WorkstationTopBarProps) {
  return (
    <div className="absolute top-3 left-3 z-[400] pointer-events-auto">
      <button
        type="button"
        onClick={onNavigateCanvas}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#5f6368] hover:text-[#202124] shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] transition cursor-pointer"
        title="Back to Setup Canvas"
        aria-label="Back to Setup Canvas"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
