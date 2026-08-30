'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapEntity {
  id: number;
  name: string;
  confidence: number;
  area_m2: number;
  latMin: number;
  lngMin: number;
  latMax: number;
  lngMax: number;
  color: string;
}

interface WorkstationMapProps {
  center: [number, number];
  zoom: number;
  baseMapType: 'esri' | 'osm';
  showBBoxes: boolean;
  entities: MapEntity[];
  onUpdate: (lat: number, lng: number, zoom: number) => void;
}

export default function WorkstationMap({
  center,
  zoom,
  baseMapType,
  showBBoxes,
  entities,
  onUpdate
}: WorkstationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    const tileUrl =
      baseMapType === 'esri'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Track pan/zoom
    map.on('move', () => {
      const c = map.getCenter();
      onUpdate(c.lat, c.lng, map.getZoom());
    });

    map.on('zoomend', () => {
      const c = map.getCenter();
      onUpdate(c.lat, c.lng, map.getZoom());
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Layer (Satellite <-> Topo)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      baseMapType === 'esri'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [baseMapType]);

  // Handle Scenario FlyTo
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, {
        animate: true,
        duration: 1.0
      });
    }
  }, [center[0], center[1], zoom]);

  // Render High-Precision Grounded BBoxes
  useEffect(() => {
    if (!layerGroupRef.current) return;
    layerGroupRef.current.clearLayers();

    if (showBBoxes) {
      entities.forEach((item) => {
        const bounds: L.LatLngBoundsExpression = [
          [item.latMin, item.lngMin],
          [item.latMax, item.lngMax]
        ];

        const rect = L.rectangle(bounds, {
          color: item.color,
          weight: 2,
          fillOpacity: 0.18,
          dashArray: undefined
        });

        rect.bindTooltip(`${item.name} • ${(item.confidence * 100).toFixed(1)}%`, {
          permanent: true,
          direction: 'top',
          className: 'custom-leaflet-tooltip'
        });

        layerGroupRef.current?.addLayer(rect);
      });
    }
  }, [showBBoxes, entities]);

  return <div ref={mapContainerRef} className="w-full h-full bg-slate-950 z-0" />;
}