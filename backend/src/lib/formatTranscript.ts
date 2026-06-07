/** Normalize Fonio post-call transcript payloads into Agent:/Customer: lines. */

const AGENT_ROLES = new Set(['agent', 'assistant', 'ai', 'bot', 'system']);
const CUSTOMER_ROLES = new Set(['customer', 'patient', 'user', 'caller', 'human']);

function speakerLabel(role: string): 'Agent' | 'Customer' | null {
  const r = role.toLowerCase().trim();
  if (AGENT_ROLES.has(r)) return 'Agent';
  if (CUSTOMER_ROLES.has(r)) return 'Customer';
  return null;
}

function lineFromObject(item: Record<string, unknown>): string | null {
  const text = [item.text, item.content, item.message, item.transcript]
    .find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  if (!text?.trim()) return null;

  const role = [item.role, item.speaker, item.type, item.from]
    .find((v) => typeof v === 'string') as string | undefined;
  const label = role ? speakerLabel(role) : null;
  return label ? `${label}: ${text.trim()}` : text.trim();
}

export function formatTranscriptFromArray(items: unknown[]): string | null {
  const lines: string[] = [];
  let alternateAgent = true;

  for (const item of items) {
    if (typeof item === 'string' && item.trim()) {
      const label = alternateAgent ? 'Agent' : 'Customer';
      lines.push(`${label}: ${item.trim()}`);
      alternateAgent = !alternateAgent;
      continue;
    }
    if (item && typeof item === 'object') {
      const line = lineFromObject(item as Record<string, unknown>);
      if (line) lines.push(line);
    }
  }

  return lines.length > 0 ? lines.join('\n') : null;
}

export function resolveTranscript(payload: {
  formattedTranscript?: string | null;
  transcript?: unknown[] | null;
}): string | null {
  if (payload.formattedTranscript?.trim()) {
    return payload.formattedTranscript.trim();
  }
  if (Array.isArray(payload.transcript) && payload.transcript.length > 0) {
    return formatTranscriptFromArray(payload.transcript);
  }
  return null;
}
