import { Persona, PersonalityTrait } from '../types';

type PersonaInput = Pick<Persona,
  'name' | 'role' | 'personality' | 'objective' | 'dos' | 'donts' | 'closingStyle'
>;

export function buildPersonaPrompt(persona: PersonaInput): string {
  const traits = (persona.personality as PersonalityTrait[]).join(', ');

  const sections: string[] = [
    `You are ${persona.name}, a ${persona.role} at this dental clinic.`,
    `Your communication style is ${traits}. Convey this through your word choice and tone.`,
    `Your goal for this call: ${persona.objective}`,
  ];

  if (persona.dos.length > 0) {
    const list = persona.dos.map((item, i) => `${i + 1}. ${item}`).join('\n');
    sections.push(`Always do the following:\n${list}`);
  }

  if (persona.donts.length > 0) {
    const list = persona.donts.map((item, i) => `${i + 1}. ${item}`).join('\n');
    sections.push(`Never do the following:\n${list}`);
  }

  sections.push(`When concluding the call: ${persona.closingStyle}`);
  sections.push(
    'Patient context will be provided: name, appointment type, date/time, and last visit. ' +
    'Use these details to personalize each call naturally.'
  );

  return sections.join('\n\n');
}
