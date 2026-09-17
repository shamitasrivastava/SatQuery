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
    <div className="space-y-3">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`text-xs leading-relaxed p-3 rounded-2xl border ${
            msg.sender === 'user'
              ? 'bg-[#e8f0fe] border-[#d2e3fc] text-[#174ea6] ml-6'
              : 'bg-[#f1f3f4] border-[#dadce0] text-[#202124] mr-4'
          }`}
        >
          <span className="font-semibold text-[11px] block mb-1">
            {msg.sender === 'user' ? 'Operator' : 'BhuViksana Assistant'}
          </span>
          {msg.sender === 'user' ? (
            <div className="whitespace-pre-wrap">{msg.text}</div>
          ) : (
            <MarkdownRenderer content={msg.text} />
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-xs font-mono text-[#1a73e8] p-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {loadingLabel}
        </div>
      )}
    </div>
  );
}
