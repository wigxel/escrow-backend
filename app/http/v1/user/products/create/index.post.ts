import { Effect } from "effect";
import { createProductSchema } from "~/dto/product.dto";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { createProduct } from "~/services/product.service";

export default eventHandler(async (event) => {
  const program = Effect.gen(function* () {
    const data = yield* validateBody(event, createProductSchema);
    const { user } = yield* getSessionInfo(event);

    return yield* createProduct({
      ownerId: user.id,
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      description: data.description,
      locationId: data.locationId,
    });
  });

  return runLive(event, program);
});
