// import { DevTools } from "@effect/experimental";
import { Config, Effect, Layer } from "effect";
import { AuthLive } from "~/layers/auth-user";
import { DatabaseLive } from "~/layers/database";
import { NotificationRepoLayer } from "~/repositories/notification.repo";
import { UserRepoLayer } from "~/repositories/user.repository";
import { UserLocationRepoLive } from "~/repositories/userLocation.repo";
import { LogDebugLayer } from "./logger";
import { EscrowTransactionRepoLayer} from "~/repositories/transaction/escrowTransaction.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/transaction/escrowParticipant.repo";
import { MailLive } from "~/layers/mailing/mail";
import { NotificationLive } from "~/layers/notification/layer";
import { SESMailer } from "~/services/mailing/aws-ses";
import { Mailer } from "~/layers/mailing";
import { NodeMailer } from "~/services/mailing/node-mailer";
import { EscrowRequestRepoLayer } from "~/repositories/transaction/escrowRequest.repo";
import { EscrowPaymentRepoLayer } from "~/repositories/transaction/escrowPayment.repo";
import { PaystackCheckoutLive } from "~/layers/payment/adapters/paystack";

export const UserModule = Layer.empty.pipe(
  Layer.provideMerge(UserLocationRepoLive),
  Layer.provideMerge(UserRepoLayer.Repo.Live),
);

export const EscrowModule = Layer.empty.pipe(
  Layer.provideMerge(EscrowTransactionRepoLayer.live),
  Layer.provideMerge(EscrowParticipantRepoLayer.live),
  Layer.provideMerge(EscrowRequestRepoLayer.live),
  Layer.provideMerge(EscrowPaymentRepoLayer.live)
  
)

const MailerLive = Layer.effect(
  Mailer,
  Effect.gen(function* (_) {
    const app_env = yield* Config.string("APP_ENV");
    return new NodeMailer();
  }),
);

export const MailingModule = Layer.empty.pipe(
  Layer.provideMerge(NotificationLive),
  Layer.provideMerge(MailLive),
  Layer.provideMerge(MailerLive),
);

export const AppLive = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(LogDebugLayer),
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(MailingModule),
  Layer.provideMerge(NotificationRepoLayer.Repo.Live),
  Layer.provideMerge(UserModule),
  Layer.provideMerge(EscrowModule),
  Layer.provideMerge(PaystackCheckoutLive)
);

// const DevToolsLive = DevTools.layerWebSocket().pipe(
//   Layer.provide(NodeSocket.layerWebSocketConstructor),
// );
