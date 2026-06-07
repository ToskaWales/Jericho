import { useEffect, useRef } from 'react';
import { parseTranscript, type TranscriptLine } from '@/lib/transcript';

function TranscriptBubble({ line }: { line: TranscriptLine }) {
  if (line.speaker === 'agent') {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] font-medium text-blue-500 pr-1">Agent</span>
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-xs text-white shadow-sm">
          {line.text}
        </div>
      </div>
    );
  }
  if (line.speaker === 'customer') {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[10px] font-medium text-gray-400 pl-1">Customer</span>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 shadow-sm">
          {line.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className="text-[10px] text-muted-foreground italic">{line.text}</span>
    </div>
  );
}

interface Props {
  transcript?: string | null;
  emptyMessage?: string;
  maxHeight?: string;
  className?: string;
}

export function TranscriptView({
  transcript,
  emptyMessage = 'No transcript recorded for this call.',
  maxHeight = 'max-h-72',
  className = '',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = transcript ? parseTranscript(transcript) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!transcript?.trim()) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">{emptyMessage}</p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto rounded-lg border bg-white p-3 space-y-2 ${maxHeight} ${className}`}
    >
      {lines.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No transcript lines found.</p>
      ) : (
        lines.map((line, i) => <TranscriptBubble key={i} line={line} />)
      )}
    </div>
  );
}
