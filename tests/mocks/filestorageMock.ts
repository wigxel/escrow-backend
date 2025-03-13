import { Context, Layer } from "effect";
import type { Storage } from "../../layers/storage/types";
import { extendMockImplementation } from "./helpers";

class mock implements Storage {
  getFile(fileId: string, options?) {
    return Promise.resolve({
      path() {
        return "";
      },
      addTag(tags) {
        return;
      },
      removeTag(tags) {
        return;
      },
      tags: [""],
    });
  }

  deleteFile(fileId) {
    return Promise.resolve();
  }

  uploadFile(file, options?) {
    return Promise.resolve({ fileId: "", fileUrl: "", metadata: {} });
  }

  updateFileMetadata(fileId, metadata) {
    return Promise.resolve();
  }
}

export class FileStorage extends Context.Tag("FileStorage")<
  FileStorage,
  Storage
>() {}

export const FileStorageTestLive = Layer.succeed(FileStorage, new mock());

export const extendFileStorageTest = extendMockImplementation(
  FileStorage,
  () => new mock(),
);
