"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(value: string) {
  return escapeHtml(value)
    .replace(/\b(function|return|const|let|for|if|else|console|log)\b/g, '<span class="text-[#ffd166]">$1</span>')
    .replace(/('.*?'|".*?"|`.*?`)/g, '<span class="text-[#89f0c2]">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-[#6cc7ff]">$1</span>');
}

export function CodeEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 220
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}) {
  const id = useId();

  return (
    <label htmlFor={id} className={cn("block", className)}>
      <div
        className="relative overflow-hidden rounded-[28px] border border-pop-ink/10 bg-[#1f2940] shadow-card"
        style={{ minHeight }}
      >
        <pre
          aria-hidden
          className="pointer-events-none min-h-[220px] overflow-auto px-5 py-4 font-mono text-sm leading-7 text-white"
          dangerouslySetInnerHTML={{
            __html: `${highlightCode(value || placeholder || "// Напиши решение здесь")}\n`
          }}
        />
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="absolute inset-0 h-full w-full resize-none bg-transparent px-5 py-4 font-mono text-sm leading-7 text-transparent caret-white outline-none placeholder:text-white/30"
        />
      </div>
    </label>
  );
}
