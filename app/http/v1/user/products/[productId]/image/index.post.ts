import { Effect, pipe } from "effect";
import { imageUrlDto } from "~/dto/product.dto";
import { saveResource } from "~/layers/storage/layer";
import { CloudinaryStorage } from "~/layers/storage/presets/cloudinary";
import { validateBody } from "~/libs/request.helpers";
import { getSessionInfo } from "~/libs/session.helpers";
import { uploadProductImage } from "~/services/product.service";
import { getResource, ImageTags } from "~/services/storage.service";

export default eventHandler(async (event) => {
  const product_id = getRouterParam(event, "productId");

  const updateTags = (url: string) =>
    Effect.gen(function* () {
      yield* Effect.logDebug("Adding tags to images");
      const resource = yield* getResource(url);
      resource.addTag([ImageTags.inUse]);
      resource.removeTag([ImageTags.notInUse]);
      yield* saveResource(resource);
    });

  const program = Effect.gen(function* () {
    const data = yield* validateBody(event, imageUrlDto);
    const { user } = yield* getSessionInfo(event);

    const response = yield* uploadProductImage({
      productId: product_id,
      currentUserId: user.id,
      imageUrl: data.imageUrl,
    });

    const updates = data.imageUrl.map(updateTags);
    yield* Effect.all(updates, { concurrency: 5 });

    return response;
  });

  return runLive(event, program.pipe(Effect.provide(CloudinaryStorage)));
});
