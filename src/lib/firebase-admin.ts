import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let _app: App | null = null;

function getAdminApp(): App {
  if (!_app) {
    if (getApps().length > 0) {
      _app = getApps()[0];
    } else {
      _app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
        }),
      });
    }
  }
  return _app;
}

export async function verifyIdToken(token: string) {
  const app = getAdminApp();
  const auth = getAuth(app);
  return auth.verifyIdToken(token);
}
