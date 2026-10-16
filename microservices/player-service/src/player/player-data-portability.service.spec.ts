import { createDecipheriv, scryptSync } from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { PlayerProgress } from './entities/player-progress.entity';
import { PlayerExportSchedule } from './entities/player-export-schedule.entity';
import { ExportCadence, ExportFormat } from './data-portability.types';
import { PlayerDataPortabilityService } from './player-data-portability.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const secret = 'player-export-test-secret-with-32-bytes';
const samplePlayer = {
  id: 'player-id',
  email: 'player@example.com',
  password: 'password-hash-must-not-export',
  username: 'player',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  profile: {
    id: 'profile-id',
    firstName: 'Test',
    lastName: 'Player',
    avatarUrl: null,
    dateOfBirth: null,
    country: 'CA',
    timezone: 'UTC',
    preferences: { color: 'green' },
    totalScore: 12,
    gamesPlayed: 3,
    puzzlesSolved: 2,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  },
};
const sampleProgress = [
  {
    id: 'progress-id',
    type: 'quest_completed',
    referenceId: 'quest-id',
    points: 12,
    metadata: { source: 'test' },
    isProcessed: true,
    createdAt: new Date('2025-01-03T00:00:00.000Z'),
    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
  },
];

describe('PlayerDataPortabilityService', () => {
  let service: PlayerDataPortabilityService;
  let playerRepo: jest.Mocked<Partial<Repository<Player>>>;
  let progressRepo: jest.Mocked<Partial<Repository<PlayerProgress>>>;
  let scheduleRepo: jest.Mocked<Partial<Repository<PlayerExportSchedule>>>;
  let config: ConfigService;
  let sendMail: jest.Mock;

  beforeEach(() => {
    playerRepo = { findOne: jest.fn().mockResolvedValue(samplePlayer) };
    progressRepo = { find: jest.fn().mockResolvedValue(sampleProgress) };
    scheduleRepo = {
      find: jest.fn(),
      create: jest.fn((value) => value as PlayerExportSchedule),
      save: jest.fn((value) => Promise.resolve(value as PlayerExportSchedule)),
      delete: jest.fn(),
      update: jest.fn(),
    };
    sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    config = {
      get: jest.fn(
        (key: string) =>
          ({
            EXPORT_ENCRYPTION_KEY: secret,
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: '587',
            SMTP_USER: 'sender@example.com',
            SMTP_PASSWORD: 'smtp-secret',
          })[key],
      ),
    } as unknown as ConfigService;
    service = new PlayerDataPortabilityService(
      playerRepo as Repository<Player>,
      progressRepo as Repository<PlayerProgress>,
      scheduleRepo as Repository<PlayerExportSchedule>,
      config,
    );
  });

  function decrypt(encrypted: Buffer): Buffer {
    const envelope = JSON.parse(encrypted.toString());
    expect(envelope.algorithm).toBe('aes-256-gcm');
    const salt = Buffer.from(envelope.salt, 'base64');
    const key = scryptSync(secret, salt, 32);
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(envelope.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]);
  }

  it('aggregates player, profile, and every progress record without credentials', async () => {
    const data = await service.collectPlayerData('player-id');

    expect(data.player.email).toBe(samplePlayer.email);
    expect(data.profile.preferences).toEqual({ color: 'green' });
    expect(data.progress).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain('password-hash-must-not-export');
    expect(progressRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { player: { id: 'player-id' } },
      }),
    );
  });

  it.each([ExportFormat.JSON, ExportFormat.CSV, ExportFormat.PDF])(
    'renders and encrypts %s exports',
    async (format) => {
      const encrypted = await service.createEncryptedExport(
        'player-id',
        format,
      );
      const payload = decrypt(encrypted);
      const envelope = JSON.parse(encrypted.toString());

      expect(envelope.format).toBe(format);
      if (format === ExportFormat.JSON) {
        expect(JSON.parse(payload.toString()).progress).toHaveLength(1);
      } else if (format === ExportFormat.CSV) {
        expect(payload.toString()).toContain('progress-id');
        expect(payload.toString()).toContain('preferences');
      } else {
        expect(payload.toString('ascii', 0, 8)).toContain('%PDF');
      }
      expect(encrypted.toString()).not.toContain('player@example.com');
    },
  );

  it('accepts a valid canonical import and rejects credential fields and malformed rows', () => {
    const data = {
      schemaVersion: 1,
      exportedAt: '2025-01-04T00:00:00.000Z',
      player: {
        id: 'player-id',
        email: 'player@example.com',
        username: 'player',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
      profile: {
        id: 'profile-id',
        firstName: 'Test',
        lastName: 'Player',
        avatarUrl: null,
        dateOfBirth: null,
        country: 'CA',
        timezone: 'UTC',
        preferences: {},
        totalScore: 12,
        gamesPlayed: 3,
        puzzlesSolved: 2,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      },
      progress: [
        {
          id: 'progress-id',
          type: 'quest_completed',
          referenceId: 'quest-id',
          points: 12,
          metadata: {},
          isProcessed: true,
          createdAt: '2025-01-03T00:00:00.000Z',
          updatedAt: '2025-01-03T00:00:00.000Z',
        },
      ],
    };

    expect(service.validateImport(data)).toEqual({ valid: true, errors: [] });
    const invalid = service.validateImport({
      ...data,
      player: { ...data.player, password: 'should-not-be-imported' },
      progress: [{ ...data.progress[0], points: 'invalid' }],
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(' ')).toContain('unsupported fields: password');
    expect(invalid.errors.join(' ')).toContain('points must be an integer');
  });

  it('creates daily and weekly schedules for only the authenticated player', async () => {
    const result = await service.createSchedule(
      'player-id',
      ExportFormat.JSON,
      ExportCadence.WEEKLY,
    );
    const created = (scheduleRepo.create as jest.Mock).mock.calls[0][0];

    expect(result).toBeDefined();
    expect(created.playerId).toBe('player-id');
    expect(created.cadence).toBe(ExportCadence.WEEKLY);
    expect(created.nextRunAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('emails an encrypted attachment to the player account address', async () => {
    await expect(
      service.sendExportEmail('player-id', ExportFormat.JSON),
    ).resolves.toEqual({ sent: true });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: samplePlayer.email,
        attachments: [
          expect.objectContaining({
            filename: 'player-data-json.encrypted.json',
            content: expect.any(Buffer),
          }),
        ],
      }),
    );
  });
});
