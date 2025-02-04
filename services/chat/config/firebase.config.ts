import { getFirestore } from "@firebase/firestore";
import { destr } from "destr";
import { pipe, Config, Effect, Redacted } from "effect";
import { type FirebaseOptions, initializeApp } from "firebase/app";

const firebaseConfig = pipe(
  Config.redacted("FIREBASE_CONFIG"),
  Effect.map((value) => {
    return destr(Redacted.value(value).replaceAll("\\", "")) as FirebaseOptions;
  }),
);

// Initialize Firebase
export const firebaseApp = pipe(
  firebaseConfig,
  Effect.map((config) => initializeApp(config)),
);

export const firestoreRef = pipe(
  firebaseApp,
  Effect.map((firebase_app) => getFirestore(firebase_app)),
);
