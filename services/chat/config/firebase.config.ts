import { getFirestore } from "@firebase/firestore";
import { destr } from "destr";
import { pipe, Config, Effect, Redacted } from "effect";
import { type FirebaseOptions, initializeApp } from "firebase/app";
import admin from "firebase-admin";
import fbAdminConfigFile from "~/utils/fbadminSDKConfig.json";

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

let fbAdminSetup: admin.app.App = null;
export const fbAdminSDK = Effect.suspend(() =>
  Effect.succeed(fbAdminConfigFile).pipe(
    Effect.map((value) => value as admin.ServiceAccount),
    Effect.map((fbAdminSDKConfig) => {
      if (fbAdminSetup) return fbAdminSetup;
      fbAdminSetup = admin.initializeApp({
        credential: admin.credential.cert(fbAdminSDKConfig),
      });
      return fbAdminSetup;
    }),
  ),
);


export type TFbAdminSDK = admin.app.App;
