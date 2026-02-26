import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

function ensureInitialized() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID');
  }

  try {
    initializeApp({ credential: applicationDefault(), projectId });
  } catch {
    initializeApp({ projectId });
  }
}

export async function verifyIdToken(token: string) {
  ensureInitialized();
  return getAuth().verifyIdToken(token);
}
