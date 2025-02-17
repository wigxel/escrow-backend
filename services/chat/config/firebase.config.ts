import { pipe, Effect } from "effect";
import admin from "firebase-admin";
import fbAdminConfigFile from "~/utils/fbadminSDKConfig.json";

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

export const firestoreRef = pipe(
  fbAdminSDK,
  Effect.map((admin) => admin.firestore()),
);

export type TFbAdminSDK = admin.app.App;
