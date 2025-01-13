// import { DevTools } from "@effect/experimental";
import { Config, Effect, Layer } from "effect";
import { AuthLive } from "~/layers/auth-user";
import { DatabaseLive } from "~/layers/database";
import { NotificationRepoLayer } from "~/repositories/notification.repo";
import { UserRepoLayer } from "~/repositories/user.repository";
import { UserLocationRepoLive } from "~/repositories/userLocation.repo";
import { LogDebugLayer } from "./logger";
import { TransactionRepoLayer} from "~/repositories/transaction.repo";
import { TransactionParticipantRepoLayer } from "~/repositories/transactionParticipant.repo";

export const UserModule = Layer.empty.pipe(
  Layer.provideMerge(UserLocationRepoLive),
  Layer.provideMerge(UserRepoLayer.Repo.Live),
);

export const TransactionModule = Layer.empty.pipe(
  Layer.provideMerge(TransactionRepoLayer.live),
  Layer.provideMerge(TransactionParticipantRepoLayer.live)
)

export const AppLive = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(LogDebugLayer),
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(NotificationRepoLayer.Repo.Live),
  Layer.provideMerge(UserModule),
  Layer.provideMerge(TransactionModule)
);

// const DevToolsLive = DevTools.layerWebSocket().pipe(
//   Layer.provide(NodeSocket.layerWebSocketConstructor),
// );
