import { Effect } from "effect";
import type { User } from "~/migrations/schema";
import { UserRepo, UserRepoLayer } from "~/repositories/user.repository";
import {
  deleteResource,
  FileStorage,
  FileUploadException,
} from "~/layers/storage/layer";
import { getResource } from "./storage.service";
import { dataResponse } from "~/libs/response";

export const getProfile = (userId: string) => {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepoLayer.Tag;
    const profile = yield* userRepo.firstOrThrow({ id: userId });
    const { password, ...rest } = profile;
    return dataResponse({ data: rest });
  });
};

export const editProfile = (userId: string, profileUpdate: Partial<User>) => {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepoLayer.Tag;
    const [user] = yield* userRepo.update(userId, profileUpdate);
    return dataResponse({ message: "Profile edited successfully" });
  });
};

export const uploadAvatarImage = (userId: string, image: File | Blob) => {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepo;
    const resourceManager = yield* FileStorage;

    const user = yield* userRepo.find(userId);
    const last_image_url = user.profilePicture;

    yield* Effect.logDebug("Upload new image");
    const { fileUrl } = yield* Effect.tryPromise({
      try: () => {
        return resourceManager.uploadFile(image, {
          mimeType: image.type,
          fileName: image instanceof File ? image.name : undefined,
          folder: "profile",
          tags: ["avatar", `user:${user.id}`],
        });
      },
      catch: (err) => {
        return new FileUploadException(err, "Error saving file");
      },
    });

    yield* Effect.logDebug("Update database record");
    yield* userRepo.update(userId, { profilePicture: fileUrl });

    // delete the last image avatar of the user
    if (last_image_url) {
      yield* Effect.logDebug("Delete old image");
      const resource = yield* getResource(last_image_url);
      yield* deleteResource(resource);
    }

    return dataResponse({ data: { fileUrl } });
  });
};
