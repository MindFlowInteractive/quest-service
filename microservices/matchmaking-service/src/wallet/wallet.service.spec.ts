import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { generateKeyPairSync, sign } from 'crypto';
import { WalletService } from './wallet.service';

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

function createWalletKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicDer = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
  const rawPublicKey = publicDer.subarray(publicDer.length - 32);
  const stellarPublicKey = encodePublicKey(rawPublicKey);
  return { stellarPublicKey, privateKey };
}

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService({ get: jest.fn() } as any);
  });

  it('creates a challenge and verifies a session', () => {
    const { stellarPublicKey, privateKey } = createWalletKeypair();
    const challenge = service.createChallenge(stellarPublicKey, 'testnet');
    const signature = sign(null, Buffer.from(challenge.message, 'utf8'), privateKey).toString('base64');

    const result = service.verifyChallenge(
      stellarPublicKey,
      'testnet',
      challenge.nonce,
      signature,
    );

    expect(result.status).toBe('connected');
    expect(result.sessionToken).toBeDefined();
  });

  it('rejects invalid signatures', () => {
    const { stellarPublicKey } = createWalletKeypair();
    const challenge = service.createChallenge(stellarPublicKey, 'testnet');

    expect(() =>
      service.verifyChallenge(stellarPublicKey, 'testnet', challenge.nonce, 'deadbeef'),
    ).toThrow(UnauthorizedException);
  });

  it('rejects expired challenges', () => {
    const { stellarPublicKey, privateKey } = createWalletKeypair();
    const challenge = service.createChallenge(stellarPublicKey, 'testnet');
    const signature = sign(null, Buffer.from(challenge.message, 'utf8'), privateKey).toString('base64');

    const stored = (service as any).challenges.get(challenge.nonce);
    stored.expiresAt = new Date(Date.now() - 1000);

    expect(() =>
      service.verifyChallenge(stellarPublicKey, 'testnet', challenge.nonce, signature),
    ).toThrow(UnauthorizedException);
  });

  it('records purchase transactions and prevents duplicates', async () => {
    const { stellarPublicKey, privateKey } = createWalletKeypair();
    const challenge = service.createChallenge(stellarPublicKey, 'testnet');
    const signature = sign(null, Buffer.from(challenge.message, 'utf8'), privateKey).toString('base64');
    const auth = service.verifyChallenge(
      stellarPublicKey,
      'testnet',
      challenge.nonce,
      signature,
    );

    const session = service.getSession(auth.sessionToken);

    jest
      .spyOn(service as any, 'verifyPaymentOnChain')
      .mockResolvedValue(true);

    const payload = {
      assetCode: 'XLM',
      amount: '1.0000000',
      transactionHash: 'a'.repeat(64),
    };

    const first = await service.recordPurchase(session, payload);
    const second = await service.recordPurchase(session, payload);

    expect(first.id).toBe(second.id);
  });

  it('rejects invalid amounts', async () => {
    const { stellarPublicKey, privateKey } = createWalletKeypair();
    const challenge = service.createChallenge(stellarPublicKey, 'testnet');
    const signature = sign(null, Buffer.from(challenge.message, 'utf8'), privateKey).toString('base64');
    const auth = service.verifyChallenge(
      stellarPublicKey,
      'testnet',
      challenge.nonce,
      signature,
    );

    const session = service.getSession(auth.sessionToken);

    await expect(
      service.recordPurchase(session, {
        assetCode: 'XLM',
        amount: '0',
        transactionHash: 'b'.repeat(64),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
