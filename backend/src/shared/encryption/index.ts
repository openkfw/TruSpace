import bcrypt from "bcrypt";
import * as crypto from "crypto";
import logger from "../config/winston";

const ALGORITHM = "aes-256-cbc";
const KEY_DERIVATION_ITERATIONS = 10000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypts data using aes-256-cbc and a user-provided key.
 *
 * @param {string|Buffer} data - The data to be encrypted.
 * @param {string} password - The key used for encryption.
 * @returns {Buffer} - Buffer containing salt, IV, ciphertext.
 */
export async function encrypt(
  data: string | Buffer,
  password: string
): Promise<Buffer> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      KEY_DERIVATION_ITERATIONS,
      KEY_LENGTH,
      "sha512",
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key as Buffer<ArrayBufferLike>,
    iv
  );
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return Buffer.concat([salt, iv, encrypted]);
}

/**
 * Decrypts data previously encrypted with the `encrypt` function.
 *
 * @param {Buffer} data - Buffer data as produced by `encrypt`.
 * @param {string} password - The same key used during encryption.
 * @returns {Buffer} - The decrypted data.
 */
export async function decrypt(data: Buffer, password: string): Promise<Buffer> {
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const text = data.subarray(SALT_LENGTH + IV_LENGTH);

  const key = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      KEY_DERIVATION_ITERATIONS,
      KEY_LENGTH,
      "sha512",
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key as Buffer<ArrayBufferLike>,
    iv
  );

  const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);

  return decrypted;
}

/**
 * Generates a cryptographically secure random password with a specified length and charset.
 * Uses rejection sampling to avoid modulo bias.
 *
 * @param length - The desired length of the password (default: 12)
 * @param charset - The set of characters to choose from (default: alphanumeric + symbols)
 * @returns A secure random password string
 */
export function generatePassword(
  length: number = 12,
  charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=",
): string {
  if (length <= 0) throw new Error("Password length must be greater than 0");
  if (charset.length === 0) throw new Error("Charset must not be empty");

  const password: string[] = [];
  const maxValidByte = 256 - (256 % charset.length);

  while (password.length < length) {
    const byte = crypto.randomBytes(1)[0];

    // Only use bytes that won't introduce bias
    if (byte >= maxValidByte) continue;

    password.push(charset[byte % charset.length]);
  }

  return password.join("");
}

export async function hashPassword(plaintext: string): Promise<string> {
  const SALT_ROUNDS = 10;

  const hashedPassword = await bcrypt.hash(plaintext, SALT_ROUNDS);
  return hashedPassword;
}

export async function verifyPassword(
  plaintext: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plaintext, hashedPassword);
  } catch (error) {
    logger.error(error);
    return false;
  }
}
