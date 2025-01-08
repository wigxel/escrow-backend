import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { getProductDetails } from "~/services/product.service";

export default eventHandler((event) => {
  const product_id = getRouterParam(event, "productId");
  const program = Effect.gen(function* (_) {
    const { user } = yield* getSessionInfo(event);
    return yield* getProductDetails(product_id, user.id);
  });

  return runLive(event, program);
});
