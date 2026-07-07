import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

// ─── Environment credentials ───────────────────────────────────────────────
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey:            metaEnv.VITE_FIREBASE_API_KEY,
  authDomain:        metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         metaEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             metaEnv.VITE_FIREBASE_APP_ID
};

const hasCredentials = !!(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('PASTE_') &&
  !firebaseConfig.apiKey.includes('your-firebase') &&
  firebaseConfig.apiKey.length > 20
);

let app: any = null;
let auth: any = null;
let db: any = null;
let isRealFirebase = false;

if (hasCredentials) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
    isRealFirebase = true;
    console.log('✦ Firebase initialized with real credentials.');
  } catch (error) {
    console.warn('⚠️ Firebase init failed — switching to Local Sandbox Mode:', error);
  }
} else {
  console.log('✦ No Firebase credentials — running in Local Sandbox Mode.');
}

// ─── Firebase error codes that mean "Auth service not set up yet" ───────────
// When these occur we silently fall back to sandbox so the app still works.
const AUTH_CONFIG_ERRORS = [
  'auth/configuration-not-found',
  'auth/project-not-found',
  'auth/invalid-api-key',
  'auth/api-key-not-valid',
  'auth/app-deleted',
  'auth/internal-error',
];

function isFirebaseConfigError(code: string): boolean {
  return AUTH_CONFIG_ERRORS.some(e => code?.includes(e));
}

// ─── LocalStorage Sandbox helpers ───────────────────────────────────────────
const getLocalUsers = (): any[] => {
  const data = localStorage.getItem('sjce_mock_firebase_users');
  return data ? JSON.parse(data) : [];
};

const saveLocalUser = (user: any) => {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem('sjce_mock_firebase_users', JSON.stringify(users));
};

// ─── App version guard: clear stale sessions from old demo builds ─────────
const APP_VERSION = 'v2.1-real';
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('sjce_app_version');
  if (stored !== APP_VERSION) {
    [
      'sjce_auth_session_lecturer',
      'sjce_auth_session_admin',
      'sjce_auth_session_student',
      'sjce_mock_firebase_users',
      'local_pending_attendance',
    ].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('sjce_app_version', APP_VERSION);
    console.log('✦ Session cache cleared (version update). Please sign in again.');
  }
}

// ─── Exported Auth API ───────────────────────────────────────────────────────
export const firebaseAuth = {
  isReal: () => isRealFirebase,

  /**
   * Sign In — tries real Firebase first, falls back to sandbox on any
   * configuration error so the app never hard-crashes.
   */
  signIn: async (
    emailOrUsn: string,
    pin: string,
    role: 'lecturer' | 'student' | 'admin'
  ): Promise<{ codeOrUsn: string; name: string }> => {
    const lookup = emailOrUsn.trim().toLowerCase();

    if (isRealFirebase && auth) {
      const realEmail = lookup.includes('@') ? lookup : `${lookup}@sjce.edu`;
      try {
        const userCred = await signInWithEmailAndPassword(auth, realEmail, pin);
        // Try to load a richer display name from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', userCred.user.uid));
          if (snap.exists()) {
            const d = snap.data();
            return { codeOrUsn: emailOrUsn.trim(), name: d.name || 'User' };
          }
        } catch (_) { /* Firestore read failed — use Auth displayName */ }
        return {
          codeOrUsn: emailOrUsn.trim(),
          name: userCred.user.displayName || emailOrUsn.trim().split('@')[0]
        };
      } catch (err: any) {
        const code: string = err?.code || '';
        if (isFirebaseConfigError(code)) {
          // Firebase Auth not configured — silently fall through to sandbox
          console.warn(
            `⚠️ Firebase Auth not enabled (${code}).\n` +
            `→ Go to: Firebase Console → Authentication → Sign-in method → Enable Email/Password.\n` +
            `→ Falling back to LocalStorage Sandbox Mode for this session.`
          );
          isRealFirebase = false;
          // Fall through to sandbox below
        } else {
          // Genuine auth failure (wrong password, user not found, etc.)
          const msg = err?.message || 'Sign-in failed.';
          
          if (
            code === 'auth/invalid-credential' ||
            code === 'auth/user-not-found' ||
            msg.includes('user-not-found') ||
            msg.includes('INVALID_LOGIN_CREDENTIALS') ||
            msg.includes('invalid-credential')
          ) {
            throw new Error('Incorrect passcode or no account found. If you are a new user, please click the "Sign Up (New User)" tab to register first.');
          }
          if (code === 'auth/wrong-password' || msg.includes('wrong-password')) {
            throw new Error('Incorrect passcode. Please try again.');
          }
          if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
            throw new Error('Too many failed attempts. Please wait a moment and try again.');
          }
          if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
            throw new Error('Invalid email or identifier format.');
          }
          throw new Error(msg);
        }
      }
    }

    // ── Sandbox fallback ──
    const users = getLocalUsers();
    const matched = users.find(
      u => u.emailOrUsn.toLowerCase() === lookup && u.pin === pin && u.role === role
    );
    if (matched) return { codeOrUsn: matched.emailOrUsn, name: matched.name };

    throw new Error('No account found. Please sign up first or check your credentials.');
  },

  /**
   * Sign Up — registers with Firebase Auth + writes Firestore profile.
   * Falls back to sandbox on configuration errors.
   */
  signUp: async (
    emailOrUsn: string,
    pin: string,
    name: string,
    role: 'lecturer' | 'student'
  ): Promise<{ codeOrUsn: string; name: string }> => {
    const clean  = emailOrUsn.trim();
    const lookup = clean.toLowerCase();

    if (isRealFirebase && auth) {
      const realEmail = lookup.includes('@') ? lookup : `${lookup}@sjce.edu`;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, realEmail, pin);
        // Persist profile to Firestore
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid:         userCred.user.uid,
            emailOrUsn:  clean,
            name,
            role,
            createdAt:   new Date().toISOString()
          });
        } catch (_) { /* Firestore write failed — continue anyway */ }
        return { codeOrUsn: clean, name };
      } catch (err: any) {
        const code: string = err?.code || '';
        if (isFirebaseConfigError(code)) {
          console.warn(
            `⚠️ Firebase Auth not enabled (${code}).\n` +
            `→ Go to: Firebase Console → Authentication → Sign-in method → Enable Email/Password.\n` +
            `→ Falling back to LocalStorage Sandbox Mode for this session.`
          );
          isRealFirebase = false;
          // Fall through to sandbox below
        } else {
          const msg = err?.message || 'Registration failed.';
          if (
            code === 'auth/email-already-in-use' ||
            msg.includes('email-already-in-use')
          ) {
            throw new Error('An account with this email/USN already exists. Please sign in instead.');
          }
          if (
            code === 'auth/weak-password' ||
            msg.includes('weak-password')
          ) {
            throw new Error('Password is too weak. Use at least 6 characters.');
          }
          if (
            code === 'auth/invalid-email' ||
            msg.includes('invalid-email')
          ) {
            throw new Error('Invalid email or USN format.');
          }
          throw new Error(msg);
        }
      }
    }

    // ── Sandbox fallback ──
    const users = getLocalUsers();
    if (users.some(u => u.emailOrUsn.toLowerCase() === lookup)) {
      throw new Error('An account with this email/USN already exists. Please sign in.');
    }
    const newUser = { emailOrUsn: clean, pin, name, role };
    saveLocalUser(newUser);

    // Also register student in the server roster DB
    if (role === 'student') {
      try {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usn:            clean.toUpperCase(),
            name,
            attendanceRate: 100,
            courseCode:     'CSE',
            section:        'A',
            year:           1,
            avatarUrl:      ''
          })
        });
      } catch (e) {
        console.warn('Student roster registration failed:', e);
      }
    }
    return { codeOrUsn: clean, name };
  },

  signOut: async () => {
    if (isRealFirebase && auth) {
      try { await fbSignOut(auth); } catch (_) {}
    }
    localStorage.removeItem('sjce_auth_session_lecturer');
    localStorage.removeItem('sjce_auth_session_admin');
    localStorage.removeItem('sjce_auth_session_student');
  }
};
