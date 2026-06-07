import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, DocumentSnapshot } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

if (getApps().length === 0) {
  const saPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json');
  if (!fs.existsSync(saPath)) {
    throw new Error(`service-account.json not found at ${saPath}. Download it from Firebase Console → Project Settings → Service Accounts.`);
  }
  admin.initializeApp({
    credential: admin.credential.cert(saPath),
  });
}

export const db = getFirestore();

// Typed collection references
export const col = {
  customers:              db.collection('customers'),
  appointments:           db.collection('appointments'),
  appointmentTypes:       db.collection('appointmentTypes'),
  locations:              db.collection('locations'),
  waitlist:               db.collection('waitlist'),
  recoveryJobs:           db.collection('recoveryJobs'),
  callAttempts:           db.collection('callAttempts'),
  contactHistory:         db.collection('customerContactHistory'),
  settings:               db.collection('settings'),
  personas:               db.collection('personas'),
};

export const now = () => Timestamp.now();

export const toIso = (value: unknown): string => {
  const getLocalIsoString = (date: Date): string => {
    const pad = (num: number) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
  };

  if (!value) return getLocalIsoString(new Date());
  if (value instanceof Timestamp) return getLocalIsoString(value.toDate());
  if (value instanceof Date) return getLocalIsoString(value);
  return String(value);
};

// Converts a Firestore doc snapshot to a plain object.
// timestampFields lists field names whose values should be converted to ISO strings.
export function docJson<T>(
  doc: DocumentSnapshot,
  timestampFields: string[] = []
): T {
  const data = doc.data() ?? {};
  const result: Record<string, unknown> = { id: doc.id };
  for (const [key, val] of Object.entries(data)) {
    result[key] = timestampFields.includes(key) ? toIso(val) : val;
  }
  return result as T;
}
