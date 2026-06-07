export type TranscriptLine =
  | { speaker: 'agent'; text: string }
  | { speaker: 'customer'; text: string }
  | { speaker: 'unknown'; text: string };

export function parseTranscript(raw: string): TranscriptLine[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): TranscriptLine => {
      const agentMatch = line.match(/^(Agent|Assistant|AI|Bot)\s*:\s*/i);
      if (agentMatch) return { speaker: 'agent', text: line.slice(agentMatch[0].length).trim() };
      const customerMatch = line.match(/^(Customer|Patient|User|Caller)\s*:\s*/i);
      if (customerMatch) return { speaker: 'customer', text: line.slice(customerMatch[0].length).trim() };
      return { speaker: 'unknown', text: line };
    });
}
