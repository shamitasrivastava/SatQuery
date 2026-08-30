'use client';

import React, { useState } from 'react';
import { BoundingBoxDetection, ChatMessage } from '../types/satquery';
import { Cpu, Send, Mic, Target } from 'lucide-react';

interface VqaGroundingPanelProps {
  detections: BoundingBoxDetection[];
  onHoverDetection: (id: number | string | null) => void;
}

export default function VqaGroundingPanel({ detections, onHoverDetection }: VqaGroundingPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Visual Question Answering initialized with Falcon-0.7B-RS. Grounded 4 assets in target viewport.',
      timestamp: '10:00:00'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-2.5 bg-tactical-950 border-b border-tactical-800 text-[11px] font-mono flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Pipeline: <strong className="text-white">FALCON-RS-GROUNDING</strong></span>
        </div>
        <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-[10px] font-bold">READY</span>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs">
        {messages.map(msg => (
          <div key={msg.id} className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-950/40 border border-cyan-800/50 text-cyan-100 ml-6' : 'bg-tactical-950 border border-tactical-800 text-slate-200 mr-6'}`}>
            <div className="text-[10px] font-mono text-slate-400 mb-1">{msg.sender === 'user' ? 'ANALYST' : 'SATQUERY AI'}</div>
            {msg.text}
          </div>
        ))}

        <div className="space-y-1.5 pt-2">
          <div className="text-[10px] font-mono uppercase text-slate-400">Identified Entities ({detections.length})</div>
          {detections.map(det => (
            <div
              key={det.id}
              onMouseEnter={() => onHoverDetection(det.id)}
              onMouseLeave={() => onHoverDetection(null)}
              className="flex items-center justify-between p-2 rounded bg-tactical-950 border border-tactical-800 hover:border-cyan-500 cursor-pointer text-xs font-mono transition"
            >
              <span className="flex items-center gap-1.5 text-slate-200">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> {det.label}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">{(det.confidence * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="p-3 bg-tactical-950 border-t border-tactical-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about structures, vessels, or metrics..."
          className="flex-1 bg-tactical-900 border border-tactical-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button type="button" className="p-2 text-slate-400 hover:text-cyan-400 bg-tactical-900 border border-tactical-700 rounded-lg"><Mic className="w-4 h-4" /></button>
        <button type="submit" className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg font-bold text-xs"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
}