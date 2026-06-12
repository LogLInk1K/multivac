/**
 * 加密/解密工具
 * 服务端：AES-GCM 加密（Web Crypto API）
 * 客户端：AES-GCM 解密（Web Crypto API）
 *
 * 数据格式：base64(salt[16] + iv[12] + ciphertext)
 */

// ---- 共用 ----

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function toBase64(buffer: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...buffer.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(''));
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---- 服务端加密 ----

export async function encryptContent(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);

  return toBase64(combined);
}

// ---- 客户端解密 ----

export async function decryptContent(encrypted: string, password: string): Promise<string> {
  const combined = fromBase64(encrypted);
  // 提取各段，slice 返回的 Uint8Array 共享原 buffer，需创建独立副本
  const salt = new Uint8Array(combined.slice(0, 16));
  const iv = new Uint8Array(combined.slice(16, 28));
  const ciphertext = new Uint8Array(combined.slice(28));

  const key = await deriveKey(password, salt.buffer);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}
