import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { requireEnv } from "./env";

const algorithm = "aes-256-gcm";

function getKey() {
  return createHash("sha256").update(requireEnv("ENCRYPTION_KEY")).digest();
}

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decrypt(encryptedText: string): string {
  const [iv, authTag, encrypted] = encryptedText.split(":");

  if (!iv || !authTag || !encrypted) {
    throw new Error("Invalid encrypted value.");
  }

  const decipher = createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
}
