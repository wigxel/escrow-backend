import { Effect } from "effect";
import { FileStorage } from "~/layers/storage/layer";
import { extractResourcePathFromUrl } from "~/layers/storage/presets/cloudinary";

export const ImageTags = {
  inUse: "in-use", // used in the database
  notInUse: "not-in-use", // not written to the backend
  markForDeletion: "marked-for-deletion", // delete from the database
} as const;

export function getResource(url: string) {
  return Effect.gen(function* (_) {
    const storage = yield* FileStorage;

    const path = extractResourcePathFromUrl(url);
    return yield* Effect.tryPromise(() => storage.getFile(path));
  });
}
