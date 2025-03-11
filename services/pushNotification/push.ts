import { Context, Effect, Layer, pipe } from "effect";
import { fbAdminSDK, type TFbAdminSDK } from "../chat/config/firebase.config";

export class FirebasePushNotification
  implements FirebasePushNotificationInterface
{
  constructor(public readonly fbAdminSDK: TFbAdminSDK) {}

  async send(notification: IFcmMessage) {
    this.fbAdminSDK.messaging().send(notification);
  }
}

export const PushServiceLive = pipe(
  fbAdminSDK,
  Effect.map((ref) => {
    return Layer.succeed(PushService, new FirebasePushNotification(ref));
  }),
  Layer.unwrapScoped,
);

export class PushService extends Context.Tag("PushService")<
  PushService,
  FirebasePushNotificationInterface
>() {}

export interface FirebasePushNotificationInterface {
  send(notification: IFcmMessage);
}

export type TPushNotification = {
  title: string;
  body: string;
};

// firebase cloud message (FCM)
export interface IFcmMessage {
  token: string;
  notification: TPushNotification;
}
