import { createPublicKey, verify } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VERSION_BYTE_ED25519_PUBLIC_KEY = 6 << 3;
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export interface StellarAsset {
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  code: string;
  issuer?: string;
}

export interface TokenMetadata {
  code: string;
  issuer?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
}

export function isValidStellarPublicKey(publicKey: string): boolean {
  try {
    decodeStellarPublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

export function decodeStellarPublicKey(publicKey: string): Buffer {
  const decoded = base32Decode(publicKey);
  if (decoded.length !== 35) {
    throw new Error('Invalid public key length');
  }

  const payload = decoded.subarray(0, decoded.length - 2);
  const checksum = decoded.subarray(decoded.length - 2);
  const expectedChecksum = crc16Xmodem(payload);
  const expectedBytes = Buffer.from([
    expectedChecksum & 0xff,
    (expectedChecksum >> 8) & 0xff,
  ]);

  if (checksum[0] !== expectedBytes[0] || checksum[1] !== expectedBytes[1]) {
    throw new Error('Invalid public key checksum');
  }

  if (payload[0] !== VERSION_BYTE_ED25519_PUBLIC_KEY) {
    throw new Error('Invalid public key version');
  }

  return Buffer.from(payload.subarray(1));
}

export function verifyEd25519Signature(
  publicKey: string,
  message: string,
  signature: string,
): boolean {
  const rawKey = decodeStellarPublicKey(publicKey);
  const keyDer = Buffer.concat([ED25519_SPKI_PREFIX, rawKey]);
  const keyObject = createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
  const signatureBuffer = decodeSignature(signature);

  return verify(null, Buffer.from(message, 'utf8'), keyObject, signatureBuffer);
}

export function parseAmountToInt(amount: string, decimals = 7): bigint {
  if (typeof amount !== 'string') {
    throw new Error('Amount must be a string');
  }

  const normalized = amount.trim();
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Invalid amount format');
  }

  const parts = normalized.split('.');
  const whole = parts[0] || '0';
  const fraction = parts[1] || '';

  if (fraction.length > decimals) {
    throw new Error('Amount exceeds allowed decimals');
  }

  const paddedFraction = fraction.padEnd(decimals, '0');
  const base = BigInt(whole) * 10n ** BigInt(decimals);
  const fractionValue = paddedFraction ? BigInt(paddedFraction) : 0n;

  return base + fractionValue;
}

export function normalizeAsset(assetCode: string, issuer?: string): StellarAsset {
  const code = assetCode.trim();
  if (!code) {
    throw new Error('Asset code is required');
  }

  if (code.toUpperCase() === 'XLM' || code.toLowerCase() === 'native') {
    return { type: 'native', code: 'XLM' };
  }

  if (!issuer) {
    throw new Error('Asset issuer is required for custom assets');
  }

  if (code.length < 1 || code.length > 12) {
    throw new Error('Asset code must be between 1 and 12 characters');
  }

  if (!isValidStellarPublicKey(issuer)) {
    throw new Error('Invalid asset issuer');
  }

  const type = code.length <= 4 ? 'credit_alphanum4' : 'credit_alphanum12';
  return { type, code, issuer };
}

export function getAssetKey(asset: StellarAsset): string {
  if (asset.type === 'native') {
    return 'XLM';
  }
  return `${asset.code}:${asset.issuer}`;
}

export function getDefaultTokenMetadata(asset: StellarAsset): TokenMetadata {
  if (asset.type === 'native') {
    return {
      code: 'XLM',
      name: 'Stellar Lumens',
      symbol: 'XLM',
      decimals: 7,
    };
  }

  return {
    code: asset.code,
    issuer: asset.issuer,
    name: asset.code,
    symbol: asset.code,
    decimals: 7,
  };
}

function decodeSignature(signature: string): Buffer {
  const trimmed = signature.trim();
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === 128) {
    return Buffer.from(trimmed, 'hex');
  }

  return Buffer.from(trimmed, 'base64');
}

function base32Decode(input: string): Buffer {
  const normalized = input.trim().toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character');
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function crc16Xmodem(payload: Buffer): number {
  let crc = 0x0000;

  for (const byte of payload) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i += 1) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc;
}
