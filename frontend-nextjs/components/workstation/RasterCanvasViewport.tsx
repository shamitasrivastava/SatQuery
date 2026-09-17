'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, MoveHorizontal } from 'lucide-react';
import { MapEntity } from '../../types/satquery';

interface RasterCanvasViewportProps {
  t1DataUrl: string | null;
  t2DataUrl: string | null;
  activeViewTool: 'single' | 'swipe' | 'tripane';
  imageZoom: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  swipePos: number;
  isDraggingSwipe: React.MutableRefObject<boolean>;
  showBBoxes: boolean;
  setShowBBoxes: (val: boolean) => void;
  entities: MapEntity[];
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  handleMouseDownPan: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

export default function RasterCanvasViewport({
  t1DataUrl,
  t2DataUrl,
  activeViewTool,
  imageZoom,
  panOffset,
  isPanning,
  swipePos,
  isDraggingSwipe,
  showBBoxes,
  setShowBBoxes,
  entities,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  handleMouseDownPan,
  handleMouseUp
}: RasterCanvasViewportProps) {
  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#070b14] select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header Badge */}
      <div className="absolute top-3 left-3 z-20 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 shadow pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span>Single Satellite Imagery Viewport</span>
      </div>

      {/* Floating Zoom & Controls Toolbar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-lg border border-slate-200">
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-1 hover:bg-slate-100 rounded-full text-slate-700 transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono font-bold text-slate-800 px-1 min-w-[42px] text-center">
          {Math.round(imageZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-1 hover:bg-slate-100 rounded-full text-slate-700 transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-300 mx-0.5" />
        <button
          type="button"
          onClick={handleResetZoom}
          title="Reset to Fit View"
          className="px-2 py-0.5 hover:bg-slate-100 rounded-full text-slate-700 transition flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
        >
          <Maximize2 className="w-3 h-3 text-[#1a73e8]" />
          <span>Fit</span>
        </button>
        <button
          type="button"
          onClick={() => setShowBBoxes(!showBBoxes)}
          title="Toggle Bounding Boxes"
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition cursor-pointer ${
            showBBoxes ? 'bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]' : 'bg-slate-100 border-slate-300 text-slate-500'
          }`}
        >
          BBox: {showBBoxes ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Transformable Canvas with Smooth Drag Pan */}
      <div
        className={`relative flex items-center justify-center max-w-full max-h-full ${
          isPanning ? 'cursor-grabbing' : imageZoom > 1 ? 'cursor-grab' : 'cursor-default'
        }`}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${imageZoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.12s ease-out'
        }}
        onMouseDown={handleMouseDownPan}
      >
        {/* Main Raster & Bounding Box Wrapper */}
        <div className="relative inline-block shadow-2xl rounded-xl overflow-visible border border-slate-800">
          <img
            src={(t2DataUrl || t1DataUrl) ?? undefined}
            alt="Satellite Imagery"
            className="h-[calc(100vh-72px)] max-h-[calc(100vh-72px)] max-w-[calc(100%-48px)] w-auto object-contain block select-none pointer-events-none rounded-xl"
            style={{
              filter: activeViewTool === 'swipe' && !t2DataUrl ? 'hue-rotate(90deg) contrast(1.2)' : 'none'
            }}
          />

          {/* Swipe Overlay Layer */}
          {activeViewTool === 'swipe' && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl"
              style={{ width: `${swipePos}%` }}
            >
              <img
                src={t1DataUrl ?? undefined}
                alt="Pre-Event"
                className="h-[calc(100vh-72px)] max-h-[calc(100vh-72px)] max-w-[calc(100%-48px)] w-auto object-contain block max-w-none select-none pointer-events-none rounded-xl"
              />
            </div>
          )}

          {/* Swipe Draggable Divider Handle */}
          {activeViewTool === 'swipe' && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] cursor-ew-resize z-30 flex items-center justify-center"
              style={{ left: `${swipePos}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                isDraggingSwipe.current = true;
              }}
            >
              <div className="w-8 h-8 rounded-full bg-white border border-[#dadce0] flex items-center justify-center shadow-lg text-[#1a73e8]">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 1:1 Vector Bounding Box Overlay */}
          {showBBoxes && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {entities.map((det, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-[#1a73e8] bg-[#1a73e8]/20 rounded pointer-events-none transition-all duration-300 shadow-[0_0_10px_rgba(26,115,232,0.4)]"
                  style={{
                    top: `${det.yPct != null ? Math.max(0, Math.min(98, det.yPct)) : 20}%`,
                    left: `${det.xPct != null ? Math.max(0, Math.min(98, det.xPct)) : 20}%`,
                    width: `${det.wPct != null ? Math.max(2, Math.min(100, det.wPct)) : 15}%`,
                    height: `${det.hPct != null ? Math.max(2, Math.min(100, det.hPct)) : 15}%`
                  }}
                >
                  <span className="absolute -top-5 left-0 text-[10px] font-sans font-medium px-1.5 py-0.5 bg-white text-[#1a73e8] border border-[#dadce0] rounded shadow whitespace-nowrap">
                    {det.name} — {(det.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
