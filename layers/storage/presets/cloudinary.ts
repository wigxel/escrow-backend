import { v2 as cloudinary, type ResourceApiResponse } from "cloudinary";
import { Config, Effect, Layer, pipe } from "effect";
import { FileStorage, FileReference } from "../layer";
import type {
  Storage,
  UploadOptions,
  UploadResult,
  GetFileOptions,
  FileMetadata,
} from "../types";
import { arrayBufferToBase64 } from "../../../services/otp/otp.util";
import { NoSuchElementException } from "effect/Cause";
import { safeArray } from "../../../libs/data.helpers";

export const cloudinaryConfig = Effect.gen(function* () {
  const cloudinarySecretKey = yield* Config.string("CLOUDINARY_SECRET_KEY");
  const cloudinaryApiKey = yield* Config.string("CLOUDINARY_API_KEY");
  const cloudinaryCloudName = yield* Config.string("CLOUDINARY_CLOUD_NAME");

  return {
    cloudinarySecretKey,
    cloudinaryApiKey,
    cloudinaryCloudName,
  };
});

export const CloudinaryStorageLive = Layer.effect(
  FileStorage,
  pipe(
    cloudinaryConfig,
    Effect.map((e) => {
      return new CloudinarySDK({
        credentials: {
          apiKey: e.cloudinaryApiKey,
          apiSecret: e.cloudinarySecretKey,
          cloudName: e.cloudinaryCloudName,
        },
      });
    }),
  ),
);

class CloudinarySDK implements Storage {
  constructor(private config: CloudStorageConfig) {
    cloudinary.config({
      api_key: config.credentials.apiKey,
      cloud_name: config.credentials.cloudName,
      api_secret: config.credentials.apiSecret,
    });
  }

  async uploadFile(
    file: File | Blob,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    const buffer = await file.arrayBuffer();
    const base64Image = `data:${options.mimeType};base64,${arrayBufferToBase64(buffer)}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image" as const,
      tags: options?.tags || [],
      metadata: options?.metadata || {},
      folder: options.folder,
    });

    return {
      fileId: uploadResult.public_id,
      fileUrl: uploadResult.secure_url,
      metadata: uploadResult.metadata,
    };
  }

  async getFile(fileId: string, options?: GetFileOptions) {
    const config = {
      tags: true,
    };

    const res = await cloudinary.api.resources_by_ids([fileId], config);
    const [file] = res.resources;

    if (!file?.public_id) {
      throw new NoSuchElementException("File not found");
    }

    return new CloudinaryFR(fileId, file);
  }

  async deleteFile(fileId: string): Promise<void> {
    await cloudinary.api.delete_resources([fileId], {
      type: "upload",
      invalidate: true,
      resource_type: "image",
    });
  }

  async updateFileMetadata(
    fileId: string,
    metadata: FileMetadata,
  ): Promise<void> {
    await cloudinary.api.update(fileId, {
      resource_type: "image",
      type: "upload",
      tags: metadata.tags,
    });
  }
}

/**
 * extracts the publicId of the assest
 * @param url
 * @returns
 */
export function extractResourcePathFromUrl(url: string): string | null {
  const regex = /\/v\d+\/(.+?)\./;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export class CloudinaryFR extends FileReference {
  tags: string[] = [];

  constructor(
    public id: string,
    public value: ResourceRecord,
  ) {
    super();
    this.tags = safeArray(this.value?.tags);
  }

  path() {
    return this.value.public_id;
  }
}

export default CloudinarySDK;

type CloudStorageConfig = {
  credentials: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
};

export type ResourceRecord = ResourceApiResponse["resources"][0];
