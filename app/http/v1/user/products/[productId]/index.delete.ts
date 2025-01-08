import { Effect } from "effect";
import { getSessionInfo } from "~/libs/session.helpers";
import { deleteProduct } from "~/services/product.service";

export default eventHandler(async (event) => {
  const product_id = getRouterParam(event, "productId");
  const program = getSessionInfo(event).pipe(
    Effect.flatMap(({ user }) =>
      deleteProduct({
        productId: product_id,
        currentUserId: user.id,
      }),
    ),
  );

  return runLive(event, program);
});
