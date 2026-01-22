import { generateKeyPairSync, sign } from 'crypto';
import {
  isValidStellarPublicKey,
  parseAmountToInt,
  verifyEd25519Signature,
} from './stellar';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const VERSION_BYTE_ED25519_PUBLIC_KEY = 6 << 3;

function base32Encode(data: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
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

function encodePublicKey(rawKey: Buffer): string {
  const payload = Buffer.concat([
    Buffer.from([VERSION_BYTE_ED25519_PUBLIC_KEY]),
    rawKey,
  ]);
  const checksum = crc16Xmodem(payload);
  const checksumBytes = Buffer.from([checksum & 0xff, (checksum >> 8) & 0xff]);
  return base32Encode(Buffer.concat([payload, checksumBytes]));
}

describe('stellar utils', () => {
  it('parses amounts into integers', () => {
    expect(parseAmountToInt('1')).toBe(10000000n);
    expect(parseAmountToInt('0.0000001')).toBe(1n);
    expect(parseAmountToInt('2.5')).toBe(25000000n);
  });

  it('rejects amounts with too many decimals', () => {
    expect(() => parseAmountToInt('1.00000001')).toThrow('Amount exceeds allowed decimals');
  });

  it('validates stellar public keys and signatures', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicDer = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    const rawPublicKey = publicDer.subarray(publicDer.length - 32);
    const stellarPublicKey = encodePublicKey(rawPublicKey);

    expect(isValidStellarPublicKey(stellarPublicKey)).toBe(true);
    expect(isValidStellarPublicKey('GABC')).toBe(false);

    const message = 'LogiQuest Wallet Authentication';
    const signature = sign(null, Buffer.from(message, 'utf8'), privateKey).toString('base64');

    expect(verifyEd25519Signature(stellarPublicKey, message, signature)).toBe(true);
    expect(verifyEd25519Signature(stellarPublicKey, message, 'deadbeef')).toBe(false);
  });
});
