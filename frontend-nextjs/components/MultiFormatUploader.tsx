'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Layers } from 'lucide-react';

interface MultiFormatUploaderProps {
  onFilesSelected: (files: { t1File: File | null; t2File: File | null; mode: 'single' | 'bi-temporal' }) => void;
}

export default function MultiFormatUploader({ onFilesSelected }: MultiFormatUploaderProps) {
  const [uploadMode, setUploadMode] = useState<'single' | 'bi-temporal'>('single');
  const [t1File, setT1File] = useState<File | null>(null);
  const [t2File, setT2File] = useState<File | null>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);
  const t1InputRef = useRef<HTMLInputElement>(null);
  const t2InputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ".tif,.tiff,.png,.jpg,.jpeg,.geotiff";

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setT1File(file);
      onFilesSelected({ t1File: file, t2File: null, mode: 'single' });
    }
  };

  const handleT1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setT1File(file);
      if (t2File) {
        onFilesSelected({ t1File: file, t2File, mode: 'bi-temporal' });
      }
    }
  };

  const handleT2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setT2File(file);
      if (t1File) {
        onFilesSelected({ t1File, t2File: file, mode: 'bi-temporal' });
      }
    }
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Upload Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-slate-400 font-semibold">Format Support: GeoTIFF, PNG, JPG</span>
        <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setUploadMode('single')}
            className={`px-2.5 py-1 rounded transition ${uploadMode === 'single' ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400'}`}
          >
            Single Scene
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('bi-temporal')}
            className={`px-2.5 py-1 rounded transition ${uploadMode === 'bi-temporal' ? 'bg-cyan-900/80 text-cyan-200 font-bold' : 'text-slate-400'}`}
          >
            Bi-Temporal Pair
          </button>
        </div>
      </div>

      {/* Upload Dropzones */}
      {uploadMode === 'single' ? (
        <div
          onClick={() => singleInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-cyan-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/60 hover:bg-slate-900/80 transition"
        >
          <input
            ref={singleInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleSingleChange}
            className="hidden"
          />
          {t1File ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <FileCheck className="w-4 h-4" />
              <span>{t1File.name} ({(t1File.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-cyan-400" />
              <div className="text-slate-300">Drop GeoTIFF / PNG / JPG scene here</div>
              <div className="text-[10px] text-slate-500">Supports Cartosat, Sentinel-2, or aerial orthomosaics</div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* T1 Baseline */}
          <div
            onClick={() => t1InputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-cyan-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/60 transition text-center"
          >
            <input
              ref={t1InputRef}
              type="file"
              accept={acceptedFormats}
              onChange={handleT1Change}
              className="hidden"
            />
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-300">T1: Pre-Event / Baseline</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
              {t1File ? t1File.name : 'Select GeoTIFF / JPG'}
            </span>
          </div>

          {/* T2 Post-Event */}
          <div
            onClick={() => t2InputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-rose-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-950/60 transition text-center"
          >
            <input
              ref={t2InputRef}
              type="file"
              accept={acceptedFormats}
              onChange={handleT2Change}
              className="hidden"
            />
            <Layers className="w-4 h-4 text-rose-400" />
            <span className="text-[11px] font-bold text-slate-300">T2: Post-Event / Change</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
              {t2File ? t2File.name : 'Select GeoTIFF / JPG'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}