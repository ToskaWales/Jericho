import { Router } from 'express';
import { col, now, docJson } from '../lib/firebase';
import { validateBody } from '../middleware/validate';
import { CreatePersonaSchema, UpdatePersonaSchema } from '../schemas';
import { buildPersonaPrompt } from '../lib/buildPersonaPrompt';
import { Persona } from '../types';

const TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'];

const DEFAULT_STATS = { totalCalls: 0, acceptedCalls: 0, acceptanceRate: 0 };

const STARTER_PERSONAS: Omit<Persona, 'id' | 'generatedPrompt' | 'stats' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Maya',
    role: 'patient care coordinator',
    personality: ['warm', 'empathetic', 'friendly'],
    objective: 'Warmly offer the patient a newly available appointment slot, understanding any scheduling concerns they may have.',
    dos: [
      "Use the patient's first name throughout",
      'Acknowledge if rescheduling is inconvenient',
      'Express genuine care for their dental health',
    ],
    donts: [
      'Rush the conversation',
      'Sound scripted or robotic',
      'Lead with clinical details before building rapport',
    ],
    closingStyle: 'Thank the patient sincerely, confirm the appointment details slowly and clearly, and wish them a great day.',
    assignedTypeIds: [],
    isActive: true,
  },
  {
    name: 'Alex',
    role: 'dental receptionist',
    personality: ['professional', 'direct', 'calm'],
    objective: 'Efficiently communicate the availability of an appointment slot and confirm the patient\'s preference to take it.',
    dos: [
      'Be clear and concise',
      'Confirm appointment details precisely',
      'Offer a straightforward yes/no path forward',
    ],
    donts: [
      'Over-explain or repeat information unnecessarily',
      'Be overly casual',
      'Drag out the conversation',
    ],
    closingStyle: 'Confirm the appointment time and date clearly, provide any next steps, and end the call professionally.',
    assignedTypeIds: [],
    isActive: false,
  },
  {
    name: 'Jordan',
    role: 'dental receptionist',
    personality: ['friendly', 'energetic', 'warm'],
    objective: 'Enthusiastically connect with the patient and make taking the appointment feel exciting and easy.',
    dos: [
      'Use upbeat, positive language',
      'Express genuine excitement about helping them',
      'Make the patient feel valued and appreciated',
    ],
    donts: [
      'Sound desperate or pushy',
      'Use negative or clinical framing',
      'Overwhelm with too much information at once',
    ],
    closingStyle: 'End on a high note, express enthusiasm about seeing them, and leave the patient feeling positive about the visit.',
    assignedTypeIds: [],
    isActive: false,
  },
];

async function seedStarterPersonas(): Promise<void> {
  const batch = col.personas.firestore.batch();
  for (const data of STARTER_PERSONAS) {
    const ref = col.personas.doc();
    batch.set(ref, {
      ...data,
      generatedPrompt: buildPersonaPrompt(data),
      stats: DEFAULT_STATS,
      createdAt: now(),
      updatedAt: now(),
    });
  }
  await batch.commit();
}

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const snap = await col.personas.orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      await seedStarterPersonas();
      const seeded = await col.personas.orderBy('createdAt', 'desc').get();
      return res.json({ data: seeded.docs.map((d) => docJson<Persona>(d, TIMESTAMP_FIELDS)) });
    }
    res.json({ data: snap.docs.map((d) => docJson<Persona>(d, TIMESTAMP_FIELDS)) });
  } catch (err) { next(err); }
});

router.post('/', validateBody(CreatePersonaSchema), async (req, res, next) => {
  try {
    const snap = await col.personas.limit(1).get();
    const isFirst = snap.empty;
    const ref = col.personas.doc();
    const generatedPrompt = buildPersonaPrompt(req.body);
    await ref.set({
      ...req.body,
      generatedPrompt,
      isActive: isFirst,
      stats: DEFAULT_STATS,
      createdAt: now(),
      updatedAt: now(),
    });
    const doc = await ref.get();
    res.status(201).json(docJson<Persona>(doc, TIMESTAMP_FIELDS));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await col.personas.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Persona not found' });
    res.json(docJson<Persona>(doc, TIMESTAMP_FIELDS));
  } catch (err) { next(err); }
});

router.patch('/:id', validateBody(UpdatePersonaSchema), async (req, res, next) => {
  try {
    const ref = col.personas.doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Persona not found' });
    const merged = { ...existing.data(), ...req.body };
    const generatedPrompt = buildPersonaPrompt(merged);
    await ref.update({ ...req.body, generatedPrompt, updatedAt: now() });
    const updated = await ref.get();
    res.json(docJson<Persona>(updated, TIMESTAMP_FIELDS));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = col.personas.doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Persona not found' });
    if (doc.data()?.isActive) {
      return res.status(409).json({ error: 'Cannot delete the active persona. Activate another persona first.' });
    }
    await ref.delete();
    res.status(204).send();
  } catch (err) { next(err); }
});

router.post('/:id/activate', async (req, res, next) => {
  try {
    const targetRef = col.personas.doc(req.params.id);
    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) return res.status(404).json({ error: 'Persona not found' });

    const activeSnap = await col.personas.where('isActive', '==', true).get();
    const batch = col.personas.firestore.batch();
    activeSnap.docs.forEach((d) => {
      if (d.id !== req.params.id) batch.update(d.ref, { isActive: false, updatedAt: now() });
    });
    batch.update(targetRef, { isActive: true, updatedAt: now() });
    await batch.commit();

    const updated = await targetRef.get();
    res.json(docJson<Persona>(updated, TIMESTAMP_FIELDS));
  } catch (err) { next(err); }
});

export default router;
