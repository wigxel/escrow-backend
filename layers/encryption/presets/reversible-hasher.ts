import crypto from "node:crypto";
import { Effect, Layer } from "effect";
import { HashingError, ReversibleHash } from "../reversible";

export class AESAlgo {
  /**
   * The encryption key, generated from a salt value.
   */
  private key: Buffer;
  private iv: Buffer;

  /**
   * Constructor that takes a salt value as an argument. This salt value is used to generate the encryption key.
   * @param {string} salt
   * @param {string} hash_hex
   */
  constructor(salt: string, buffer_hash: string) {
    this.key = crypto.createHash("sha256").update(salt).digest();
    this.iv = Buffer.from(buffer_hash, "hex"); // Initialisation Vector (IV)
  }

  /**
   * Encrypts a given message using AES-256-CBC encryption algorithm. The message is broken into chunks and each chunk
   * is encrypted separately before being concatenated together to form the final encrypted string.
   * @param {string} _message
   */
  encrypt(_message: string) {
    // Set the plaintext message to encrypt
    let message = _message;

    // Create a cipher instance with the encryption options
    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, this.iv);

    // Encrypt the message
    let encrypted = "";
    while (message.length > 0) {
      const chunk = message.slice(0, 32);
      encrypted += cipher.update(chunk, "utf8", "hex");
      message = message.slice(32);
    }

    // Finalize the encryption by adding any remaining data
    encrypted += cipher.final("hex");

    return encrypted;
  }

  /**
   * Decrypts an encrypted message using AES-256-CBC decryption algorithm. The decryption process is the reverse of
   * the encryption process, where each chunk of the ciphertext is decrypted separately before being concatenated
   * together to form the original plaintext message.
   * @param {string} encrypted_message
   */
  decrypt(encrypted_message: string) {
    // Set the plaintext message to encrypt
    let encryptedMessage = encrypted_message;

    // Create a cipher instance with the encryption options
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, this.iv);

    let decrypted = "";
    while (encryptedMessage.length > 0) {
      const chunk = encryptedMessage.slice(0, 32);
      decrypted += decipher.update(chunk, "hex", "utf8");
      encryptedMessage = encryptedMessage.slice(32);
    }

    // Finalize the decryption by adding any remaining data
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

export function createReversibleHash({
  salt,
  hex,
}: { salt: string; hex: string }) {
  const hasher = new AESAlgo(salt, hex);
  return Layer.succeed(ReversibleHash, {
    encrypt: (value) =>
      Effect.try({
        try: () => hasher.encrypt(value),
        catch() {
          return new HashingError("Error encrypting content");
        },
      }),
    decrypt: (value) =>
      Effect.try({
        try: () => hasher.decrypt(value),
        catch() {
          return new HashingError("Error decrypting content");
        },
      }),
  });
}
