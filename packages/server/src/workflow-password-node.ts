import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { setWorkflowStepOutput, setWorkflowVariable } from "./workflow-context.js";
import type { WorkflowExecutionContext } from "./workflow-context.js";
import type { WorkflowNodeExecutionResult } from "./workflow-node-result.type.js";
import { resolveWorkflowTemplateValue } from "./workflow-template.js";
import type {
  WorkflowNodeDefinition,
  WorkflowNodeOutputByType,
  WorkflowJsonValue,
} from "./workflow.type.js";

type HashPasswordOutput = WorkflowNodeOutputByType["hashPassword"];
type VerifyPasswordOutput = WorkflowNodeOutputByType["verifyPassword"];

const algorithm = "scrypt" as const;
const scryptParams = {
  keyLength: 64,
  n: 16384,
  p: 1,
  r: 8,
};
const defaultMinPasswordLength = 8;

export async function executeWorkflowHashPasswordNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"hashPassword">,
): Promise<WorkflowNodeExecutionResult<HashPasswordOutput>> {
  try {
    const password = resolvedPassword(context, node.config.password);
    const minLength = safeMinLength(node.config.minLength);
    if (password.length < minLength) {
      return passwordFailure<HashPasswordOutput>(node.id, "PASSWORD_INPUT_TOO_SHORT", `Password must be at least ${minLength} characters.`);
    }
    const salt = randomBytes(16);
    const derived = await deriveScrypt(password, salt, scryptParams);
    const output: HashPasswordOutput = {
      algorithm,
      hash: encodeScryptHash(salt, derived),
      needsRehash: false,
    };
    setWorkflowStepOutput(context, node.id, output);
    if (node.config.outputKey?.trim()) setWorkflowVariable(context, node.config.outputKey.trim(), output.hash);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof PasswordNodeError ? error.message : "Password hash failed.";
    const code = error instanceof PasswordNodeError ? error.code : "PASSWORD_HASH_FAILED";
    return passwordFailure<HashPasswordOutput>(node.id, code, message);
  }
}

export async function executeWorkflowVerifyPasswordNode(
  context: WorkflowExecutionContext,
  node: WorkflowNodeDefinition<"verifyPassword">,
): Promise<WorkflowNodeExecutionResult<VerifyPasswordOutput>> {
  try {
    const password = resolvedPassword(context, node.config.password);
    const hash = resolvedPassword(context, node.config.hash);
    const parsed = parseScryptHash(hash);
    const derived = await deriveScrypt(password, parsed.salt, {
      keyLength: parsed.keyLength,
      n: parsed.n,
      p: parsed.p,
      r: parsed.r,
    });
    const matched = derived.length === parsed.hash.length && timingSafeEqual(derived, parsed.hash);
    const output: VerifyPasswordOutput = {
      matched,
      needsRehash: parsed.n !== scryptParams.n
        || parsed.r !== scryptParams.r
        || parsed.p !== scryptParams.p
        || parsed.keyLength !== scryptParams.keyLength,
    };
    setWorkflowStepOutput(context, node.id, output);
    if (node.config.outputKey?.trim()) setWorkflowVariable(context, node.config.outputKey.trim(), matched);
    return { ok: true, output, shouldStop: false };
  } catch (error) {
    const message = error instanceof PasswordNodeError ? error.message : "Password verify failed.";
    const code = error instanceof PasswordNodeError ? error.code : "PASSWORD_VERIFY_FAILED";
    return passwordFailure<VerifyPasswordOutput>(node.id, code, message);
  }
}

function resolvedPassword(context: WorkflowExecutionContext, value: WorkflowJsonValue | undefined): string {
  if (value === undefined || value === null) {
    throw new PasswordNodeError("PASSWORD_INPUT_MISSING", "Password input is missing.");
  }
  const resolved = resolveWorkflowTemplateValue(value, context);
  if (typeof resolved !== "string" || !resolved) {
    throw new PasswordNodeError("PASSWORD_INPUT_MISSING", "Password input must resolve to a string.");
  }
  return resolved;
}

function deriveScrypt(
  password: string,
  salt: Buffer,
  params: { keyLength: number; n: number; p: number; r: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, params.keyLength, {
      N: params.n,
      p: params.p,
      r: params.r,
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

function encodeScryptHash(salt: Buffer, hash: Buffer): string {
  return [
    "scrypt",
    `N=${scryptParams.n},r=${scryptParams.r},p=${scryptParams.p}`,
    `keylen=${scryptParams.keyLength}`,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

function parseScryptHash(encoded: string): {
  hash: Buffer;
  keyLength: number;
  n: number;
  p: number;
  r: number;
  salt: Buffer;
} {
  const [prefix, paramsText, keyLengthText, saltText, hashText] = encoded.split("$");
  if (prefix !== "scrypt" || !paramsText || !keyLengthText || !saltText || !hashText) {
    throw new PasswordNodeError("PASSWORD_VERIFY_INVALID_HASH", "Password hash is not a supported scrypt hash.");
  }
  const params = Object.fromEntries(paramsText.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, Number(value)];
  }));
  const keyLength = Number(keyLengthText.replace("keylen=", ""));
  if (!isSafeScryptNumber(params.N) || !isSafeScryptNumber(params.r) || !isSafeScryptNumber(params.p) || !isSafeScryptNumber(keyLength)) {
    throw new PasswordNodeError("PASSWORD_VERIFY_INVALID_HASH", "Password hash parameters are invalid.");
  }
  return {
    hash: Buffer.from(hashText, "base64url"),
    keyLength,
    n: params.N,
    p: params.p,
    r: params.r,
    salt: Buffer.from(saltText, "base64url"),
  };
}

function safeMinLength(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value)) return defaultMinPasswordLength;
  return Math.max(defaultMinPasswordLength, value);
}

function isSafeScryptNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 1_000_000;
}

class PasswordNodeError extends Error {
  constructor(
    readonly code:
      | "PASSWORD_HASH_FAILED"
      | "PASSWORD_HASH_UNSUPPORTED"
      | "PASSWORD_INPUT_MISSING"
      | "PASSWORD_INPUT_TOO_SHORT"
      | "PASSWORD_VERIFY_FAILED"
      | "PASSWORD_VERIFY_INVALID_HASH",
    message: string,
  ) {
    super(message);
    this.name = "PasswordNodeError";
  }
}

function passwordFailure<TOutput extends HashPasswordOutput | VerifyPasswordOutput>(
  nodeId: string,
  code:
    | "PASSWORD_HASH_FAILED"
    | "PASSWORD_HASH_UNSUPPORTED"
    | "PASSWORD_INPUT_MISSING"
    | "PASSWORD_INPUT_TOO_SHORT"
    | "PASSWORD_VERIFY_FAILED"
    | "PASSWORD_VERIFY_INVALID_HASH",
  message: string,
): WorkflowNodeExecutionResult<TOutput> {
  return {
    error: { code, message, nodeId },
    nodeId,
    ok: false,
    shouldStop: true,
  };
}
