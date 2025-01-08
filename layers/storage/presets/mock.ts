import { FileReference } from "../layer";
import type {
  Storage,
  UploadOptions,
  UploadResult,
  GetFileOptions,
  FileMetadata,
} from "../types";

export class StorageTest implements Storage {
  async uploadFile(
    file: File | Blob,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return {
      fileId: "MOCK_STORAGE_PUBLIC_ID",
      fileUrl: "MOCK_STORAGE_SECURE_URL",
      metadata: {},
    };
  }

  async getFile(fileId: string, options?: GetFileOptions) {
    // throw new Error("No implementation for getFile()");
    return new FileReference();
  }

  async deleteFile(fileId: string): Promise<void> {
    throw new Error("No implementation for getFile()");
  }

  async updateFileMetadata(
    fileId: string,
    metadata: FileMetadata,
  ): Promise<void> {}
}
