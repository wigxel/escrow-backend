import { Effect, pipe } from "effect";
import { imageDeleteUrlDto } from "~/dto/product.dto";
import { CloudinaryStorage } from "~/layers/storage/presets/cloudinary";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { deleteProductImages } from "~/services/product.service";

export default eventHandler(async (event) => {
  const product_id = getRouterParam(event, "productId");

  const program = Effect.gen(function* () {
    const data = yield* validateBody(event, imageDeleteUrlDto);
    const { user } = yield* getSessionInfo(event);

    yield* deleteProductImages({
      productId: product_id,
      imagesId: data.imageId,
      currentUserId: user.id,
    });

    return { status: true, message: "Images deleted succesfully" };
  });

  return pipe(program, Effect.provide(CloudinaryStorage), (program) =>
    runLive(event, program),
  );
});
