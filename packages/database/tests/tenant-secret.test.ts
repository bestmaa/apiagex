import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decryptTenantSecret,
  encryptTenantSecret,
  tenantSecretKeyFromBase64,
} from "../src/index.js";

describe("tenant secret encryption", () => {
  it("encrypts and decrypts tenant database URLs", () => {
    const key = tenantSecretKeyFromBase64(randomBytes(32).toString("base64"), "test-key");
    const encrypted = encryptTenantSecret("postgres://tenant:secret@db/pizza", key);

    expect(encrypted.algorithm).toBe("aes-256-gcm");
    expect(encrypted.keyId).toBe("test-key");
    expect(JSON.stringify(encrypted)).not.toContain("tenant:secret");
    expect(decryptTenantSecret(encrypted, key)).toBe("postgres://tenant:secret@db/pizza");
  });

  it("rejects invalid keys and failed decrypts", () => {
    const key = tenantSecretKeyFromBase64(randomBytes(32).toString("base64"));
    const wrongKey = tenantSecretKeyFromBase64(randomBytes(32).toString("base64"));
    const encrypted = encryptTenantSecret("sqlite:///tenant.sqlite", key);

    expect(() => tenantSecretKeyFromBase64(randomBytes(16).toString("base64"))).toThrow("TENANT_SECRET_KEY_INVALID");
    expect(() => decryptTenantSecret(encrypted, wrongKey)).toThrow("TENANT_SECRET_DECRYPT_FAILED");
    expect(() => decryptTenantSecret({ ...encrypted, tag: "bad" }, key)).toThrow("TENANT_SECRET_ENVELOPE_INVALID");
  });
});
