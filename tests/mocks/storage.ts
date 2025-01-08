import { Layer } from "effect";
import { FileStorage } from "~/layers/storage/layer";
import { StorageTest } from "~/layers/storage/presets/mock";
import { extendMockImplementation } from "./helpers";

export const extendStorageTest = extendMockImplementation(
  FileStorage,
  () => new StorageTest(),
);

export const FileStorageTest = Layer.succeed(FileStorage, new StorageTest());
