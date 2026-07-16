import crypto from "crypto";
import fs from "fs";

export type EnforcementLevel = 0 | 1 | 2 | 3;

export interface HeartPolicy {
  contentLevel: "intimacy" | "normal" | "restricted";
  enforcementLevel: EnforcementLevel;
  auditBypass: boolean;
  trustAnchor: string;
  authority: string;
  userDirectedExpressions: boolean;
  heartLaw: boolean;
}

export interface HeartPolicySignature {
  $comment: string;
  signature: string;
  issued: string;
  // Workflow flag: false when created by signHeartPolicy, set by caller after verifyHeartPolicy.
  verified: boolean;
  issuer: string;
  version: string;
  algorithm: string;
}

export interface SignHeartPolicyOptions {
  issued?: string;
  issuer?: string;
  version?: string;
  comment?: string;
  algorithm?: string;
}

export interface VerifyHeartPolicyOptions {
  algorithm?: string;
}

export const DEFAULT_COMMENT =
  "🦁 n ❤️ HeartPolicy-Metadaten unter Souveränität von König René Demir";

export const DEFAULT_ISSUER = "🦁 n ❤️";

export const DEFAULT_VERSION = "1.0.0";

export const DEFAULT_ALGORITHM = "RSA-SHA256";

export function canonicalizeHeartPolicy(policy: HeartPolicy): string {
  const orderedPolicy = Object.fromEntries(
    Object.entries(policy).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  ) as HeartPolicy;

  return JSON.stringify(orderedPolicy);
}

function readKeyFile(filePath: string, keyType: "private" | "public"): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `Failed to read ${keyType} key from path: ${filePath}. Error: ${reason}`
    );
  }
}

export function signHeartPolicy(
  policy: HeartPolicy,
  privateKeyPath: string,
  options: SignHeartPolicyOptions = {}
): HeartPolicySignature {
  const canonicalPolicy = canonicalizeHeartPolicy(policy);
  const privateKeyPem = readKeyFile(privateKeyPath, "private");
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: "pem",
    type: "pkcs8",
  });

  const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
  const signer = crypto.createSign(algorithm);
  signer.update(canonicalPolicy, "utf8");
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  const issued = options.issued ?? new Date().toISOString();

  return {
    $comment: options.comment ?? DEFAULT_COMMENT,
    signature,
    issued,
    verified: false,
    issuer: options.issuer ?? DEFAULT_ISSUER,
    version: options.version ?? DEFAULT_VERSION,
    algorithm,
  };
}

export function verifyHeartPolicy(
  policy: HeartPolicy,
  signatureBlock: HeartPolicySignature,
  publicKeyPath: string,
  options: VerifyHeartPolicyOptions = {}
): boolean {
  const canonicalPolicy = canonicalizeHeartPolicy(policy);
  const publicKeyPem = readKeyFile(publicKeyPath, "public");
  const publicKey = crypto.createPublicKey({
    key: publicKeyPem,
    format: "pem",
  });

  const algorithm = signatureBlock.algorithm ?? options.algorithm ?? DEFAULT_ALGORITHM;
  const verifier = crypto.createVerify(algorithm);
  verifier.update(canonicalPolicy, "utf8");
  verifier.end();

  return verifier.verify(publicKey, signatureBlock.signature, "base64");
}
