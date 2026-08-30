'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface PresetSelectorProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export default function PresetSelector({ selectedKey, onSelect }: PresetSelectorProps) {
  const presets = [
    { id: 'assam_flood', label: '🌊 Assam Flood' },
    { id: 'port_recon', label: '⚓ Port & Tanks' },
    { id: 'urban_sprawl', label: '🏙️ Urban Sprawl' },
    { id: 'wildfire', label: '🔥 Burn Scar' },
  ];

  return (
    <div className="hidden md:flex items-center gap-2 bg-tactical-950 px-3 py-1.5 rounded-lg border border-tactical-800 text-xs">
      <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
      </span>
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition ${
            selectedKey === p.id
              ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-500/50'
              : 'bg-tactical-800 text-slate-300 hover:bg-cyan-950 border border-transparent'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}