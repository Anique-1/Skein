/**
 * Proof of Work (PoW) anti-spam module.
 * Adds computational proof to broadcast messages to deter spamming on public geohash channels.
 */

export interface PowResult {
  nonce: number;
  hash: string;
}

export async function computeProofOfWork(payload: string, difficulty = 2): Promise<PowResult> {
  const targetPrefix = '0'.repeat(difficulty);
  let nonce = 0;

  while (nonce < 100000) {
    const candidate = `${payload}:${nonce}`;
    let hash = 0;
    for (let i = 0; i < candidate.length; i++) {
      const char = candidate.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    if (hex.startsWith(targetPrefix)) {
      return { nonce, hash: hex };
    }
    nonce++;
  }

  return { nonce: 0, hash: '' };
}

export function verifyProofOfWork(payload: string, nonce: number, difficulty = 2): boolean {
  const targetPrefix = '0'.repeat(difficulty);
  const candidate = `${payload}:${nonce}`;
  let hash = 0;
  for (let i = 0; i < candidate.length; i++) {
    const char = candidate.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex.startsWith(targetPrefix);
}
