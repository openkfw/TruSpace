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
 * Generates a random password with specified length
 * @param length The length of the password
 * @returns A random password string
 */
export function generatePassword(length: number = 12): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
  let password = "";

  // Get random bytes from crypto
  const randomBytes = crypto.randomBytes(length);

  // Use each byte to select a character from the charset
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    password += charset[randomIndex];
  }

  return password;
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
