// import { DevTools } from "@effect/experimental";
import { Config, Effect, Layer } from "effect";
import { DatabaseLive } from "../layers/database";
import { NotificationRepoLayer } from "../repositories/notification.repo";
import { UserRepoLayer } from "../repositories/user.repository";
import { LogDebugLayer } from "./logger";
import { EscrowTransactionRepoLayer } from "../repositories/escrow/escrowTransaction.repo";
import { EscrowParticipantRepoLayer } from "../repositories/escrow/escrowParticipant.repo";
import { MailLive } from "../layers/mailing/mail";
import { NotificationLive } from "../layers/notification/layer";
import { Mailer } from "../layers/mailing";
import { NodeMailer } from "../services/mailing/node-mailer";
import { EscrowRequestRepoLayer } from "../repositories/escrow/escrowRequest.repo";
import { EscrowPaymentRepoLayer } from "../repositories/escrow/escrowPayment.repo";
import { PaystackGatewayLive } from "../layers/payment/adapters/paystackAdapter";
import { PaystackEventLive } from "../layers/payment/adapters/paystack-events";
import { TigerBeetleRepoLayer } from "../repositories/tigerbeetle/tigerbeetle.repo";
import { EscrowWalletRepoLayer } from "../repositories/escrow/escrowWallet.repo";
import { UserWalletRepoLayer } from "../repositories/userWallet.repo";
import { AccountStatementRepoLayer } from "../repositories/accountStatement.repo";
import { BankAccountRepoLayer } from "../repositories/accountNumber.repo";
import { BankAccountVerificationRepoLayer } from "../repositories/bankAccountVerification.repo";
import { WithdrawalRepoLayer } from "../repositories/withdrawal.repo";
import { ReviewRepoLive } from "../repositories/review.repository";
import { DisputeRepoLayer } from "../repositories/dispute.repo";
import { DisputeMembersRepoLayer } from "../repositories/disputeMember.repo";
import { ChatServiceLive } from "../services/chat/dispute";
import { ReferralSourcesRepoLayer } from "../repositories/referralSource.repo";
import { reversibleHashLive } from "../layers/encryption/presets/reversible-hasher";
import { OTPRepoLayer } from "../repositories/otp.repository";
import { UserSessionLive } from "../layers/session";
import { ActivityLogRepoLayer } from "../repositories/activityLog.repo";
import { DisputeCategorysRepoLayer } from "../repositories/disputeCategories.repo";
import { DisputeResolutionssRepoLayer } from "../repositories/disputeResolution.repo";
import { PushTokenRepoLayer } from "../repositories/pushToken.repo";
import { PushServiceLive } from "../services/pushNotification/push";
import { CloudinaryStorageLive } from "../layers/storage/presets/cloudinary";
import { LuciaSessionProvider } from "../services/lucia-session-provider";
import { Argon2dHasherLive } from "../layers/encryption/presets/argon2d";
import { CommentRepoLayer } from "../repositories/comment.repo";

export const UserModule = Layer.empty.pipe(
  Layer.provideMerge(UserRepoLayer.Repo.Live),
  Layer.provideMerge(UserWalletRepoLayer.live),
  Layer.provideMerge(BankAccountRepoLayer.live),
  Layer.provideMerge(BankAccountVerificationRepoLayer.live),
  Layer.provideMerge(WithdrawalRepoLayer.live),
  Layer.provideMerge(ReviewRepoLive),
  Layer.provideMerge(CommentRepoLayer.live),
  Layer.provideMerge(ReferralSourcesRepoLayer.Repo.Live),
  Layer.provideMerge(PushTokenRepoLayer.live),
);

const DisputeModule = Layer.empty.pipe(
  Layer.provideMerge(DisputeRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeMembersRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeCategorysRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeResolutionssRepoLayer.Repo.Live),
  Layer.provideMerge(ChatServiceLive),
);

export const EscrowModule = Layer.empty.pipe(
  Layer.provideMerge(EscrowTransactionRepoLayer.live),
  Layer.provideMerge(EscrowParticipantRepoLayer.live),
  Layer.provideMerge(EscrowRequestRepoLayer.live),
  Layer.provideMerge(EscrowPaymentRepoLayer.live),
  Layer.provideMerge(EscrowWalletRepoLayer.live),
);

const MailerLive = Layer.effect(
  Mailer,
  Effect.gen(function* (_) {
    const app_env = yield* Config.string("APP_ENV");
    return new NodeMailer();
  }),
);

export const AuthLive = Layer.empty.pipe(
  Layer.provideMerge(OTPRepoLayer),
  Layer.provideMerge(UserSessionLive),
  Layer.provideMerge(LuciaSessionProvider),
  Layer.provideMerge(Argon2dHasherLive),
);

export const MailingModule = Layer.empty.pipe(
  Layer.provideMerge(NotificationLive),
  Layer.provideMerge(MailLive),
  Layer.provideMerge(MailerLive),
);

export const AppLive = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(LogDebugLayer),
  Layer.provideMerge(MailingModule),
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(NotificationRepoLayer.Repo.Live),
  Layer.provideMerge(UserModule),
  Layer.provideMerge(EscrowModule),
  Layer.provideMerge(DisputeModule),
  Layer.provideMerge(PaystackGatewayLive),
  Layer.provideMerge(PaystackEventLive),
  Layer.provideMerge(TigerBeetleRepoLayer.Repo.Live),
  Layer.provideMerge(AccountStatementRepoLayer.live),
  Layer.provideMerge(reversibleHashLive),
  Layer.provideMerge(ActivityLogRepoLayer.live),
  Layer.provideMerge(PushServiceLive),
  Layer.provideMerge(CloudinaryStorageLive),
);
