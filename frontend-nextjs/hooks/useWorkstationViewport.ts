'use client';

import { useState, useRef } from 'react';

export function useWorkstationViewport(activeViewTool: 'single' | 'swipe' | 'tripane') {
  const [imageZoom, setImageZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [swipePos, setSwipePos] = useState<number>(50);
  const isDraggingSwipe = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setImageZoom((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setImageZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDownPan = (e: React.MouseEvent) => {
    if (activeViewTool === 'swipe' || e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSwipe.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSwipePos(pct);
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingSwipe.current = false;
    setIsPanning(false);
  };

  return {
    imageZoom,
    panOffset,
    isPanning,
    swipePos,
    isDraggingSwipe,
    containerRef,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDownPan,
    handleMouseMove,
    handleMouseUp
  };
}
