import type { CreatePersonaPayload } from '@/types';

export function buildPersonaPromptClient(persona: Partial<CreatePersonaPayload>): string {
  const name = persona.name?.trim() || 'Your Agent';
  const role = persona.role?.trim() || 'dental receptionist';
  const traits = (persona.personality ?? []).join(', ') || 'professional';
  const objective = persona.objective?.trim() || '';
  const dos = (persona.dos ?? []).filter(Boolean);
  const donts = (persona.donts ?? []).filter(Boolean);
  const closing = persona.closingStyle?.trim() || '';

  const sections: string[] = [
    `You are ${name}, a ${role} at this dental clinic.`,
    `Your communication style is ${traits}. Convey this through your word choice and tone.`,
  ];

  if (objective) sections.push(`Your goal for this call: ${objective}`);

  if (dos.length > 0) {
    sections.push(`Always do the following:\n${dos.map((d, i) => `${i + 1}. ${d}`).join('\n')}`);
  }

  if (donts.length > 0) {
    sections.push(`Never do the following:\n${donts.map((d, i) => `${i + 1}. ${d}`).join('\n')}`);
  }

  if (closing) sections.push(`When concluding the call: ${closing}`);

  sections.push(
    'Patient context will be provided: name, appointment type, date/time, and last visit. ' +
    'Use these details to personalize each call naturally.'
  );

  return sections.join('\n\n');
}
