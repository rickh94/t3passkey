import crypto from "crypto";
import { env } from "~/env.mjs";

const SECRET_KEY = env.ENCRYPTION_KEY;
const IV = env.ENCRYPTION_IV;

// Function to encrypt text using AES
export function encryptText(text: string) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY, "hex"),
    Buffer.from(IV, "hex"),
  );
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// Function to decrypt AES-encrypted text
export function decryptText(encryptedText: string) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(SECRET_KEY, "hex"),
    Buffer.from(IV, "hex"),
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
