import { Effect } from "effect";
import type {
  NotificationChannel,
  NotificationEvent,
} from "../../layers/notification/types";

export abstract class AbstractNotificationChannel
  implements NotificationChannel
{
  type = "AbstractChannel";

  identifier = "abstract_channel";

  send(
    notification: NotificationEvent<unknown, unknown>,
  ): Effect.Effect<void, unknown, unknown> {
    return Effect.succeed(false);
  }
}
