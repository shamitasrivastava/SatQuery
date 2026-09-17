'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Layers, Loader2 } from 'lucide-react';
import { MapEntity, ExecutionTrace } from '../../types/satquery';
import WorkstationTopBar from './WorkstationTopBar';
import TriPaneGrid from './TriPaneGrid';
import RasterCanvasViewport from './RasterCanvasViewport';
import WorkstationSidebar from './WorkstationSidebar';
import EmergencySmsModal from '../modals/EmergencySmsModal';
import AuditTraceModal from '../modals/AuditTraceModal';

// Dynamic SSR-safe Leaflet map loader
const WorkstationMap = dynamic(() => import('../WorkstationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center text-[#1a73e8] font-sans text-xs">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Satellite Viewport...
    </div>
  )
});

interface WorkstationViewProps {
  activeScenario: string;
  onNavigateCanvas: () => void;
  handleLoadScenario: (scenario: 'port' | 'flood') => void;
  activeViewTool: 'single' | 'swipe' | 'tripane';
  setActiveViewTool: (tool: 'single' | 'swipe' | 'tripane') => void;
  activeWorkstationTab: 'rsvqa' | 'bitemporal' | 'audittrace';
  setActiveWorkstationTab: (tab: 'rsvqa' | 'bitemporal' | 'audittrace') => void;
  targetMethod: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  baseMapType: 'esri' | 'osm';
  setBaseMapType: (type: 'esri' | 'osm') => void;
  t1DataUrl: string | null;
  t2DataUrl: string | null;
  changeMaskUrl: string | null;
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
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  containerRef: any;
  mapCenter: [number, number];
  mapZoom: number;
  liveCoords: { lat: number; lng: number; zoom: number };
  handleMapUpdate: (lat: number, lng: number, zoom: number) => void;
  isClient: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  detectedPipeline: string;
  visualEvidenceData: Record<string, any> | null;
  chatMessages: Array<{ sender: 'user' | 'ai'; text: string }>;
  isLoading: boolean;
  showSmsModal: boolean;
  setShowSmsModal: (val: boolean) => void;
  showAuditModal: boolean;
  setShowAuditModal: (val: boolean) => void;
  handleExportPDF: () => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendMessage: () => void;
  executionTrace?: ExecutionTrace | null;
}

export default function WorkstationView({
  activeScenario,
  onNavigateCanvas,
  handleLoadScenario,
  activeViewTool,
  setActiveViewTool,
  activeWorkstationTab,
  setActiveWorkstationTab,
  targetMethod,
  baseMapType,
  setBaseMapType,
  t1DataUrl,
  t2DataUrl,
  changeMaskUrl,
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
  handleMouseMove,
  handleMouseUp,
  containerRef,
  mapCenter,
  mapZoom,
  liveCoords,
  handleMapUpdate,
  isClient,
  isSidebarOpen,
  setIsSidebarOpen,
  detectedPipeline,
  visualEvidenceData,
  chatMessages,
  isLoading,
  showSmsModal,
  setShowSmsModal,
  showAuditModal,
  setShowAuditModal,
  handleExportPDF,
  chatInput,
  setChatInput,
  handleSendMessage,
  executionTrace
}: WorkstationViewProps) {
  const totalArea = entities.reduce((a, b) => a + (b.area_m2 || 0), 0);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#e5e3df] font-sans text-[#202124] select-none relative"
      onMouseUp={handleMouseUp}
    >
      {/* 1. Floating Top Navigation Bar */}
      <WorkstationTopBar
        activeScenario={activeScenario}
        onNavigateCanvas={onNavigateCanvas}
        handleLoadScenario={handleLoadScenario}
        activeViewTool={activeViewTool}
        setActiveViewTool={setActiveViewTool}
        setActiveWorkstationTab={setActiveWorkstationTab}
        targetMethod={targetMethod}
        baseMapType={baseMapType}
        setBaseMapType={setBaseMapType}
      />

      {/* 2. Map & Raster Canvas Viewport */}
      <div className="flex flex-1 h-full w-full relative">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="flex-1 relative bg-[#090d16] overflow-hidden select-none"
        >
          {/* Viewport Choice */}
          {activeViewTool === 'tripane' ? (
            <TriPaneGrid
              targetMethod={targetMethod}
              t1DataUrl={t1DataUrl}
              t2DataUrl={t2DataUrl}
              changeMaskUrl={changeMaskUrl}
            />
          ) : t1DataUrl ? (
            <RasterCanvasViewport
              t1DataUrl={t1DataUrl}
              t2DataUrl={t2DataUrl}
              activeViewTool={activeViewTool}
              imageZoom={imageZoom}
              panOffset={panOffset}
              isPanning={isPanning}
              swipePos={swipePos}
              isDraggingSwipe={isDraggingSwipe}
              showBBoxes={showBBoxes}
              setShowBBoxes={setShowBBoxes}
              entities={entities}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              handleResetZoom={handleResetZoom}
              handleMouseDownPan={handleMouseDownPan}
              handleMouseUp={handleMouseUp}
            />
          ) : (
            isClient && (
              <div className="w-full h-full relative">
                <WorkstationMap
                  center={mapCenter}
                  zoom={mapZoom}
                  baseMapType={baseMapType}
                  showBBoxes={showBBoxes}
                  entities={entities}
                  onUpdate={handleMapUpdate}
                />
              </div>
            )
          )}

          {/* Leaflet Street/Satellite toggle */}
          {activeViewTool !== 'tripane' && !t1DataUrl && (
            <div className="absolute bottom-6 left-4 z-[400] flex items-center gap-2">
              <button
                onClick={() => setBaseMapType(baseMapType === 'esri' ? 'osm' : 'esri')}
                className="flex items-center gap-2 bg-white rounded-2xl p-1.5 pr-3 shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#dadce0] hover:bg-[#f8f9fa] transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8] border border-[#dadce0]">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-medium text-[#5f6368] uppercase">Layers</div>
                  <div className="text-xs font-semibold text-[#202124]">
                    {baseMapType === 'esri' ? 'Satellite' : 'Street Map'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowBBoxes(!showBBoxes)}
                className={`px-3 py-2 rounded-2xl border text-xs font-medium shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition flex items-center gap-1.5 cursor-pointer ${
                  showBBoxes
                    ? 'bg-white border-[#1a73e8] text-[#1a73e8]'
                    : 'bg-white border-[#dadce0] text-[#5f6368]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${showBBoxes ? 'bg-[#188038]' : 'bg-[#9aa0a6]'}`} />
                <span>Bounding Box: {showBBoxes ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}

          {/* Coordinates Telemetry Stamp */}
          <div className="absolute bottom-2 right-4 z-[400] text-[11px] font-mono text-[#5f6368] bg-white/85 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-sm border border-[#dadce0]">
            {t1DataUrl
              ? `Optical Swath Active • Zoom: ${Math.round(imageZoom * 100)}% (${imageZoom === 1.0 ? 'Fit' : 'Custom'})`
              : `${liveCoords.lat.toFixed(4)}°N, ${liveCoords.lng.toFixed(4)}°E • Zoom: ${liveCoords.zoom}x`}
          </div>
        </div>

        {/* 3. Details & Analytics Sidebar */}
        <WorkstationSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeWorkstationTab={activeWorkstationTab}
          setActiveWorkstationTab={setActiveWorkstationTab}
          detectedPipeline={detectedPipeline}
          targetMethod={targetMethod}
          visualEvidenceData={visualEvidenceData}
          chatMessages={chatMessages}
          isLoading={isLoading}
          entities={entities}
          onNavigateCanvas={onNavigateCanvas}
          onOpenSmsModal={() => setShowSmsModal(true)}
          onOpenAuditModal={() => setShowAuditModal(true)}
          onExportPdf={handleExportPDF}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
        />
      </div>

      {/* Emergency SMS Broadcast Alert Modal */}
      <EmergencySmsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
      />

      {/* Execution Telemetry & Audit Log Modal */}
      <AuditTraceModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        entitiesCount={entities.length}
        totalAreaM2={totalArea}
        executionTrace={executionTrace}
      />
    </div>
  );
}
