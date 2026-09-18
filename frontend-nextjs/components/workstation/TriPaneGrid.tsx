'use client';

import React from 'react';
import { FileImage, SlidersHorizontal } from 'lucide-react';

interface TriPaneGridProps {
  targetMethod: 'auto' | 'single' | 'bitemporal' | 'opticalsar';
  t1DataUrl: string | null;
  t2DataUrl: string | null;
  changeMaskUrl: string | null;
}

export default function TriPaneGrid({
  targetMethod,
  t1DataUrl,
  t2DataUrl,
  changeMaskUrl
}: TriPaneGridProps) {
  const isOpticalSar = targetMethod === 'opticalsar';

  return (
    <div className={`w-full h-full grid ${isOpticalSar ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 bg-slate-950 p-2.5`}>
      {/* Panel 1: T1 / S2 Optical Image */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 flex items-center justify-center shadow-2xl">
        <div className="absolute top-3 left-13 z-20 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{isOpticalSar ? 'Sentinel-2 (Optical)' : 'T1 Image'}</span>
        </div>

        {t1DataUrl ? (
          <img
            src={t1DataUrl}
            alt={isOpticalSar ? 'Sentinel-2 Optical' : 'T1 Image'}
            className="w-full h-full object-cover block select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <FileImage className="w-7 h-7 mb-2 opacity-40" />
            <span>{isOpticalSar ? 'Sentinel-2 Multispectral Swath' : 'Baseline Raster [Assam Brahmaputra Basin - Pre Flood]'}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-10 w-7 h-7 rounded-full bg-black/80 border border-slate-700/80 flex items-center justify-center text-white text-[11px] font-serif font-bold shadow">
          N
        </div>
      </div>

      {/* Panel 2: T2 / S1 SAR Image */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 flex items-center justify-center shadow-2xl">
        <div className="absolute top-3 left-3 z-20 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 border border-amber-800/60 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{isOpticalSar ? 'Sentinel-1 (SAR VV)' : 'T2 Image'}</span>
        </div>

        {t2DataUrl || t1DataUrl ? (
          <img
            src={(t2DataUrl || t1DataUrl) ?? undefined}
            alt={isOpticalSar ? 'Sentinel-1 SAR' : 'T2 Image'}
            className="w-full h-full object-cover filter contrast-125 block select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <FileImage className="w-7 h-7 mb-2 opacity-40" />
            <span>{isOpticalSar ? 'Sentinel-1 SAR Radar Swath' : 'Target Raster [Assam Brahmaputra Basin - Inundated]'}</span>
          </div>
        )}
      </div>

      {/* Panel 3: Change Mask / Thematic Output (Bit-CD Only) */}
      {!isOpticalSar && (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-rose-950/60 bg-slate-950 flex items-center justify-center shadow-2xl">
          <div className="absolute top-3 left-3 z-20 bg-rose-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-rose-400 border border-rose-800/80 flex items-center gap-1.5 shadow">
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span>Masking</span>
          </div>

          {changeMaskUrl && (
            <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono border border-slate-700 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-black border border-slate-500" /> [0] Unchanged
              </span>
              <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-white border border-rose-500 shadow-[0_0_6px_rgba(255,255,255,0.8)]" /> [1] Inundation / Change
              </span>
            </div>
          )}

          {changeMaskUrl ? (
            <img
              src={changeMaskUrl}
              alt="Binary Mask"
              className="w-full h-full object-cover filter contrast-150 block select-none"
            />
          ) : (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-3" />
              <span className="text-[11px] font-mono text-slate-400">
                Awaiting Siamese Mask from backend...
              </span>
              <span className="text-[9px] font-mono text-slate-600 mt-1">
                Send a query to initialize matrix generation
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
