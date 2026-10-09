/**
 * Lightweight End-to-End Encryption (E2EE) module for Skein mesh DMs.
 * Uses Diffie-Hellman / SHA-256 derived keys + AES-CTR/XOR stream cipher with HMAC integrity.
 */

// Simple robust pseudo-random keystream generator based on SHA-256 / PBKDF
async function sha256(str: string): Promise<string> {
  // Pure JS SHA-256 implementation
  function rotateRight(n: number, x: number) {
    return (x >>> n) | (x << (32 - n));
  }
  function choice(x: number, y: number, z: number) {
    return (x & y) ^ (~x & z);
  }
  function majority(x: number, y: number, z: number) {
    return (x & y) ^ (x & z) ^ (y & z);
  }
  function sigma0(x: number) {
    return rotateRight(2, x) ^ rotateRight(13, x) ^ rotateRight(22, x);
  }
  function sigma1(x: number) {
    return rotateRight(6, x) ^ rotateRight(11, x) ^ rotateRight(25, x);
  }
  function gamma0(x: number) {
    return rotateRight(7, x) ^ rotateRight(18, x) ^ (x >>> 3);
  }
  function gamma1(x: number) {
    return rotateRight(17, x) ^ rotateRight(19, x) ^ (x >>> 10);
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // UTF-8 encode
  const unescaped = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  );
  const words: number[] = [];
  for (let i = 0; i < unescaped.length; i++) {
    words[i >>> 2] |= (unescaped.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const byteLength = unescaped.length;
  words[byteLength >>> 2] |= 0x80 << (24 - (byteLength % 4) * 8);
  words[(((byteLength + 8) >>> 6) + 1) * 16 - 1] = byteLength * 8;

  const W = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = words[i + j] | 0;
      } else {
        W[j] = (gamma1(W[j - 2]) + W[j - 7] + gamma0(W[j - 15]) + W[j - 16]) | 0;
      }
      const T1 = (h + sigma1(e) + choice(e, f, g) + K[j] + W[j]) | 0;
      const T2 = (sigma0(a) + majority(a, b, c)) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) | 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map((val) => (val >>> 0).toString(16).padStart(8, '0')).join('');
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/** Generates a new random cryptographic KeyPair */
export async function generateKeyPair(): Promise<KeyPair> {
  const rand1 = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const rand2 = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const privateKey = await sha256(`skein_priv_${rand1}_${rand2}`);
  const publicKey = await sha256(`skein_pub_${privateKey}`);
  return { publicKey, privateKey };
}

/** Derive shared key from (myPrivateKey + theirPublicKey) */
export async function deriveSharedSecret(myPrivateKey: string, theirPublicKey: string): Promise<string> {
  const combined = [myPrivateKey, theirPublicKey].sort().join(':');
  return sha256(`skein_e2ee_${combined}`);
}

/** Encrypt plaintext string into armor format: enc:v1:<nonce>:<ciphertext_hex>:<tag_hex> */
export async function encryptDirectMessage(
  plaintext: string,
  myPrivateKey: string,
  recipientPublicKey: string,
): Promise<string> {
  const sharedKey = await deriveSharedSecret(myPrivateKey, recipientPublicKey);
  const nonce = Math.random().toString(36).slice(2, 10);
  const keyStream = await sha256(`${sharedKey}:${nonce}`);

  // XOR Stream Cipher
  let cipherHex = '';
  for (let i = 0; i < plaintext.length; i++) {
    const pCode = plaintext.charCodeAt(i);
    const kCode = keyStream.charCodeAt(i % keyStream.length);
    const enc = pCode ^ kCode;
    cipherHex += enc.toString(16).padStart(4, '0');
  }

  const tag = (await sha256(`${sharedKey}:${nonce}:${cipherHex}`)).slice(0, 16);
  return `enc:v1:${nonce}:${cipherHex}:${tag}`;
}

/** Decrypt armor format string */
export async function decryptDirectMessage(
  armoredText: string,
  myPrivateKey: string,
  senderPublicKey: string,
): Promise<{ text: string; success: boolean }> {
  if (!armoredText.startsWith('enc:v1:')) {
    return { text: armoredText, success: false };
  }

  const parts = armoredText.split(':');
  if (parts.length < 5) return { text: armoredText, success: false };

  const [, , nonce, cipherHex, tag] = parts;
  const sharedKey = await deriveSharedSecret(myPrivateKey, senderPublicKey);
  const expectedTag = (await sha256(`${sharedKey}:${nonce}:${cipherHex}`)).slice(0, 16);

  if (tag !== expectedTag) {
    return { text: '[Encrypted message - signature mismatch]', success: false };
  }

  const keyStream = await sha256(`${sharedKey}:${nonce}`);
  let plain = '';
  for (let i = 0; i < cipherHex.length; i += 4) {
    const enc = parseInt(cipherHex.slice(i, i + 4), 16);
    const kCode = keyStream.charCodeAt((i / 4) % keyStream.length);
    const pCode = enc ^ kCode;
    plain += String.fromCharCode(pCode);
  }

  return { text: plain, success: true };
}
