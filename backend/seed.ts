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

if (admin.apps.length === 0) {
  const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json');
  if (!fs.existsSync(saPath)) throw new Error(`service-account.json not found at ${saPath}`);
  admin.initializeApp({ credential: admin.credential.cert(saPath) });
}
const db = getFirestore();
const ts = (iso: string) => Timestamp.fromDate(new Date(iso));
const now = () => Timestamp.now();

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const LOC = { central: 'loc-central', west: 'loc-west' };

const TYPE = {
  cleaningC:  'type-cleaning-c',
  checkupC:   'type-checkup-c',
  rootC:      'type-root-c',
  whiteningC: 'type-whitening-c',
  xrayC:      'type-xray-c',
  cleaningW:  'type-cleaning-w',
  checkupW:   'type-checkup-w',
  whiteningW: 'type-whitening-w',
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
  julia:     'cust-julia',
  peter:     'cust-peter',
  laura:     'cust-laura',
  franz:     'cust-franz',
};

const JOB = { success: 'job-success', active: 'job-active', failed: 'job-failed', callback: 'job-callback' };

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🗑  Clearing all collections…');
  const collections = [
    'customers', 'appointments', 'appointmentTypes', 'locations',
    'waitlist', 'recoveryJobs', 'callAttempts', 'customerContactHistory', 'settings',
  ];
  for (const c of collections) { await clearCollection(c); console.log(`   ✓ ${c}`); }

  console.log('\n🌱 Seeding…\n');

  const batch1 = db.batch();

  // ── Locations ──────────────────────────────────────────────────────────────
  batch1.set(ref('locations', LOC.central), {
    name: 'Jericho Dental — Vienna Central',
    address: 'Stephansplatz 5, 1010 Wien',
    phone: '+43 1 234 5678',
    timezone: 'Europe/Vienna',
  });
  batch1.set(ref('locations', LOC.west), {
    name: 'Jericho Dental — Vienna West',
    address: 'Mariahilfer Straße 120, 1070 Wien',
    phone: '+43 1 876 5432',
    timezone: 'Europe/Vienna',
  });

  // ── Appointment Types ──────────────────────────────────────────────────────
  const apptTypes = [
    { id: TYPE.cleaningC,  name: 'Professional Cleaning', duration: 30, price: 120, locationId: LOC.central },
    { id: TYPE.checkupC,   name: 'Comprehensive Checkup', duration: 45, price: 150, locationId: LOC.central },
    { id: TYPE.rootC,      name: 'Root Canal Treatment',  duration: 90, price: 450, locationId: LOC.central },
    { id: TYPE.whiteningC, name: 'Teeth Whitening',       duration: 60, price: 280, locationId: LOC.central },
    { id: TYPE.xrayC,      name: 'Dental X-Ray',          duration: 15, price:  80, locationId: LOC.central },
    { id: TYPE.cleaningW,  name: 'Professional Cleaning', duration: 30, price: 120, locationId: LOC.west },
    { id: TYPE.checkupW,   name: 'Comprehensive Checkup', duration: 45, price: 150, locationId: LOC.west },
    { id: TYPE.whiteningW, name: 'Teeth Whitening',       duration: 60, price: 280, locationId: LOC.west },
  ];
  apptTypes.forEach(({ id, ...data }) => batch1.set(ref('appointmentTypes', id), data));

  // ── Customers ──────────────────────────────────────────────────────────────
  const customers = [
    {
      id: CUST.sophie, name: 'Sophie Müller', phone: '+43 664 101 0001',
      email: 'sophie.mueller@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaningC, TYPE.checkupC],
      isActive: true, appointmentCount: 15, lastVisitDate: '2026-03-12',
      createdAt: ts('2023-01-15T08:00:00Z'), updatedAt: ts('2026-03-12T10:30:00Z'),
    },
    {
      id: CUST.hans, name: 'Hans Bauer', phone: '+43 664 101 0002',
      email: 'hans.bauer@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.cleaningC],
      isActive: true, appointmentCount: 3, lastVisitDate: '2026-01-20',
      createdAt: ts('2025-01-10T08:00:00Z'), updatedAt: ts('2026-01-20T14:00:00Z'),
    },
    {
      id: CUST.anna, name: 'Anna Berger', phone: '+43 664 101 0003',
      email: 'anna.berger@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'ANY', preferredAppointmentTypeIds: [TYPE.cleaningC],
      isActive: true, appointmentCount: 1,
      createdAt: ts('2026-04-01T08:00:00Z'), updatedAt: ts('2026-04-01T08:00:00Z'),
    },
    {
      id: CUST.thomas, name: 'Thomas Gruber', phone: '+43 664 101 0004',
      email: 'thomas.gruber@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaningC, TYPE.checkupC, TYPE.xrayC],
      isActive: true, appointmentCount: 7, lastVisitDate: '2026-04-22',
      createdAt: ts('2024-02-01T08:00:00Z'), updatedAt: ts('2026-04-22T09:00:00Z'),
    },
    {
      id: CUST.maria, name: 'Maria Huber', phone: '+43 664 101 0005',
      email: 'maria.huber@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.whiteningC, TYPE.cleaningC],
      isActive: true, appointmentCount: 12, lastVisitDate: '2026-02-14',
      createdAt: ts('2023-06-01T08:00:00Z'), updatedAt: ts('2026-02-14T14:00:00Z'),
    },
    {
      id: CUST.klaus, name: 'Klaus Fischer', phone: '+43 664 101 0006',
      email: 'k.fischer@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'EVENING', preferredAppointmentTypeIds: [TYPE.cleaningC],
      isActive: true, appointmentCount: 2, lastVisitDate: '2025-09-05',
      createdAt: ts('2025-08-01T08:00:00Z'), updatedAt: ts('2025-09-05T18:00:00Z'),
    },
    {
      id: CUST.elisabeth, name: 'Elisabeth Wagner', phone: '+43 664 101 0007',
      email: 'elisabeth.wagner@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.checkupC, TYPE.cleaningC],
      isActive: true, appointmentCount: 9, lastVisitDate: '2026-05-03',
      createdAt: ts('2023-09-01T08:00:00Z'), updatedAt: ts('2026-05-03T09:00:00Z'),
    },
    {
      id: CUST.michael, name: 'Michael Schwarz', phone: '+43 664 101 0008',
      email: 'm.schwarz@email.at', locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'ANY', preferredAppointmentTypeIds: [TYPE.cleaningC],
      isActive: true, appointmentCount: 4, lastVisitDate: '2025-12-10',
      createdAt: ts('2024-10-01T08:00:00Z'), updatedAt: ts('2025-12-10T11:00:00Z'),
    },
    {
      id: CUST.julia, name: 'Julia Mayr', phone: '+43 664 101 0009',
      email: 'julia.mayr@email.at', locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.cleaningW],
      isActive: true, appointmentCount: 1,
      createdAt: ts('2026-05-15T08:00:00Z'), updatedAt: ts('2026-05-15T08:00:00Z'),
    },
    {
      id: CUST.peter, name: 'Peter Zimmermann', phone: '+43 664 101 0010',
      email: 'p.zimmermann@email.at', locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'AFTERNOON', preferredAppointmentTypeIds: [TYPE.cleaningW, TYPE.checkupW],
      isActive: true, appointmentCount: 6, lastVisitDate: '2026-01-08',
      createdAt: ts('2024-04-01T08:00:00Z'), updatedAt: ts('2026-01-08T14:00:00Z'),
    },
    {
      id: CUST.laura, name: 'Laura Schneider', phone: '+43 664 101 0011',
      email: 'laura.schneider@email.at', locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.whiteningW, TYPE.cleaningW],
      isActive: true, appointmentCount: 10, lastVisitDate: '2026-04-15',
      createdAt: ts('2023-03-01T08:00:00Z'), updatedAt: ts('2026-04-15T10:00:00Z'),
    },
    {
      id: CUST.franz, name: 'Franz Moser', phone: '+43 664 101 0012',
      email: 'f.moser@email.at', locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'MORNING', preferredAppointmentTypeIds: [TYPE.checkupW],
      isActive: true, appointmentCount: 5, lastVisitDate: '2026-02-28',
      createdAt: ts('2024-01-01T08:00:00Z'), updatedAt: ts('2026-02-28T09:00:00Z'),
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
  console.log('✓ locations, appointmentTypes, customers, settings');

  // ── Appointments ───────────────────────────────────────────────────────────
  // IDs referenced by recovery jobs
  const A = {
    // Cancelled slots (source of recovery jobs)
    cancelled1: 'appt-cancelled-1',  // Cleaning central Jul 8  → job-success (RECOVERED by Sophie)
    cancelled2: 'appt-cancelled-2',  // Checkup  central Jul 14 → job-active  (IN_PROGRESS)
    cancelled3: 'appt-cancelled-3',  // Cleaning central Jun 20 → job-failed  (FAILED)
    cancelled4: 'appt-cancelled-4',  // Cleaning central Jul 22 → job-callback (CALLBACK_REQUESTED)

    // Recovered slot (Sophie took cancelled1's slot)
    recovered1: 'appt-recovered-1',

    // Active future bookings (candidates for recovery jobs)
    sophieBooked:    'appt-sophie-booked',
    thomasBooked:    'appt-thomas-booked',
    mariaBooked:     'appt-maria-booked',
    klausBooked:     'appt-klaus-booked',
    elisabethBooked: 'appt-elisabeth-booked',
    michaelBooked:   'appt-michael-booked',
    annaCleaning:    'appt-anna-cleaning',
    hansBooked:      'appt-hans-booked',
    juliaBooked:     'appt-julia-booked',
    peterBooked:     'appt-peter-booked',
    lauraBooked:     'appt-laura-booked',
    franzBooked:     'appt-franz-booked',

    // Historical completed (build context / appointmentCount)
    sophieH1: 'appt-sophie-h1', sophieH2: 'appt-sophie-h2',
    thomasH1: 'appt-thomas-h1', mariaH1: 'appt-maria-h1',
    elisabethH1: 'appt-elisabeth-h1', elisabethH2: 'appt-elisabeth-h2',
    peterH1: 'appt-peter-h1', lauraH1: 'appt-laura-h1',
  };

  const batch2 = db.batch();

  // Cancelled slots
  batch2.set(ref('appointments', A.cancelled1), {
    customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+43 664 101 0002',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-08T10:00:00Z'), endTime: ts('2026-07-08T10:30:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-01T08:00:00Z'), cancelledBy: 'patient',
    recoveryJobId: JOB.success, price: 120,
    createdAt: ts('2026-05-20T10:00:00Z'), updatedAt: ts('2026-07-01T08:00:00Z'),
  });
  batch2.set(ref('appointments', A.cancelled2), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+43 664 101 0005',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-14T09:00:00Z'), endTime: ts('2026-07-14T09:45:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-05T11:00:00Z'), cancelledBy: 'patient',
    recoveryJobId: JOB.active, price: 150,
    createdAt: ts('2026-05-25T09:00:00Z'), updatedAt: ts('2026-07-05T11:00:00Z'),
  });
  batch2.set(ref('appointments', A.cancelled3), {
    customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-06-20T11:00:00Z'), endTime: ts('2026-06-20T11:30:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-06-15T09:00:00Z'), cancelledBy: 'clinic',
    recoveryJobId: JOB.failed, price: 120,
    createdAt: ts('2026-04-10T09:00:00Z'), updatedAt: ts('2026-06-15T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.cancelled4), {
    customerId: CUST.anna, customerName: 'Anna Berger', customerPhone: '+43 664 101 0003',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-22T14:00:00Z'), endTime: ts('2026-07-22T14:30:00Z'),
    status: 'CANCELLED', cancelledAt: ts('2026-07-06T10:00:00Z'), cancelledBy: 'patient',
    recoveryJobId: JOB.callback, price: 120,
    createdAt: ts('2026-06-01T10:00:00Z'), updatedAt: ts('2026-07-06T10:00:00Z'),
  });

  // Recovered slot (Sophie took Hans's Jul 8 cleaning slot)
  batch2.set(ref('appointments', A.recovered1), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-07-08T10:00:00Z'), endTime: ts('2026-07-08T10:30:00Z'),
    status: 'RECOVERED', recoveredAt: ts('2026-07-01T08:05:00Z'),
    recoveryJobId: JOB.success, price: 120,
    createdAt: ts('2026-07-01T08:05:00Z'), updatedAt: ts('2026-07-01T08:05:00Z'),
  });

  // Future BOOKED — candidates for ongoing/future recovery jobs
  batch2.set(ref('appointments', A.sophieBooked), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-18T09:00:00Z'), endTime: ts('2026-08-18T09:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-05-01T09:00:00Z'), updatedAt: ts('2026-05-01T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.thomasBooked), {
    customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-12T09:00:00Z'), endTime: ts('2026-08-12T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-05-10T09:00:00Z'), updatedAt: ts('2026-05-10T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.mariaBooked), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+43 664 101 0005',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-02T14:00:00Z'), endTime: ts('2026-09-02T14:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-05-20T14:00:00Z'), updatedAt: ts('2026-05-20T14:00:00Z'),
  });
  batch2.set(ref('appointments', A.klausBooked), {
    customerId: CUST.klaus, customerName: 'Klaus Fischer', customerPhone: '+43 664 101 0006',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-05T18:00:00Z'), endTime: ts('2026-08-05T18:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-06-01T18:00:00Z'), updatedAt: ts('2026-06-01T18:00:00Z'),
  });
  batch2.set(ref('appointments', A.elisabethBooked), {
    customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-08-20T09:00:00Z'), endTime: ts('2026-08-20T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-06-02T09:00:00Z'), updatedAt: ts('2026-06-02T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.michaelBooked), {
    customerId: CUST.michael, customerName: 'Michael Schwarz', customerPhone: '+43 664 101 0008',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-10T10:00:00Z'), endTime: ts('2026-09-10T10:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: false,
    createdAt: ts('2026-06-01T10:00:00Z'), updatedAt: ts('2026-06-01T10:00:00Z'),
  });
  batch2.set(ref('appointments', A.hansBooked), {
    customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+43 664 101 0002',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-15T14:00:00Z'), endTime: ts('2026-09-15T14:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-06-05T14:00:00Z'), updatedAt: ts('2026-06-05T14:00:00Z'),
  });
  batch2.set(ref('appointments', A.annaCleaning), {
    customerId: CUST.anna, customerName: 'Anna Berger', customerPhone: '+43 664 101 0003',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-09-20T10:00:00Z'), endTime: ts('2026-09-20T10:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: false,
    createdAt: ts('2026-07-06T10:05:00Z'), updatedAt: ts('2026-07-06T10:05:00Z'),
  });
  batch2.set(ref('appointments', A.juliaBooked), {
    customerId: CUST.julia, customerName: 'Julia Mayr', customerPhone: '+43 664 101 0009',
    appointmentTypeId: TYPE.cleaningW, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-08-25T09:00:00Z'), endTime: ts('2026-08-25T09:30:00Z'),
    status: 'BOOKED', price: 120, wantsEarlierSlot: true,
    createdAt: ts('2026-05-15T09:00:00Z'), updatedAt: ts('2026-05-15T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.peterBooked), {
    customerId: CUST.peter, customerName: 'Peter Zimmermann', customerPhone: '+43 664 101 0010',
    appointmentTypeId: TYPE.checkupW, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-09-05T14:00:00Z'), endTime: ts('2026-09-05T14:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: true,
    createdAt: ts('2026-05-20T14:00:00Z'), updatedAt: ts('2026-05-20T14:00:00Z'),
  });
  batch2.set(ref('appointments', A.lauraBooked), {
    customerId: CUST.laura, customerName: 'Laura Schneider', customerPhone: '+43 664 101 0011',
    appointmentTypeId: TYPE.whiteningW, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-08-30T09:00:00Z'), endTime: ts('2026-08-30T10:00:00Z'),
    status: 'BOOKED', price: 280, wantsEarlierSlot: false,
    createdAt: ts('2026-05-25T09:00:00Z'), updatedAt: ts('2026-05-25T09:00:00Z'),
  });
  batch2.set(ref('appointments', A.franzBooked), {
    customerId: CUST.franz, customerName: 'Franz Moser', customerPhone: '+43 664 101 0012',
    appointmentTypeId: TYPE.checkupW, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-09-12T09:00:00Z'), endTime: ts('2026-09-12T09:45:00Z'),
    status: 'BOOKED', price: 150, wantsEarlierSlot: false,
    createdAt: ts('2026-06-01T09:00:00Z'), updatedAt: ts('2026-06-01T09:00:00Z'),
  });

  // Historical COMPLETED appointments (give customers history)
  batch2.set(ref('appointments', A.sophieH1), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2025-09-10T09:00:00Z'), endTime: ts('2025-09-10T09:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2025-07-01T09:00:00Z'), updatedAt: ts('2025-09-10T09:30:00Z'),
  });
  batch2.set(ref('appointments', A.sophieH2), {
    customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-03-12T09:00:00Z'), endTime: ts('2026-03-12T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-01-10T09:00:00Z'), updatedAt: ts('2026-03-12T09:45:00Z'),
  });
  batch2.set(ref('appointments', A.thomasH1), {
    customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-04-22T09:00:00Z'), endTime: ts('2026-04-22T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2026-02-01T09:00:00Z'), updatedAt: ts('2026-04-22T09:45:00Z'),
  });
  batch2.set(ref('appointments', A.mariaH1), {
    customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+43 664 101 0005',
    appointmentTypeId: TYPE.whiteningC, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-02-14T14:00:00Z'), endTime: ts('2026-02-14T15:00:00Z'),
    status: 'COMPLETED', price: 280,
    createdAt: ts('2025-12-01T14:00:00Z'), updatedAt: ts('2026-02-14T15:00:00Z'),
  });
  batch2.set(ref('appointments', A.elisabethH1), {
    customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2025-11-10T09:00:00Z'), endTime: ts('2025-11-10T09:45:00Z'),
    status: 'COMPLETED', price: 150,
    createdAt: ts('2025-09-01T09:00:00Z'), updatedAt: ts('2025-11-10T09:45:00Z'),
  });
  batch2.set(ref('appointments', A.elisabethH2), {
    customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    startTime: ts('2026-05-03T09:00:00Z'), endTime: ts('2026-05-03T09:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2026-03-01T09:00:00Z'), updatedAt: ts('2026-05-03T09:30:00Z'),
  });
  batch2.set(ref('appointments', A.peterH1), {
    customerId: CUST.peter, customerName: 'Peter Zimmermann', customerPhone: '+43 664 101 0010',
    appointmentTypeId: TYPE.cleaningW, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-01-08T14:00:00Z'), endTime: ts('2026-01-08T14:30:00Z'),
    status: 'COMPLETED', price: 120,
    createdAt: ts('2025-11-01T14:00:00Z'), updatedAt: ts('2026-01-08T14:30:00Z'),
  });
  batch2.set(ref('appointments', A.lauraH1), {
    customerId: CUST.laura, customerName: 'Laura Schneider', customerPhone: '+43 664 101 0011',
    appointmentTypeId: TYPE.whiteningW, appointmentTypeName: 'Teeth Whitening',
    locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
    startTime: ts('2026-04-15T09:00:00Z'), endTime: ts('2026-04-15T10:00:00Z'),
    status: 'COMPLETED', price: 280,
    createdAt: ts('2026-02-01T09:00:00Z'), updatedAt: ts('2026-04-15T10:00:00Z'),
  });

  await batch2.commit();
  console.log('✓ appointments (cancelled, recovered, booked, historical)');

  // ── Waitlist ───────────────────────────────────────────────────────────────
  const batch3 = db.batch();

  const waitlistEntries = [
    {
      id: 'wl-sophie', customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
      appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-01T09:00:00Z'), updatedAt: ts('2026-05-01T09:00:00Z'),
    },
    {
      id: 'wl-thomas', customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
      appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 5, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-10T09:00:00Z'), updatedAt: ts('2026-05-10T09:00:00Z'),
      notes: 'Patient mentioned strong preference for early morning slots',
    },
    {
      id: 'wl-elisabeth', customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
      appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
      locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-06-02T09:00:00Z'), updatedAt: ts('2026-06-02T09:00:00Z'),
    },
    {
      id: 'wl-julia', customerId: CUST.julia, customerName: 'Julia Mayr', customerPhone: '+43 664 101 0009',
      appointmentTypeId: TYPE.cleaningW, appointmentTypeName: 'Professional Cleaning',
      locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-15T09:00:00Z'), updatedAt: ts('2026-05-15T09:00:00Z'),
    },
    {
      id: 'wl-laura', customerId: CUST.laura, customerName: 'Laura Schneider', customerPhone: '+43 664 101 0011',
      appointmentTypeId: TYPE.whiteningW, appointmentTypeName: 'Teeth Whitening',
      locationId: LOC.west, locationName: 'Jericho Dental — Vienna West',
      preferredTimeOfDay: 'MORNING', manualPriorityBoost: 0, status: 'ACTIVE', consentGiven: true,
      joinedAt: ts('2026-05-25T09:00:00Z'), updatedAt: ts('2026-05-25T09:00:00Z'),
    },
  ];
  waitlistEntries.forEach(({ id, ...data }) => batch3.set(ref('waitlist', id), data));

  await batch3.commit();
  console.log('✓ waitlist');

  // ── Recovery Jobs ─────────────────────────────────────────────────────────
  const batch4 = db.batch();

  // job-success: Cleaning at central on Jul 8 — Sophie accepted (DONE)
  batch4.set(ref('recoveryJobs', JOB.success), {
    appointmentId: A.cancelled1,
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-07-08T10:00:00Z'),
    status: 'SUCCESS',
    currentCandidateIndex: 0,
    candidates: [
      {
        customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
        score: 100, reachabilityScore: 85,
        aiRankingReason: 'Loyal morning patient with prior acceptance — best fit for this slot.',
        originalAppointmentId: A.sophieBooked,
        status: 'ACCEPTED', retryCount: 0, callAttemptIds: ['ca-success-1'],
        contactedAt: ts('2026-07-01T08:02:00Z'), lastAttemptAt: ts('2026-07-01T08:02:00Z'),
      },
      {
        customerId: CUST.hans, customerName: 'Hans Bauer', customerPhone: '+43 664 101 0002',
        score: 60, reachabilityScore: 72,
        aiRankingReason: 'Afternoon preference does not match this morning slot; previously declined.',
        originalAppointmentId: A.hansBooked,
        status: 'PENDING', retryCount: 0, callAttemptIds: [],
      },
      {
        customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
        score: 80, reachabilityScore: 78,
        aiRankingReason: 'Morning preference match, loyal patient, but no prior recovery contact.',
        originalAppointmentId: A.thomasBooked,
        status: 'PENDING', retryCount: 0, callAttemptIds: [],
      },
    ],
    winnerCustomerId: CUST.sophie, winnerCustomerName: 'Sophie Müller',
    totalAttempts: 1, price: 120,
    createdAt: ts('2026-07-01T08:00:00Z'), updatedAt: ts('2026-07-01T08:05:00Z'),
    completedAt: ts('2026-07-01T08:05:00Z'),
  });

  // job-active: Checkup at central on Jul 14 — Elisabeth exhausted, now calling Thomas (IN_PROGRESS)
  batch4.set(ref('recoveryJobs', JOB.active), {
    appointmentId: A.cancelled2,
    appointmentTypeId: TYPE.checkupC, appointmentTypeName: 'Comprehensive Checkup',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-07-14T09:00:00Z'),
    status: 'IN_PROGRESS',
    currentCandidateIndex: 1,
    candidates: [
      {
        customerId: CUST.elisabeth, customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
        score: 90, reachabilityScore: 80,
        aiRankingReason: 'Top morning patient with prior acceptance history — called first.',
        originalAppointmentId: A.elisabethBooked,
        status: 'EXHAUSTED', retryCount: 2, callAttemptIds: ['ca-active-1', 'ca-active-2'],
        lastAttemptAt: ts('2026-07-05T09:45:00Z'),
      },
      {
        customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
        score: 80, reachabilityScore: 78,
        aiRankingReason: 'Loyal morning patient wanting a checkup — strong second choice.',
        originalAppointmentId: A.thomasBooked,
        status: 'CONTACTED', retryCount: 0, callAttemptIds: ['ca-active-3'],
        contactedAt: ts('2026-07-07T09:00:00Z'), lastAttemptAt: ts('2026-07-07T09:00:00Z'),
      },
      {
        customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
        score: 70, reachabilityScore: 85,
        aiRankingReason: 'Prefers cleaning over checkup, but high reachability makes her a solid reserve.',
        originalAppointmentId: A.sophieBooked,
        status: 'PENDING', retryCount: 0, callAttemptIds: [],
      },
      {
        customerId: CUST.maria, customerName: 'Maria Huber', customerPhone: '+43 664 101 0005',
        score: 60, reachabilityScore: 65,
        aiRankingReason: 'Afternoon preference conflicts with this morning slot.',
        originalAppointmentId: A.mariaBooked,
        status: 'PENDING', retryCount: 0, callAttemptIds: [],
      },
    ],
    totalAttempts: 3, price: 150,
    createdAt: ts('2026-07-05T11:05:00Z'), updatedAt: ts('2026-07-07T09:00:00Z'),
  });

  // job-failed: Cleaning at central on Jun 20 — no one answered (FAILED)
  batch4.set(ref('recoveryJobs', JOB.failed), {
    appointmentId: A.cancelled3,
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-06-20T11:00:00Z'),
    status: 'FAILED',
    currentCandidateIndex: 1,
    candidates: [
      {
        customerId: CUST.klaus, customerName: 'Klaus Fischer', customerPhone: '+43 664 101 0006',
        score: 50, reachabilityScore: 20,
        aiRankingReason: 'Low reachability due to repeated no-answers — risk of wasted calls.',
        originalAppointmentId: A.klausBooked,
        status: 'EXHAUSTED', retryCount: 2, callAttemptIds: ['ca-failed-1', 'ca-failed-2'],
        lastAttemptAt: ts('2026-06-15T18:30:00Z'),
      },
      {
        customerId: CUST.michael, customerName: 'Michael Schwarz', customerPhone: '+43 664 101 0008',
        score: 55, reachabilityScore: 55,
        aiRankingReason: 'No strong time preference match but decent reachability score.',
        originalAppointmentId: A.michaelBooked,
        status: 'EXHAUSTED', retryCount: 2, callAttemptIds: ['ca-failed-3', 'ca-failed-4'],
        lastAttemptAt: ts('2026-06-16T11:00:00Z'),
      },
    ],
    totalAttempts: 4, price: 120,
    createdAt: ts('2026-06-15T09:05:00Z'), updatedAt: ts('2026-06-16T11:30:00Z'),
    completedAt: ts('2026-06-16T11:30:00Z'),
  });

  // job-callback: Cleaning at central on Jul 22 — Sophie called back, waiting (CALLBACK_REQUESTED)
  batch4.set(ref('recoveryJobs', JOB.callback), {
    appointmentId: A.cancelled4,
    appointmentTypeId: TYPE.cleaningC, appointmentTypeName: 'Professional Cleaning',
    locationId: LOC.central, locationName: 'Jericho Dental — Vienna Central',
    slotTime: ts('2026-07-22T14:00:00Z'),
    status: 'CALLBACK_REQUESTED',
    currentCandidateIndex: 0,
    candidates: [
      {
        customerId: CUST.sophie, customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
        score: 100, reachabilityScore: 85,
        aiRankingReason: 'Highest priority — morning patient but asked for callback at 2 PM today.',
        originalAppointmentId: A.sophieBooked,
        status: 'CALLBACK_REQUESTED', retryCount: 0, callAttemptIds: ['ca-callback-1'],
        contactedAt: ts('2026-07-06T10:05:00Z'), lastAttemptAt: ts('2026-07-06T10:05:00Z'),
      },
      {
        customerId: CUST.thomas, customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
        score: 80, reachabilityScore: 78,
        aiRankingReason: 'Solid morning candidate on standby if Sophie declines the callback.',
        originalAppointmentId: A.thomasBooked,
        status: 'PENDING', retryCount: 0, callAttemptIds: [],
      },
    ],
    totalAttempts: 1, price: 120,
    createdAt: ts('2026-07-06T10:00:00Z'), updatedAt: ts('2026-07-06T10:10:00Z'),
  });

  await batch4.commit();
  console.log('✓ recoveryJobs');

  // ── Call Attempts ─────────────────────────────────────────────────────────
  const batch5 = db.batch();

  // job-success: Sophie accepted
  batch5.set(ref('callAttempts', 'ca-success-1'), {
    recoveryJobId: JOB.success, customerId: CUST.sophie,
    customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentId: A.cancelled1, fonioCallId: 'fonio-s1',
    status: 'COMPLETED', outcome: 'ACCEPTED', attemptNumber: 1,
    initiatedAt: ts('2026-07-01T08:02:00Z'), completedAt: ts('2026-07-01T08:04:30Z'), duration: 148,
    transcript: `Agent: Hello, may I please speak with Sophie Müller?\nCustomer: Yes, speaking. Who is this?\nAgent: Hi Sophie, this is Jericho Dental calling. I'm reaching out because we had a last-minute cancellation and a cleaning appointment on July 8th at 10 AM has just opened up. Since you're on our early-availability list, I wanted to offer it to you first. Would that work for you?\nCustomer: Oh, July 8th at ten? Yes, that actually works perfectly — I was hoping something would come up sooner.\nAgent: Wonderful! I'll go ahead and confirm that booking for you right now. You'll receive a reminder the day before.\nCustomer: Perfect, thank you so much. See you then!\nAgent: You're very welcome, Sophie. See you on the 8th. Have a great day!`,
  });

  // job-active: Elisabeth no-answer x2
  batch5.set(ref('callAttempts', 'ca-active-1'), {
    recoveryJobId: JOB.active, customerId: CUST.elisabeth,
    customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
    appointmentId: A.cancelled2, fonioCallId: 'fonio-a1',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 1,
    initiatedAt: ts('2026-07-05T11:10:00Z'), completedAt: ts('2026-07-05T11:11:00Z'), duration: 32,
    transcript: null,
  });
  batch5.set(ref('callAttempts', 'ca-active-2'), {
    recoveryJobId: JOB.active, customerId: CUST.elisabeth,
    customerName: 'Elisabeth Wagner', customerPhone: '+43 664 101 0007',
    appointmentId: A.cancelled2, fonioCallId: 'fonio-a2',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 2,
    initiatedAt: ts('2026-07-05T11:45:00Z'), completedAt: ts('2026-07-05T11:46:00Z'), duration: 28,
    transcript: null,
  });
  // job-active: Thomas currently in-progress
  batch5.set(ref('callAttempts', 'ca-active-3'), {
    recoveryJobId: JOB.active, customerId: CUST.thomas,
    customerName: 'Thomas Gruber', customerPhone: '+43 664 101 0004',
    appointmentId: A.cancelled2, fonioCallId: 'fonio-a3',
    status: 'IN_PROGRESS', attemptNumber: 3,
    initiatedAt: ts('2026-07-07T09:00:00Z'),
    transcript: null,
  });

  // job-failed: Klaus no-answer x2, Michael no-answer + voicemail
  batch5.set(ref('callAttempts', 'ca-failed-1'), {
    recoveryJobId: JOB.failed, customerId: CUST.klaus,
    customerName: 'Klaus Fischer', customerPhone: '+43 664 101 0006',
    appointmentId: A.cancelled3, fonioCallId: 'fonio-f1',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 1,
    initiatedAt: ts('2026-06-15T18:00:00Z'), completedAt: ts('2026-06-15T18:01:00Z'), duration: 30,
    transcript: null,
  });
  batch5.set(ref('callAttempts', 'ca-failed-2'), {
    recoveryJobId: JOB.failed, customerId: CUST.klaus,
    customerName: 'Klaus Fischer', customerPhone: '+43 664 101 0006',
    appointmentId: A.cancelled3, fonioCallId: 'fonio-f2',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 2,
    initiatedAt: ts('2026-06-15T18:30:00Z'), completedAt: ts('2026-06-15T18:31:00Z'), duration: 30,
    transcript: null,
  });
  batch5.set(ref('callAttempts', 'ca-failed-3'), {
    recoveryJobId: JOB.failed, customerId: CUST.michael,
    customerName: 'Michael Schwarz', customerPhone: '+43 664 101 0008',
    appointmentId: A.cancelled3, fonioCallId: 'fonio-f3',
    status: 'COMPLETED', outcome: 'VOICEMAIL', attemptNumber: 3,
    initiatedAt: ts('2026-06-16T10:00:00Z'), completedAt: ts('2026-06-16T10:02:00Z'), duration: 85,
    transcript: `Agent: Hello, this is Jericho Dental calling for Michael Schwarz. We have an earlier appointment slot available on June 20th at 11 AM for your professional cleaning. If you're interested please call us back at +43 1 234 5678. Thank you and have a great day!`,
  });
  batch5.set(ref('callAttempts', 'ca-failed-4'), {
    recoveryJobId: JOB.failed, customerId: CUST.michael,
    customerName: 'Michael Schwarz', customerPhone: '+43 664 101 0008',
    appointmentId: A.cancelled3, fonioCallId: 'fonio-f4',
    status: 'COMPLETED', outcome: 'NO_ANSWER', attemptNumber: 4,
    initiatedAt: ts('2026-06-16T11:00:00Z'), completedAt: ts('2026-06-16T11:01:00Z'), duration: 28,
    transcript: null,
  });

  // job-callback: Sophie requested callback
  batch5.set(ref('callAttempts', 'ca-callback-1'), {
    recoveryJobId: JOB.callback, customerId: CUST.sophie,
    customerName: 'Sophie Müller', customerPhone: '+43 664 101 0001',
    appointmentId: A.cancelled4, fonioCallId: 'fonio-c1',
    status: 'COMPLETED', outcome: 'CALLBACK_REQUESTED', attemptNumber: 1,
    initiatedAt: ts('2026-07-06T10:05:00Z'), completedAt: ts('2026-07-06T10:08:00Z'), duration: 112,
    callbackScheduledAt: ts('2026-07-07T14:00:00Z'),
    transcript: `Agent: Hi Sophie, this is Jericho Dental. We have a cleaning slot available on July 22nd at 2 PM. Would you like to take it?\nCustomer: Oh hi — July 22nd, let me think. Actually I can't talk right now, I'm in a meeting. Can you call me back this afternoon around two?\nAgent: Of course, no problem at all. I'll have someone call you back at 2 PM today. Thank you Sophie, speak soon!\nCustomer: Thanks, bye.`,
  });

  await batch5.commit();
  console.log('✓ callAttempts');

  // ── Contact History ───────────────────────────────────────────────────────
  const batch6 = db.batch();

  // Sophie accepted in job-success, callback in job-callback
  batch6.set(ref('customerContactHistory', 'ch-sophie-1'), {
    customerId: CUST.sophie, outcome: 'ACCEPTED',
    recoveryJobId: JOB.success, callAttemptId: 'ca-success-1',
    declineReason: null, customerResponse: 'Yes, July 8th at 10 works perfectly.',
    createdAt: ts('2026-07-01T08:05:00Z'),
  });
  batch6.set(ref('customerContactHistory', 'ch-sophie-2'), {
    customerId: CUST.sophie, outcome: 'CALLBACK_REQUESTED',
    recoveryJobId: JOB.callback, callAttemptId: 'ca-callback-1',
    declineReason: null, customerResponse: 'Can you call me back at 2 PM today?',
    createdAt: ts('2026-07-06T10:08:00Z'),
  });

  // Elisabeth: no-answer x2
  batch6.set(ref('customerContactHistory', 'ch-elisabeth-1'), {
    customerId: CUST.elisabeth, outcome: 'NO_ANSWER',
    recoveryJobId: JOB.active, callAttemptId: 'ca-active-1',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-07-05T11:11:00Z'),
  });
  batch6.set(ref('customerContactHistory', 'ch-elisabeth-2'), {
    customerId: CUST.elisabeth, outcome: 'NO_ANSWER',
    recoveryJobId: JOB.active, callAttemptId: 'ca-active-2',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-07-05T11:46:00Z'),
  });

  // Klaus: no-answer x2
  batch6.set(ref('customerContactHistory', 'ch-klaus-1'), {
    customerId: CUST.klaus, outcome: 'NO_ANSWER',
    recoveryJobId: JOB.failed, callAttemptId: 'ca-failed-1',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-06-15T18:01:00Z'),
  });
  batch6.set(ref('customerContactHistory', 'ch-klaus-2'), {
    customerId: CUST.klaus, outcome: 'NO_ANSWER',
    recoveryJobId: JOB.failed, callAttemptId: 'ca-failed-2',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-06-15T18:31:00Z'),
  });

  // Michael: voicemail + no-answer
  batch6.set(ref('customerContactHistory', 'ch-michael-1'), {
    customerId: CUST.michael, outcome: 'VOICEMAIL',
    recoveryJobId: JOB.failed, callAttemptId: 'ca-failed-3',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-06-16T10:02:00Z'),
  });
  batch6.set(ref('customerContactHistory', 'ch-michael-2'), {
    customerId: CUST.michael, outcome: 'NO_ANSWER',
    recoveryJobId: JOB.failed, callAttemptId: 'ca-failed-4',
    declineReason: null, customerResponse: null,
    createdAt: ts('2026-06-16T11:01:00Z'),
  });

  await batch6.commit();
  console.log('✓ customerContactHistory');

  console.log('\n✅ Seed complete!\n');
  console.log('Summary:');
  console.log('  2  locations');
  console.log('  8  appointment types');
  console.log(' 12  customers');
  console.log(' 25  appointments (4 cancelled, 1 recovered, 12 booked, 8 historical)');
  console.log('  5  waitlist entries');
  console.log('  4  recovery jobs (1 SUCCESS, 1 IN_PROGRESS, 1 FAILED, 1 CALLBACK_REQUESTED)');
  console.log('  9  call attempts (with transcripts where applicable)');
  console.log('  8  contact history entries');
  console.log('  1  settings doc');
}

main().catch((err) => { console.error(err); process.exit(1); });
