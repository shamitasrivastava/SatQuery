'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';

interface ChatFeedProps {
  messages: Array<{ sender: 'user' | 'ai'; text: string }>;
  isLoading: boolean;
  loadingLabel?: string;
}

export default function ChatFeed({
  messages,
  isLoading,
  loadingLabel = 'Querying Model Engine...'
}: ChatFeedProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex w-full ${msg.sender === 'user' ? 'justify-end pr-2 pl-6' : 'justify-start pl-2 pr-6'}`}
        >
          {msg.sender === 'user' ? (
            /* User Bubble: Soft Pastel Blue (#bdd8ef) with Vibrant Blue font (#256fa8) */
            <div className="relative bg-[#bdd8ef] text-[#256fa8] px-4 py-3 rounded-2xl text-[13.5px] font-medium leading-snug max-w-[92%] shadow-sm">
              <svg
                className="absolute -top-[0px] -right-[9px] w-[10px] h-[12px] text-[#bdd8ef] pointer-events-none"
                viewBox="0 0 10 12"
                fill="currentColor"
              >
                <path d="M0 0 L10 0 C6 1.5 2 5 0 12 Z" />
              </svg>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          ) : (
            /* AI Assistant Bubble: Soft Light Peach (#fde3d2) with Warm Terracotta font (#995535) */
            <div className="relative bg-[#fde3d2] text-[#995535] px-4 py-3 rounded-2xl text-[13.5px] font-medium leading-snug max-w-[92%] shadow-sm">
              <svg
                className="absolute -top-[0px] -left-[9px] w-[10px] h-[12px] text-[#fde3d2] pointer-events-none"
                viewBox="0 0 10 12"
                fill="currentColor"
              >
                <path d="M10 0 L0 0 C4 1.5 8 5 10 12 Z" />
              </svg>
              <MarkdownRenderer content={msg.text} className="text-[#995535]" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start pl-2 pr-6">
          <div className="relative bg-[#fde3d2]/90 text-[#995535] px-4 py-3 rounded-2xl text-[13.5px] font-medium flex items-center gap-2 shadow-sm">
            <svg
              className="absolute -top-[0px] -left-[9px] w-[10px] h-[12px] text-[#fde3d2]/90 pointer-events-none"
              viewBox="0 0 10 12"
              fill="currentColor"
            >
              <path d="M10 0 L0 0 C4 1.5 8 5 10 12 Z" />
            </svg>
            <Loader2 className="w-4 h-4 animate-spin text-[#995535]" />
            <span>{loadingLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
