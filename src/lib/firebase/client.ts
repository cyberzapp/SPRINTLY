"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { firebaseConfig, firebaseEnv } from "./config";
import { initAppCheck } from "./app-check";

/**
 * Lazily-initialized singletons for the browser. Import these helpers from
 * services/hooks only — never from Server Components.
 */
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (typeof window !== "undefined") initAppCheck(app);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    connectEmulators();
  }
  return auth;
}

export function getDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    try {
      // Offline persistence keeps the UI responsive during reconnects and
      // reduces reads across tabs.
      db = initializeFirestore(firebaseApp, {
        localCache:
          typeof window !== "undefined"
            ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
            : undefined,
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(firebaseApp);
    }
    connectEmulators();
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    connectEmulators();
  }
  return storage;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), firebaseEnv.functionsRegion);
    connectEmulators();
  }
  return functions;
}

function connectEmulators() {
  if (!firebaseEnv.useEmulators || emulatorsConnected) return;
  // Ensure every service exists before connecting so each is wired exactly once.
  const host = firebaseEnv.emulatorHost;
  emulatorsConnected = true;
  const a = auth ?? getAuth(getFirebaseApp());
  auth = a;
  connectAuthEmulator(a, `http://${host}:9099`, { disableWarnings: true });
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      localCache:
        typeof window !== "undefined"
          ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
          : undefined,
      ignoreUndefinedProperties: true,
    });
  }
  connectFirestoreEmulator(db, host, 8080);
  storage = storage ?? getStorage(getFirebaseApp());
  connectStorageEmulator(storage, host, 9199);
  functions = functions ?? getFunctions(getFirebaseApp(), firebaseEnv.functionsRegion);
  connectFunctionsEmulator(functions, host, 5001);
}
