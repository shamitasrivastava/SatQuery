'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting: `code`, **bold**, *italic*, [link](url)
 */
function renderInline(text: string): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${match.index}-${token.slice(0, 5)}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={key} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const splitIdx = token.indexOf('](');
      const label = token.slice(1, splitIdx);
      const url = token.slice(splitIdx + 2, -1);
      nodes.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0284c7] hover:underline font-medium"
        >
          {label}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let codeBlockLang = '';

  let currentParagraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={key} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
            {renderInline(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block fences
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph(`p-before-code-${i}`);
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockBuffer = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <div key={`code-${i}`} className="my-2.5 rounded-xl bg-slate-900 text-slate-100 p-3 text-xs font-mono overflow-x-auto border border-slate-800 shadow-sm">
            {codeBlockLang && (
              <div className="text-[10px] text-slate-400 font-sans uppercase mb-1 tracking-wider">
                {codeBlockLang}
              </div>
            )}
            <pre className="whitespace-pre">{codeBlockBuffer.join('\n')}</pre>
          </div>
        );
        codeBlockBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine);
      continue;
    }

    // Empty line -> flush current paragraph
    if (!trimmed) {
      flushParagraph(`p-${i}`);
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph(`p-before-h-${i}`);
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
            {renderInline(text)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#0284c7] rounded-sm" />
            {renderInline(text)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-xs sm:text-sm font-semibold text-slate-800 mt-2.5 mb-1">
            {renderInline(text)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-slate-800 mt-2 mb-1">
            {renderInline(text)}
          </h4>
        );
      }
      continue;
    }

    // Bullet lists (e.g. `* `, `- `, `+ `, or indented `    * `)
    const bulletMatch = rawLine.match(/^(\s*)([\*\-\+])\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph(`p-before-bullet-${i}`);
      const indentSpaces = bulletMatch[1].length;
      const isNested = indentSpaces >= 2;
      const itemText = bulletMatch[3];

      elements.push(
        <div
          key={`bullet-${i}`}
          className={`flex items-start gap-2.5 my-1.5 ${isNested ? 'ml-6 text-slate-600' : 'ml-1 text-slate-700'}`}
        >
          {isNested ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#0284c7] mt-1.5 shrink-0 shadow-sm" />
          )}
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            {renderInline(itemText)}
          </div>
        </div>
      );
      continue;
    }

    // Numbered lists (e.g. `1. `, `2. `)
    const numMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushParagraph(`p-before-num-${i}`);
      const num = numMatch[2];
      const itemText = numMatch[3];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 ml-1 text-slate-700">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#e8f0fe] text-[#0284c7] text-[11px] font-bold shrink-0 mt-0.5">
            {num}
          </span>
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            {renderInline(itemText)}
          </div>
        </div>
      );
      continue;
    }

    // Standard text line -> accumulator for paragraph
    currentParagraph.push(trimmed);
  }

  flushParagraph('p-final');

  return (
    <div className={`space-y-1 ${className}`}>
      {elements}
    </div>
  );
}
