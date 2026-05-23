import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { TenantEncryptedSecret } from "./tenant-repository.type.js";

export type TenantSecretKey = {
  id?: string | undefined;
  key: Buffer;
};

const algorithm = "aes-256-gcm";
const ivBytes = 12;
const keyBytes = 32;

export function tenantSecretKeyFromBase64(value: string, id?: string | undefined): TenantSecretKey {
  const key = Buffer.from(value, "base64");
  if (key.length !== keyBytes) throw new Error("TENANT_SECRET_KEY_INVALID");
  return { id, key };
}

export function encryptTenantSecret(plaintext: string, secretKey: TenantSecretKey): TenantEncryptedSecret {
  if (!plaintext) throw new Error("TENANT_SECRET_PLAINTEXT_REQUIRED");
  assertTenantSecretKey(secretKey);
  const iv = randomBytes(ivBytes);
  const cipher = createCipheriv(algorithm, secretKey.key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    algorithm,
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    ...(secretKey.id === undefined ? {} : { keyId: secretKey.id }),
    tag: tag.toString("base64"),
    version: 1,
  };
}

export function decryptTenantSecret(envelope: TenantEncryptedSecret, secretKey: TenantSecretKey): string {
  assertTenantSecretEnvelope(envelope);
  assertTenantSecretKey(secretKey);
  try {
    const decipher = createDecipheriv(algorithm, secretKey.key, Buffer.from(envelope.iv, "base64"));
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("TENANT_SECRET_DECRYPT_FAILED");
  }
}

export function assertTenantSecretEnvelope(envelope: TenantEncryptedSecret): void {
  if (envelope.version !== 1 || envelope.algorithm !== algorithm) throw new Error("TENANT_SECRET_ENVELOPE_INVALID");
  if (!isBase64(envelope.iv) || Buffer.from(envelope.iv, "base64").length !== ivBytes) {
    throw new Error("TENANT_SECRET_ENVELOPE_INVALID");
  }
  if (!isBase64(envelope.tag) || Buffer.from(envelope.tag, "base64").length !== 16) {
    throw new Error("TENANT_SECRET_ENVELOPE_INVALID");
  }
  if (!isBase64(envelope.ciphertext) || Buffer.from(envelope.ciphertext, "base64").length === 0) {
    throw new Error("TENANT_SECRET_ENVELOPE_INVALID");
  }
}

function assertTenantSecretKey(secretKey: TenantSecretKey): void {
  if (!Buffer.isBuffer(secretKey.key) || secretKey.key.length !== keyBytes) throw new Error("TENANT_SECRET_KEY_INVALID");
}

function isBase64(value: string): boolean {
  return Boolean(value) && Buffer.from(value, "base64").toString("base64") === value;
}
