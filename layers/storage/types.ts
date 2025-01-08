export interface Storage {
  /**  Upload a file to the cloud storage*/
  uploadFile(
    file: File | Blob | Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult>;

  /** Get a file from the cloud storage */
  getFile(
    fileId: string,
    options?: GetFileOptions,
  ): Promise<FileReferenceInterface>;

  /**
   * Delete a file from the cloud storage
   *
   * @params {fileId} The path to the resource
   */
  deleteFile(fileId: string): Promise<void>;

  /** Update file metadata */
  updateFileMetadata(fileId: string, metadata: FileMetadata): Promise<void>;
}

export interface UploadOptions {
  // File name
  fileName?: string;

  // File type (MIME type)
  mimeType?: string;

  /**The path to the folder the file should be stored in **/
  folder?: string;

  // File tags
  tags?: string[];

  // File metadata
  metadata?: FileMetadata;
}

export interface UploadResult {
  // File ID
  fileId: string;

  // File URL
  fileUrl: string;

  // File metadata
  metadata: FileMetadata | object;
}

export interface GetFileOptions {
  // File type (e.g., image, video, audio)
  fileType?: string;

  // File size (e.g., thumbnail)
  fileSize?: string;
}

export interface FileMetadata {
  // File tags
  tags: string[];
}

export interface FileReferenceInterface {
  path(): string;
  tags: string[];
  addTag(tags: string[]): void;
  removeTag(tags: string[]): void;
}
