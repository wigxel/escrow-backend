import { Effect } from "effect";
import { toLower } from "ramda";
import { PermissionError } from "~/config/exceptions";
import { getSessionInfo } from "~/libs/session.helpers";
import { getOrderById } from "~/services/order.service";

/**
 * Get all buyer orders
 */
export default eventHandler(async (event) => {
  const orderId = getRouterParam(event, "orderId");

  const result = Effect.gen(function* () {
    const { user } = yield* getSessionInfo(event);
    const role = toLower(user.role);
    const rows = new Set(["buyer", "seller"]);

    if (!rows.has(role)) {
      yield* new PermissionError("Can't read orders. Invalid user");
    }

    return yield* getOrderById({
      orderId: orderId,
      userId: user.id,
      type: role,
    });
  });

  return runLive(event, result);
});
