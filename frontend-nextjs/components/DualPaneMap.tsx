'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnalysisMode, BoundingBoxDetection } from '../types/satquery';
import { Crosshair, MoveHorizontal, Compass } from 'lucide-react';
import * as GeoTIFF from 'geotiff';

interface DualPaneMapProps {
  mode: AnalysisMode;
  coordinates: [number, number];
  zoom: number;
  locationName: string;
  sensorName: string;
  detections: BoundingBoxDetection[];
  showBBoxes: boolean;
  maskOpacity: number;
  hoveredDetectionId: number | string | null;
  onHoverDetection: (id: number | string | null) => void;
  scenarioId: string;
  uploadedFile?: File | null;
  uploadedT2File?: File | null;
}

export default function DualPaneMap({
  mode,
  coordinates,
  zoom,
  locationName,
  sensorName,
  detections = [],
  showBBoxes = true,
  maskOpacity = 0.75,
  hoveredDetectionId,
  onHoverDetection,
  scenarioId,
  uploadedFile,
  uploadedT2File,
}: DualPaneMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const bboxLayerGroupRef = useRef<any>(null);
  const heatmapLayerGroupRef = useRef<any>(null);
  const t1OverlayRef = useRef<any>(null);
  const t2OverlayRef = useRef<any>(null);
  const currentScenarioIdRef = useRef<string>(scenarioId);
  
  const [swipeX, setSwipeX] = useState<number>(0.5);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState<boolean>(false);

  // Helper to decode either GeoTIFF or standard images to a data URL
  const decodeFileToDataUrl = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.tif') || fileName.endsWith('.tiff')) {
      const buffer = await file.arrayBuffer();
      const tiff = await GeoTIFF.fromArrayBuffer(buffer);
      const image = await tiff.getImage();
      const rgb = (await image.readRGB({ interleave: true })) as any;

      const canvas = document.createElement('canvas');
      canvas.width = image.getWidth();
      canvas.height = image.getHeight();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.createImageData(image.getWidth(), image.getHeight());
        for (let i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
          imgData.data[i] = Number(rgb[j]) || 0;
          imgData.data[i + 1] = Number(rgb[j + 1]) || 0;
          imgData.data[i + 2] = Number(rgb[j + 2]) || 0;
          imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL();
      }
    }
    return URL.createObjectURL(file);
  };

  // 1. Initialize Map Instance
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let L: any;
    try { L = (window as any).L || require('leaflet'); } catch (e) {}
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: coordinates,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        inertia: true,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        tileSize: 256,
        keepBuffer: 6,
      }).addTo(map);

      bboxLayerGroupRef.current = L.layerGroup().addTo(map);
      heatmapLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // 2. Scenario Switching Pan
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentScenarioIdRef.current !== scenarioId) {
      currentScenarioIdRef.current = scenarioId;
      mapInstanceRef.current.invalidateSize();
      mapInstanceRef.current.flyTo(coordinates, zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [scenarioId, coordinates, zoom]);

  // 3. Render Uploaded T1 & T2 Rasters
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    let L: any;
    try { L = (window as any).L || require('leaflet'); } catch (e) {}
    if (!L) return;

    if (t1OverlayRef.current) mapInstanceRef.current.removeLayer(t1OverlayRef.current);
    if (t2OverlayRef.current) mapInstanceRef.current.removeLayer(t2OverlayRef.current);

    const targetBounds = L.latLngBounds(
      [coordinates[0] - 0.05, coordinates[1] - 0.06],
      [coordinates[0] + 0.05, coordinates[1] + 0.06]
    );

    // Render T1 Layer
    if (uploadedFile) {
      decodeFileToDataUrl(uploadedFile).then((url) => {
        t1OverlayRef.current = L.imageOverlay(url, targetBounds, {
          opacity: 0.95,
          interactive: false,
          className: 't1-raster-layer'
        }).addTo(mapInstanceRef.current);
        mapInstanceRef.current.fitBounds(targetBounds, { animate: true, padding: [30, 30] });
      });
    }

    // Render T2 Layer (for Bi-Temporal Comparisons)
    if (uploadedT2File) {
      decodeFileToDataUrl(uploadedT2File).then((url) => {
        t2OverlayRef.current = L.imageOverlay(url, targetBounds, {
          opacity: mode === 'single' ? 0 : 0.95,
          interactive: false,
          className: 't2-raster-layer'
        }).addTo(mapInstanceRef.current);
      });
    }
  }, [uploadedFile, uploadedT2File, coordinates, mode]);

  // 4. Render Bounding Boxes
  useEffect(() => {
    if (!mapInstanceRef.current || !bboxLayerGroupRef.current) return;
    let L: any;
    try { L = (window as any).L || require('leaflet'); } catch (e) {}
    if (!L) return;

    bboxLayerGroupRef.current.clearLayers();

    if (showBBoxes && detections && detections.length > 0) {
      detections.forEach((item) => {
        const [lat1, lng1, lat2, lng2] = item.bbox;
        const bounds = [
          [Math.min(lat1, lat2), Math.min(lng1, lng2)],
          [Math.max(lat1, lat2), Math.max(lng1, lng2)],
        ];

        const isHovered = hoveredDetectionId === item.id;
        const mainColor = item.color || '#06b6d4';

        const rect = L.rectangle(bounds, {
          color: isHovered ? '#38bdf8' : mainColor,
          weight: isHovered ? 3 : 2,
          fillColor: isHovered ? '#38bdf8' : mainColor,
          fillOpacity: isHovered ? 0.35 : 0.15,
        });

        const tagText = `<b>${item.label}</b> &middot; ${Math.round((item.confidence || 0.95) * 100)}%`;
        rect.bindTooltip(tagText, {
          permanent: true,
          direction: 'top',
          className: 'custom-leaflet-tooltip',
        });

        rect.on('mouseover', () => onHoverDetection(item.id));
        rect.on('mouseout', () => onHoverDetection(null));

        bboxLayerGroupRef.current.addLayer(rect);
      });
    }
  }, [detections, showBBoxes, hoveredDetectionId, onHoverDetection]);

  // 5. Render Danger Heatmaps for Flood Scenarios
  useEffect(() => {
    if (!mapInstanceRef.current || !heatmapLayerGroupRef.current) return;
    let L: any;
    try { L = (window as any).L || require('leaflet'); } catch (e) {}
    if (!L) return;

    heatmapLayerGroupRef.current.clearLayers();

    if (scenarioId === 'assam_flood') {
      const coreCircle = L.circle(coordinates, {
        radius: 3500,
        color: '#ef4444',
        weight: 1,
        fillColor: '#ef4444',
        fillOpacity: maskOpacity * 0.45,
        interactive: false,
      });

      const bufferCircle = L.circle(coordinates, {
        radius: 6500,
        color: '#f59e0b',
        weight: 1,
        fillColor: '#06b6d4',
        fillOpacity: maskOpacity * 0.25,
        interactive: false,
      });

      heatmapLayerGroupRef.current.addLayer(bufferCircle);
      heatmapLayerGroupRef.current.addLayer(coreCircle);
    }
  }, [coordinates, maskOpacity, scenarioId]);

  // Mouse drag handlers for smooth swipe bar
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSwipe || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const pos = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    setSwipeX(pos);
  }, [isDraggingSwipe]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coordinates, zoom, { duration: 0.8 });
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-slate-950 flex-1 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDraggingSwipe(false)}
      onMouseLeave={() => setIsDraggingSwipe(false)}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Swipe Comparison Handle */}
      {mode === 'swipe' && (
        <div
          style={{ left: `${swipeX * 100}%` }}
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 z-20 cursor-ew-resize flex items-center justify-center"
          onMouseDown={() => setIsDraggingSwipe(true)}
        >
          <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-2xl hover:scale-110 active:scale-95 transition">
            <MoveHorizontal className="w-4 h-4" />
          </div>
          
          {/* T1 / T2 Badges over the Divider */}
          <span className="absolute top-4 -left-12 px-2 py-0.5 bg-slate-900/90 border border-cyan-500 text-cyan-300 text-[10px] font-mono rounded">
            T1 (Pre)
          </span>
          <span className="absolute top-4 left-3 px-2 py-0.5 bg-slate-900/90 border border-rose-500 text-rose-300 text-[10px] font-mono rounded">
            T2 (Post)
          </span>
        </div>
      )}

      {/* Telemetry HUD */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono shadow-2xl">
          <div className="text-cyan-400 font-bold flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400 animate-pulse" /> {locationName}
          </div>
          <div className="text-slate-400 text-[11px] mt-0.5">
            Coords: {coordinates[0].toFixed(4)}°N, {coordinates[1].toFixed(4)}°E &middot; Sensor: {sensorName}
          </div>
        </div>

        <button
          onClick={handleRecenter}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-cyan-400 hover:text-cyan-300 shadow-2xl transition cursor-pointer"
          title="Recenter Map View"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}  