import cloudinary from "cloudinary";
import { Config, Effect, pipe } from "effect";
import { FileUploadException } from "~/layers/storage/layer";
import { cloudinaryConfig } from "~/layers/storage/presets/cloudinary";

export const uploadToCloudinary = (data: string) => {
  return Effect.gen(function* () {
    const config = yield* cloudinaryConfig;
    const env = yield* Config.string("APP_ENV");
    const isProduction = env === "production";

    const setupCloudinary = pipe(
      cloudinaryConfig,
      Effect.map((config) => {
        return cloudinary.v2.config({
          cloud_name: config.cloudinaryCloudName,
          api_key: config.cloudinaryApiKey,
          api_secret: config.cloudinarySecretKey,
          secure: !isProduction,
          sign_url: false,
        });
      }),
    );

    yield* setupCloudinary;
    const canUploadImage = yield* Config.boolean("ENABLE_IMAGE_UPLOAD");

    if (!canUploadImage) {
      const response = yield* Effect.succeed("Skipping upload");
      return {
        secure_url: response,
      };
    }

    return yield* Effect.tryPromise({
      try: () => {
        return cloudinary.v2.uploader.upload(data, {
          resource_type: "auto",
          folder: config.cloudinaryFolder,
        });
      },
      catch: (error) => {
        return new FileUploadException(
          error,
          "Error Uploading Resource to Cloudinary",
        );
      },
    });
  });
};
