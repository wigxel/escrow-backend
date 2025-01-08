import { Effect } from "effect";
import { editProductDto } from "~/dto/product.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { editProduct } from "~/services/product.service";

export default eventHandler(async (event) => {
  const productId = getRouterParam(event, "productId");

  const program = Effect.gen(function* () {
    const data = yield* validateBody(event, editProductDto);
    const session = yield* getSessionInfo(event);

    return yield* editProduct(session.user.id, productId, {
      ...data,
      price: "price" in data ? String(data.price) : undefined,
    });
  });

  return runLive(event, program);
});
