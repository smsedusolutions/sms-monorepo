/**
 * Web Crypto API End-to-End Encryption (E2EE) Utility
 * Algorithm: ECDH (P-256) for Key Agreement + AES-GCM (256-bit) for Payload Encryption
 */

const LOCAL_STORAGE_KEY_PREFIX = "sms_e2ee_keys_";

export interface KeyPairExport {
  publicKeyBase64: string;
  privateKeyBase64: string;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  authTag?: string;   // Base64
  algo: string;       // "AES-GCM-256"
  keyVersion: string;
}

/**
 * ArrayBuffer to Base64 helper
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Base64 to ArrayBuffer helper
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a new ECDH KeyPair (P-256)
 */
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Export Public Key to Base64 SPKI format
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

/**
 * Export Private Key to Base64 PKCS8 format
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return bufferToBase64(exported);
}

/**
 * Import Public Key from Base64 SPKI format
 */
export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(spkiBase64);
  return await window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

/**
 * Import Private Key from Base64 PKCS8 format
 */
export async function importPrivateKey(pkcs8Base64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(pkcs8Base64);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

/**
 * Derive shared AES-GCM key from own private key & target recipient's public key
 */
export async function deriveSharedKey(
  ownPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: recipientPublicKey,
    },
    ownPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Get or initialize persistent client E2EE Key Pair
 */
export async function getOrInitializeUserKeys(userId: string): Promise<{
  keyPair: CryptoKeyPair;
  publicKeyBase64: string;
}> {
  const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed: KeyPairExport = JSON.parse(stored);
      const pub = await importPublicKey(parsed.publicKeyBase64);
      const priv = await importPrivateKey(parsed.privateKeyBase64);
      return {
        keyPair: { publicKey: pub, privateKey: priv },
        publicKeyBase64: parsed.publicKeyBase64,
      };
    } catch (e) {
      console.warn("⚠️ Re-generating corrupted E2EE keys...");
    }
  }

  // Generate new keys
  const keyPair = await generateECDHKeyPair();
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem(
    storageKey,
    JSON.stringify({ publicKeyBase64, privateKeyBase64 })
  );

  return { keyPair, publicKeyBase64 };
}

/**
 * Encrypt plaintext string using derived AES-GCM key
 */
export async function encryptText(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    sharedKey,
    data
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    algo: "AES-GCM-256",
    keyVersion: "1",
  };
}

/**
 * Decrypt ciphertext string using derived AES-GCM key
 */
export async function decryptText(
  payload: EncryptedPayload,
  sharedKey: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(payload.ciphertext);
  const ivBuffer = base64ToBuffer(payload.iv);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt file buffer (ArrayBuffer) using derived AES-GCM key
 */
export async function encryptFileBuffer(
  fileBuffer: ArrayBuffer,
  sharedKey: CryptoKey
): Promise<{ encryptedBuffer: ArrayBuffer; ivBase64: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    sharedKey,
    fileBuffer
  );

  return {
    encryptedBuffer: encrypted,
    ivBase64: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt file buffer (ArrayBuffer) using derived AES-GCM key
 */
export async function decryptFileBuffer(
  encryptedBuffer: ArrayBuffer,
  ivBase64: string,
  sharedKey: CryptoKey
): Promise<ArrayBuffer> {
  const ivBuffer = base64ToBuffer(ivBase64);
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    sharedKey,
    encryptedBuffer
  );
}
