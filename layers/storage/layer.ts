import { Context, Effect } from "effect";
import { TaggedClass, TaggedError } from "effect/Data";
import type { FileReferenceInterface, Storage } from "./types";

export class FileStorage extends Context.Tag("FileStorage")<
  FileStorage,
  Storage
>() {}

export class StorageException extends TaggedError("StorageException") {
  constructor(
    public error: unknown,
    public message: string,
  ) {
    super();
  }
}

export class FileUploadException extends TaggedError("FileUploadException") {
  constructor(
    public error: unknown,
    public message: string,
  ) {
    super();
  }
}

export class FileDeletionException extends TaggedError(
  "FileDeletionException",
) {
  constructor(
    public error: unknown,
    public message: string,
  ) {
    super();
  }
}

export class FileReference
  extends TaggedClass("FileReference")
  implements FileReferenceInterface
{
  tags: string[];

  path(): string {
    throw new Error("Method not implemented.");
  }

  addTag(tags: string[]) {
    const combined = new Set(this.tags);

    for (const tag of tags) {
      combined.add(tag);
    }

    this.tags = Array.from(combined.keys());
  }

  removeTag(tags: string[]) {
    const combined = new Set(this.tags);

    for (const tag of tags) {
      combined.delete(tag);
    }

    this.tags = Array.from(combined.keys());
  }
}

export function saveResource(file: FileReferenceInterface) {
  return Effect.gen(function* () {
    const storage = yield* FileStorage;

    return yield* Effect.tryPromise({
      try: () => {
        return storage.updateFileMetadata(file.path(), {
          tags: file.tags,
        });
      },
      catch: (error) => {
        return new StorageException(error, "Error updating FileResource");
      },
    });
  });
}

export function deleteResource(file: FileReferenceInterface) {
  return Effect.gen(function* () {
    const storage = yield* FileStorage;

    yield* Effect.tryPromise({
      try: () => {
        return storage.deleteFile(file.path());
      },
      catch: (error) => {
        return new FileDeletionException(error, "Failed to remove old avatar");
      },
    });
  });
}
