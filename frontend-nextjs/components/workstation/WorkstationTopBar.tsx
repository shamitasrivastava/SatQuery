'use client';

import React from 'react';
import {
  ArrowLeft,
  Columns3,
  MoveHorizontal,
  Globe,
  Map as MapIcon
} from 'lucide-react';

interface WorkstationTopBarProps {
  activeScenario: string;
  onNavigateCanvas: () => void;
  activeViewTool: 'single' | 'swipe' | 'tripane';
  setActiveViewTool: (tool: 'single' | 'swipe' | 'tripane') => void;
  setActiveWorkstationTab: (tab: 'rsvqa' | 'bitemporal' | 'audittrace') => void;
  targetMethod: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  baseMapType: 'esri' | 'osm';
  setBaseMapType: (type: 'esri' | 'osm') => void;
}

export default function WorkstationTopBar({
  activeScenario,
  onNavigateCanvas,
  activeViewTool,
  setActiveViewTool,
  setActiveWorkstationTab,
  targetMethod,
  baseMapType,
  setBaseMapType
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

      {/* View Mode Tools */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
        <button
          onClick={() => {
            setActiveViewTool(activeViewTool === 'tripane' ? 'single' : 'tripane');
            setActiveWorkstationTab('bitemporal');
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap cursor-pointer ${
            activeViewTool === 'tripane'
              ? 'bg-[#1a73e8] text-white font-bold'
              : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span>{targetMethod === 'opticalsar' ? 'Dual-Sensor Fusion' : '3-Pane Bit-CD'}</span>
        </button>

        <button
          onClick={() => setActiveViewTool(activeViewTool === 'swipe' ? 'single' : 'swipe')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition whitespace-nowrap cursor-pointer ${
            activeViewTool === 'swipe'
              ? 'bg-[#e37400] text-white'
              : 'bg-white text-[#3c4043] hover:bg-[#f8f9fa] border border-[#dadce0]'
          }`}
        >
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Swipe Tool</span>
        </button>
      </div>

      {/* Map Style Toggle */}
      <div className="flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-md border border-slate-200 p-0.5 w-fit">
        <button
          onClick={() => setBaseMapType('esri')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            baseMapType === 'esri' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Satellite View</span>
        </button>
        <button
          onClick={() => setBaseMapType('osm')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            baseMapType === 'osm' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-3 h-3" />
          <span>Street Map View</span>
        </button>
      </div>
    </div>
  );
}
