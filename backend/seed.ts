/**
 * Seed script — wipes all Firestore collections and re-populates with realistic demo data.
 * Run from the backend directory: npx ts-node seed.ts
 */
import * as admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { buildPersonaPrompt } from './src/lib/buildPersonaPrompt';
import type { PersonalityTrait } from './src/types';

if (admin.apps.length === 0) {
  const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json');
  if (!fs.existsSync(saPath)) throw new Error(`service-account.json not found at ${saPath}`);
  admin.initializeApp({ credential: admin.credential.cert(saPath) });
}
const db = getFirestore();
const ts = (iso: string) => Timestamp.fromDate(new Date(iso));
const now = () => Timestamp.now();

async function clearCollection(name: string): Promise<void> {
  const snap = await db.collection(name).limit(400).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  if (snap.size === 400) await clearCollection(name);
}

function ref(col: string, id: string) {
  return db.collection(col).doc(id);
}

// ── IDs ─────────────────────────────────────────────────────────────────────

const LOC = 'loc-central';

const TYPE = {
  cleaning:  'type-cleaning',
  checkup:   'type-checkup',
  whitening: 'type-whitening',
};

const CUST = {
  sophie:    'cust-sophie',
  hans:      'cust-hans',
  anna:      'cust-anna',
  thomas:    'cust-thomas',
  maria:     'cust-maria',
  klaus:     'cust-klaus',
  elisabeth: 'cust-elisabeth',
  michael:   'cust-michael',
  laura:     'cust-laura',
  stefan:    'cust-stefan',
  petra:     'cust-petra',
  david:     'cust-david',
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗑  Clearing all collections…');
  const collections = [
    'customers', 'appointments', 'appointmentTypes', 'locations',
    'waitlist', 'recoveryJobs', 'callAttempts', 'customerContactHistory', 'settings', 'personas',
  ];
  for (const c of collections) { await clearCollection(c); console.log(`   ✓ ${c}`); }

  console.log('\n🌱 Seeding…\n');

  const batch1 = db.batch();

  // ── Location ───────────────────────────────────────────────────────────────
  batch1.set(ref('locations', LOC), {
    name: 'Jericho Dental — Vienna Central',
    address: 'Stephansplatz 5, 1010 Wien',
    phone: '+43 1 234 5678',
    timezone: 'Europe/Vienna',
  });

  // ── Appointment Types ──────────────────────────────────────────────────────
  batch1.set(ref('appointmentTypes', TYPE.cleaning), {
    name: 'Professional Cleaning', duration: 30, price: 120, locationId: LOC,
  });
  batch1.set(ref('appointmentTypes', TYPE.checkup), {
    name: 'Comprehensive Checkup', duration: 45, price: 150, locationId: LOC,
  });
  batch1.set(ref('appointmentTypes', TYPE.whitening), {
    name: 'Teeth Whitening', duration: 60, price: 280, locationId: LOC,
  });

  // ── Customers ──────────────────────────────────────────────────────────────
  const customers = [
    {
      id: CUST.sophie, name: 'Sophie Müller', phone: '+491632421661',
      email: 'sophie.mueller@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaning, TYPE.checkup],
      isActive: true, appointmentCount: 15, lastVisitDate: '2026-03-12',
      createdAt: ts('2023-01-15T08:00:00Z'), updatedAt: ts('2026-03-12T10:30:00Z'),
    },
    {
      id: CUST.hans, name: 'Hans Bauer', phone: '+491632421661',
      email: 'hans.bauer@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.cleaning],
      isActive: true, appointmentCount: 3, lastVisitDate: '2026-01-20',
      createdAt: ts('2025-01-10T08:00:00Z'), updatedAt: ts('2026-01-20T14:00:00Z'),
    },
    {
      id: CUST.anna, name: 'Anna Berger', phone: '+491632421661',
      email: 'anna.berger@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'ANY', preferredAppointmentTypeIds: [TYPE.cleaning],
      isActive: true, appointmentCount: 1,
      createdAt: ts('2026-04-01T08:00:00Z'), updatedAt: ts('2026-04-01T08:00:00Z'),
    },
    {
      id: CUST.thomas, name: 'Thomas Gruber', phone: '+491632421661',
      email: 'thomas.gruber@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaning, TYPE.checkup],
      isActive: true, appointmentCount: 7, lastVisitDate: '2026-04-22',
      createdAt: ts('2024-02-01T08:00:00Z'), updatedAt: ts('2026-04-22T09:00:00Z'),
    },
    {
      id: CUST.maria, name: 'Maria Huber', phone: '+491632421661',
      email: 'maria.huber@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.whitening, TYPE.cleaning],
      isActive: true, appointmentCount: 12, lastVisitDate: '2026-02-14',
      createdAt: ts('2023-06-01T08:00:00Z'), updatedAt: ts('2026-02-14T14:00:00Z'),
    },
    {
      id: CUST.klaus, name: 'Klaus Fischer', phone: '+491632421661',
      email: 'k.fischer@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'EVENING', preferredAppointmentTypeIds: [TYPE.cleaning],
      isActive: true, appointmentCount: 2, lastVisitDate: '2025-09-05',
      createdAt: ts('2025-08-01T08:00:00Z'), updatedAt: ts('2025-09-05T18:00:00Z'),
    },
    {
      id: CUST.elisabeth, name: 'Elisabeth Wagner', phone: '+491632421661',
      email: 'elisabeth.wagner@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.checkup, TYPE.cleaning],
      isActive: true, appointmentCount: 9, lastVisitDate: '2026-05-03',
      createdAt: ts('2023-09-01T08:00:00Z'), updatedAt: ts('2026-05-03T09:00:00Z'),
    },
    {
      id: CUST.michael, name: 'Michael Schwarz', phone: '+491632421661',
      email: 'm.schwarz@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'ANY', preferredAppointmentTypeIds: [TYPE.cleaning],
      isActive: true, appointmentCount: 4, lastVisitDate: '2025-12-10',
      createdAt: ts('2024-10-01T08:00:00Z'), updatedAt: ts('2025-12-10T11:00:00Z'),
    },
    {
      id: CUST.laura, name: 'Laura Hoffmann', phone: '+491632421661',
      email: 'laura.hoffmann@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.whitening, TYPE.cleaning],
      isActive: true, appointmentCount: 6, lastVisitDate: '2026-04-08',
      createdAt: ts('2024-03-01T08:00:00Z'), updatedAt: ts('2026-04-08T09:30:00Z'),
    },
    {
      id: CUST.stefan, name: 'Stefan Braun', phone: '+491632421661',
      email: 'stefan.braun@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.checkup],
      isActive: true, appointmentCount: 2, lastVisitDate: '2025-11-20',
      createdAt: ts('2025-09-01T08:00:00Z'), updatedAt: ts('2025-11-20T14:00:00Z'),
    },
    {
      id: CUST.petra, name: 'Petra König', phone: '+491632421661',
      email: 'petra.koenig@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaning, TYPE.checkup, TYPE.whitening],
      isActive: true, appointmentCount: 18, lastVisitDate: '2026-05-20',
      createdAt: ts('2022-06-01T08:00:00Z'), updatedAt: ts('2026-05-20T09:00:00Z'),
    },
    {
      id: CUST.david, name: 'David Zimmermann', phone: '+491632421661',
      email: 'd.zimmermann@email.at', locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.checkup, TYPE.cleaning],
      isActive: true, appointmentCount: 5, lastVisitDate: '2026-03-30',
      createdAt: ts('2024-01-01T08:00:00Z'), updatedAt: ts('2026-03-30T10:00:00Z'),
    },
  ];
  customers.forEach(({ id, ...data }) => batch1.set(ref('customers', id), data));

  // ── Settings ───────────────────────────────────────────────────────────────
  batch1.set(ref('settings', 'default'), {
    aiSystemPrompt: 'You are a warm and professional dental clinic assistant calling on behalf of Jericho Dental. A slot has just become available and you are offering it to a patient who expressed interest in an earlier appointment. Be concise, friendly, and respectful of their time.',
    maxRetries: 2,
    callbackDelayMinutes: 30,
    voiceSettings: { voiceId: 'default', language: 'en-US', speakingStyle: 'friendly', tone: 'professional' },
    updatedAt: now(),
  });

  await batch1.commit();
  console.log('✓ location, appointmentTypes, customers, settings');

  // ── Appointments ───────────────────────────────────────────────────────────
  const batch2 = db.batch();

  // Cancelled slots (ready to trigger recovery)
  batch2.set(ref('appointments', 'appt-cancelled-1'), {
    customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-08T10:00:00Z'), endTime: ts('2026-07-08T10:30:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-01T08:00:00Z'), cancelledBy: 'patient',
    price: 120,
    createdAt: ts('2026-05-20T10:00:00Z'), updatedAt: ts('2026-07-01T08:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-cancelled-2'), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-14T09:00:00Z'), endTime: ts('2026-07-14T09:45:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-05T11:00:00Z'), cancelledBy: 'patient',
    price: 150,
    createdAt: ts('2026-05-25T09:00:00Z'), updatedAt: ts('2026-07-05T11:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-cancelled-3'), {
    customerId: CUST.laura, customerName: 'Laura Hoffmann', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.whitening, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-22T14:00:00Z'), endTime: ts('2026-07-22T15:00:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-10T10:00:00Z'), cancelledBy: 'patient',
    price: 280,
    createdAt: ts('2026-06-01T10:00:00Z'), updatedAt: ts('2026-07-10T10:00:00Z'),
  });

  // Future BOOKED — candidates for recovery (wantsEarlierSlot: true)
  batch2.set(ref('appointments', 'appt-sophie-booked'), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-18T09:00:00Z'), endTime: ts('2026-08-18T09:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-05-01T09:00:00Z'), updatedAt: ts('2026-05-01T09:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-thomas-booked'), {
    customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-12T09:00:00Z'), endTime: ts('2026-08-12T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-05-10T09:00:00Z'), updatedAt: ts('2026-05-10T09:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-elisabeth-booked'), {
    customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-20T09:00:00Z'), endTime: ts('2026-08-20T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-06-02T09:00:00Z'), updatedAt: ts('2026-06-02T09:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-maria-booked'), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-02T14:00:00Z'), endTime: ts('2026-09-02T14:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-05-20T14:00:00Z'), updatedAt: ts('2026-05-20T14:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-anna-booked'), {
    customerId: CUST.anna, customerName: 'Anna Berger', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-20T10:00:00Z'), endTime: ts('2026-09-20T10:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: false,
    createdAt: ts('2026-07-06T10:05:00Z'), updatedAt: ts('2026-07-06T10:05:00Z'),
  });
  batch2.set(ref('appointments', 'appt-hans-booked'), {
    customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-15T14:00:00Z'), endTime: ts('2026-09-15T14:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-06-05T14:00:00Z'), updatedAt: ts('2026-06-05T14:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-michael-booked'), {
    customerId: CUST.michael, customerName: 'Michael Schwarz', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-10T10:00:00Z'), endTime: ts('2026-09-10T10:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: false,
    createdAt: ts('2026-06-01T10:00:00Z'), updatedAt: ts('2026-06-01T10:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-klaus-booked'), {
    customerId: CUST.klaus, customerName: 'Klaus Fischer', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-05T18:00:00Z'), endTime: ts('2026-08-05T18:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-06-01T18:00:00Z'), updatedAt: ts('2026-06-01T18:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-laura-booked'), {
    customerId: CUST.laura, customerName: 'Laura Hoffmann', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.whitening, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-10-05T10:00:00Z'), endTime: ts('2026-10-05T11:00:00Z'),
    status: 'BOOKED', price: 280, wantsEarlierSlot: true,
    createdAt: ts('2026-06-10T10:00:00Z'), updatedAt: ts('2026-06-10T10:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-stefan-booked'), {
    customerId: CUST.stefan, customerName: 'Stefan Braun', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-25T14:00:00Z'), endTime: ts('2026-09-25T14:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-06-12T14:00:00Z'), updatedAt: ts('2026-06-12T14:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-petra-booked'), {
    customerId: CUST.petra, customerName: 'Petra König', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-28T09:00:00Z'), endTime: ts('2026-08-28T09:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-06-15T09:00:00Z'), updatedAt: ts('2026-06-15T09:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-david-booked'), {
    customerId: CUST.david, customerName: 'David Zimmermann', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-08T09:00:00Z'), endTime: ts('2026-09-08T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-06-18T09:00:00Z'), updatedAt: ts('2026-06-18T09:00:00Z'),
  });

  // Historical COMPLETED (give customers visit history)
  batch2.set(ref('appointments', 'appt-sophie-h1'), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2025-09-10T09:00:00Z'), endTime: ts('2025-09-10T09:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2025-07-01T09:00:00Z'), updatedAt: ts('2025-09-10T09:30:00Z'),
  });
  batch2.set(ref('appointments', 'appt-sophie-h2'), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-03-12T09:00:00Z'), endTime: ts('2026-03-12T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-01-10T09:00:00Z'), updatedAt: ts('2026-03-12T09:45:00Z'),
  });
  batch2.set(ref('appointments', 'appt-thomas-h1'), {
    customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-04-22T09:00:00Z'), endTime: ts('2026-04-22T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-02-01T09:00:00Z'), updatedAt: ts('2026-04-22T09:45:00Z'),
  });
  batch2.set(ref('appointments', 'appt-maria-h1'), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.whitening, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-02-14T14:00:00Z'), endTime: ts('2026-02-14T15:00:00Z'),
    status: 'COMPLETED', price: 280,
    createdAt: ts('2025-12-01T14:00:00Z'), updatedAt: ts('2026-02-14T15:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-elisabeth-h1'), {
    customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-05-03T09:00:00Z'), endTime: ts('2026-05-03T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-03-01T09:00:00Z'), updatedAt: ts('2026-05-03T09:45:00Z'),
  });
  batch2.set(ref('appointments', 'appt-petra-h1'), {
    customerId: CUST.petra, customerName: 'Petra König', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.whitening, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2025-11-15T09:00:00Z'), endTime: ts('2025-11-15T10:00:00Z'),
    status: 'COMPLETED', price: 280,
    createdAt: ts('2025-09-01T09:00:00Z'), updatedAt: ts('2025-11-15T10:00:00Z'),
  });
  batch2.set(ref('appointments', 'appt-petra-h2'), {
    customerId: CUST.petra, customerName: 'Petra König', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-05-20T09:00:00Z'), endTime: ts('2026-05-20T09:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2026-03-15T09:00:00Z'), updatedAt: ts('2026-05-20T09:30:00Z'),
  });
  batch2.set(ref('appointments', 'appt-laura-h1'), {
    customerId: CUST.laura, customerName: 'Laura Hoffmann', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-04-08T09:00:00Z'), endTime: ts('2026-04-08T09:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2026-02-10T09:00:00Z'), updatedAt: ts('2026-04-08T09:30:00Z'),
  });
  batch2.set(ref('appointments', 'appt-david-h1'), {
    customerId: CUST.david, customerName: 'David Zimmermann', customerPhone: '+491632421661',
    appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-03-30T10:00:00Z'), endTime: ts('2026-03-30T10:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-01-15T10:00:00Z'), updatedAt: ts('2026-03-30T10:45:00Z'),
  });

  await batch2.commit();
  console.log('✓ appointments (3 cancelled, 12 booked, 9 historical)');

  // ── Waitlist ───────────────────────────────────────────────────────────────
  const batch3 = db.batch();

  const waitlistEntries = [
    {
      id: 'wl-sophie', customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-01T09:00:00Z'), updatedAt: ts('2026-05-01T09:00:00Z'),
    },
    {
      id: 'wl-thomas', customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 5, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-10T09:00:00Z'), updatedAt: ts('2026-05-10T09:00:00Z'),
      notes: 'Patient mentioned strong preference for early morning slots',
    },
    {
      id: 'wl-elisabeth', customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-02T09:00:00Z'), updatedAt: ts('2026-06-02T09:00:00Z'),
    },
    {
      id: 'wl-petra', customerId: CUST.petra, customerName: 'Petra König', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 8, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-05T09:00:00Z'), updatedAt: ts('2026-06-05T09:00:00Z'),
      notes: 'Long-standing patient — high priority. Flexible on exact time.',
    },
    {
      id: 'wl-laura', customerId: CUST.laura, customerName: 'Laura Hoffmann', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.whitening, appointmentTypeName: 'Teeth Whitening',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-08T10:00:00Z'), updatedAt: ts('2026-06-08T10:00:00Z'),
    },
    {
      id: 'wl-david', customerId: CUST.david, customerName: 'David Zimmermann', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 3, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-10T09:00:00Z'), updatedAt: ts('2026-06-10T09:00:00Z'),
      notes: 'Requested earlier slot due to work travel schedule',
    },
    {
      id: 'wl-hans', customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-12T14:00:00Z'), updatedAt: ts('2026-06-12T14:00:00Z'),
    },
    {
      id: 'wl-stefan', customerId: CUST.stefan, customerName: 'Stefan Braun', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.checkup, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-14T14:00:00Z'), updatedAt: ts('2026-06-14T14:00:00Z'),
    },
    {
      id: 'wl-michael', customerId: CUST.michael, customerName: 'Michael Schwarz', customerPhone: '+491632421661',
      appointmentTypeId: TYPE.cleaning, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'ANY', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-15T11:00:00Z'), updatedAt: ts('2026-06-15T11:00:00Z'),
    },
  ];
  waitlistEntries.forEach(({ id, ...data }) => batch3.set(ref('waitlist', id), data));

  await batch3.commit();
  console.log('✓ waitlist (9 entries)');

  // ── Recovery jobs & call attempts (demo transcripts) ───────────────────────
  const batch4 = db.batch();

  const JOB = { success: 'job-success', failed: 'job-failed' };

  const sophieTranscript =
    'Agent: Hello, may I please speak with Sophie Müller?\n' +
    'Customer: Yes, speaking. Who is this?\n' +
    'Agent: Hi Sophie, this is Jericho Dental calling. A cleaning appointment on July 8th at 10 AM has just opened up. Would that work for you?\n' +
    'Customer: Oh, July 8th at ten? Yes, that works perfectly — I was hoping something would come up sooner.\n' +
    'Agent: Wonderful! I will confirm that booking for you right now.\n' +
    'Customer: Perfect, thank you so much. See you then!';

  batch4.set(ref('recoveryJobs', JOB.success), {
    appointmentId: 'appt-cancelled-1',
    appointmentTypeId: TYPE.cleaning,
    appointmentTypeName: 'Professional Cleaning',
    locationId: LOC,
    locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-07-08T10:00:00Z'),
    status: 'SUCCESS',
    currentCandidateIndex: 0,
    candidates: [
      {
        customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+491632421661',
        score: 92, reachabilityScore: 85, aiRankingReason: 'Strong match — wants earlier cleaning slot',
        originalAppointmentId: 'appt-sophie-booked', status: 'ACCEPTED', retryCount: 0,
        callAttemptIds: ['ca-success-1'], contactedAt: ts('2026-07-01T09:05:00Z'),
      },
      {
        customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+491632421661',
        score: 71, reachabilityScore: 60, aiRankingReason: 'Secondary candidate',
        originalAppointmentId: 'appt-hans-booked', status: 'PENDING', retryCount: 0,
        callAttemptIds: [],
      },
    ],
    totalAttempts: 1,
    price: 120,
    winnerCustomerId: CUST.sophie,
    winnerCustomerName: 'Sophie Müller',
    createdAt: ts('2026-07-01T09:00:00Z'),
    updatedAt: ts('2026-07-01T09:12:00Z'),
    completedAt: ts('2026-07-01T09:12:00Z'),
  });

  batch4.set(ref('recoveryJobs', JOB.failed), {
    appointmentId: 'appt-cancelled-2',
    appointmentTypeId: TYPE.checkup,
    appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC,
    locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-07-14T09:00:00Z'),
    status: 'FAILED',
    currentCandidateIndex: 1,
    candidates: [
      {
        customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
        score: 88, reachabilityScore: 70, aiRankingReason: 'Top candidate for checkup slot',
        originalAppointmentId: 'appt-elisabeth-booked', status: 'NO_ANSWER', retryCount: 2,
        callAttemptIds: ['ca-failed-1', 'ca-failed-2'], contactedAt: ts('2026-07-05T11:30:00Z'),
      },
      {
        customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+491632421661',
        score: 79, reachabilityScore: 65, aiRankingReason: 'Second candidate',
        originalAppointmentId: 'appt-thomas-booked', status: 'DECLINED', retryCount: 1,
        callAttemptIds: ['ca-failed-3'], contactedAt: ts('2026-07-05T12:00:00Z'),
      },
    ],
    totalAttempts: 3,
    price: 150,
    createdAt: ts('2026-07-05T11:00:00Z'),
    updatedAt: ts('2026-07-05T12:15:00Z'),
    completedAt: ts('2026-07-05T12:15:00Z'),
  });

  batch4.set(ref('callAttempts', 'ca-success-1'), {
    recoveryJobId: JOB.success, customerId: CUST.sophie,
    customerName: 'Sophie Müller', customerPhone: '+491632421661',
    appointmentId: 'appt-cancelled-1', fonioCallId: 'fonio-demo-1',
    status: 'COMPLETED', outcome: 'ACCEPTED', attemptNumber: 1,
    initiatedAt: ts('2026-07-01T09:05:00Z'), completedAt: ts('2026-07-01T09:12:00Z'),
    duration: 142, transcript: sophieTranscript,
  });

  batch4.set(ref('callAttempts', 'ca-failed-1'), {
    recoveryJobId: JOB.failed, customerId: CUST.elisabeth,
    customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
    appointmentId: 'appt-cancelled-2', fonioCallId: 'fonio-demo-2',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 1,
    initiatedAt: ts('2026-07-05T11:30:00Z'), completedAt: ts('2026-07-05T11:31:00Z'),
    duration: 28, transcript: null,
  });

  batch4.set(ref('callAttempts', 'ca-failed-2'), {
    recoveryJobId: JOB.failed, customerId: CUST.elisabeth,
    customerName: 'Elisabeth Wagner', customerPhone: '+491632421661',
    appointmentId: 'appt-cancelled-2', fonioCallId: 'fonio-demo-3',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 2,
    initiatedAt: ts('2026-07-05T11:45:00Z'), completedAt: ts('2026-07-05T11:46:00Z'),
    duration: 30, transcript: null,
  });

  const thomasDeclineTranscript =
    'Agent: Hi Thomas, this is Jericho Dental. We have a checkup slot available on July 14th at 9 AM. Would you like to take it?\n' +
    'Customer: Thanks, but I cannot make that date. Please keep my current appointment.\n' +
    'Agent: No problem at all. Have a great day!';

  batch4.set(ref('callAttempts', 'ca-failed-3'), {
    recoveryJobId: JOB.failed, customerId: CUST.thomas,
    customerName: 'Thomas Gruber', customerPhone: '+491632421661',
    appointmentId: 'appt-cancelled-2', fonioCallId: 'fonio-demo-4',
    status: 'COMPLETED', outcome: 'DECLINED', attemptNumber: 1,
    initiatedAt: ts('2026-07-05T12:00:00Z'), completedAt: ts('2026-07-05T12:06:00Z'),
    duration: 95, transcript: thomasDeclineTranscript,
    declineReason: 'Cannot make that date',
  });

  await batch4.commit();
  console.log('✓ recovery jobs & call attempts');

  // ── Personas ───────────────────────────────────────────────────────────────
  const personaBatch = db.batch();

  const mayaData = {
    name: 'Maya', role: 'patient care coordinator',
    personality: ['warm', 'empathetic', 'friendly'] as PersonalityTrait[],
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
    assignedTypeIds: [] as string[], isActive: true,
    stats: { totalCalls: 0, acceptedCalls: 0, acceptanceRate: 0 },
  };
  personaBatch.set(db.collection('personas').doc('persona-maya'), {
    ...mayaData,
    generatedPrompt: buildPersonaPrompt(mayaData),
    createdAt: now(), updatedAt: now(),
  });

  const alexData = {
    name: 'Alex', role: 'dental receptionist',
    personality: ['professional', 'direct', 'calm'] as PersonalityTrait[],
    objective: "Efficiently communicate the availability of an appointment slot and confirm the patient's preference to take it.",
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
    assignedTypeIds: [] as string[], isActive: false,
    stats: { totalCalls: 0, acceptedCalls: 0, acceptanceRate: 0 },
  };
  personaBatch.set(db.collection('personas').doc('persona-alex'), {
    ...alexData,
    generatedPrompt: buildPersonaPrompt(alexData),
    createdAt: now(), updatedAt: now(),
  });

  const jordanData = {
    name: 'Jordan', role: 'dental receptionist',
    personality: ['friendly', 'energetic', 'warm'] as PersonalityTrait[],
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
    assignedTypeIds: [] as string[], isActive: false,
    stats: { totalCalls: 0, acceptedCalls: 0, acceptanceRate: 0 },
  };
  personaBatch.set(db.collection('personas').doc('persona-jordan'), {
    ...jordanData,
    generatedPrompt: buildPersonaPrompt(jordanData),
    createdAt: now(), updatedAt: now(),
  });

  await personaBatch.commit();
  console.log('✓ personas (Maya active, Alex, Jordan)');

  console.log('\n✅ Seed complete!\n');
  console.log('Summary:');
  console.log('   1  location');
  console.log('   3  appointment types (Cleaning, Checkup, Whitening)');
  console.log('  12  customers');
  console.log('  24  appointments (3 cancelled, 12 booked, 9 historical)');
  console.log('   9  waitlist entries');
  console.log('   2  recovery jobs (1 SUCCESS with transcript, 1 FAILED with mixed attempts)');
  console.log('   4  call attempts (2 with transcripts, 2 without)');
  console.log('   1  settings doc');
  console.log('   3  personas (Maya active, Alex, Jordan)');
}

main().catch((err) => { console.error(err); process.exit(1); });
