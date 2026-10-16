import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, createCipheriv } from 'crypto';
import PDFDocument from 'pdfkit';
import * as nodemailer from 'nodemailer';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { PlayerProgress } from './entities/player-progress.entity';
import { PlayerExportSchedule } from './entities/player-export-schedule.entity';
import {
  ExportCadence,
  ExportFormat,
  PlayerDataExport,
} from './data-portability.types';

const PLAYER_FIELDS = [
  'id',
  'email',
  'username',
  'isActive',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
];
const PROFILE_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'avatarUrl',
  'dateOfBirth',
  'country',
  'timezone',
  'preferences',
  'totalScore',
  'gamesPlayed',
  'puzzlesSolved',
  'createdAt',
  'updatedAt',
];
const PROGRESS_FIELDS = [
  'id',
  'type',
  'referenceId',
  'points',
  'metadata',
  'isProcessed',
  'createdAt',
  'updatedAt',
];

@Injectable()
export class PlayerDataPortabilityService {
  private readonly logger = new Logger(PlayerDataPortabilityService.name);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerProgress)
    private readonly progressRepo: Repository<PlayerProgress>,
    @InjectRepository(PlayerExportSchedule)
    private readonly scheduleRepo: Repository<PlayerExportSchedule>,
    private readonly config: ConfigService,
  ) {}

  async collectPlayerData(playerId: string): Promise<PlayerDataExport> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId },
      relations: ['profile'],
    });
    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const progress = await this.progressRepo.find({
      where: { player: { id: playerId } },
      order: { createdAt: 'ASC' },
    });

    const { password: _password, profile, ...playerData } = player;
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      player: this.pickFields(playerData, PLAYER_FIELDS),
      profile: profile ? this.pickFields(profile, PROFILE_FIELDS) : null,
      progress: progress.map((entry) =>
        this.pickFields(entry, PROGRESS_FIELDS),
      ),
    } as PlayerDataExport;
  }

  async createEncryptedExport(
    playerId: string,
    format: ExportFormat,
  ): Promise<Buffer> {
    if (!Object.values(ExportFormat).includes(format)) {
      throw new BadRequestException('Unsupported export format');
    }
    const data = await this.collectPlayerData(playerId);
    const payload = await this.render(data, format);
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = scryptSync(this.encryptionSecret(), salt, 32);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
    return Buffer.from(
      JSON.stringify({
        version: 1,
        format,
        algorithm: 'aes-256-gcm',
        kdf: 'scrypt',
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
        ciphertext: ciphertext.toString('base64'),
      }),
    );
  }

  validateImport(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.isRecord(data)) {
      return { valid: false, errors: ['data must be an object'] };
    }
    this.checkKeys(
      data,
      ['schemaVersion', 'exportedAt', 'player', 'profile', 'progress'],
      'data',
      errors,
    );
    if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1');
    if (!this.isDate(data.exportedAt))
      errors.push('exportedAt must be a valid date');

    if (!this.isRecord(data.player)) {
      errors.push('player must be an object');
    } else {
      const player = data.player;
      this.checkKeys(player, PLAYER_FIELDS, 'player', errors);
      if (typeof player.id !== 'string' || !player.id)
        errors.push('player.id is required');
      if (
        typeof player.email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player.email)
      ) {
        errors.push('player.email must be a valid email');
      }
      if (typeof player.username !== 'string' || !player.username)
        errors.push('player.username is required');
      if (typeof player.isActive !== 'boolean')
        errors.push('player.isActive must be a boolean');
      if (player.lastLoginAt !== null && !this.isDate(player.lastLoginAt))
        errors.push('player.lastLoginAt must be a valid date or null');
      if (!this.isDate(player.createdAt))
        errors.push('player.createdAt must be a valid date');
      if (!this.isDate(player.updatedAt))
        errors.push('player.updatedAt must be a valid date');
    }

    if (data.profile !== null && !this.isRecord(data.profile)) {
      errors.push('profile must be an object or null');
    } else if (this.isRecord(data.profile)) {
      this.checkKeys(data.profile, PROFILE_FIELDS, 'profile', errors);
      for (const field of [
        'firstName',
        'lastName',
        'avatarUrl',
        'country',
        'timezone',
      ]) {
        if (
          data.profile[field] !== null &&
          typeof data.profile[field] !== 'string'
        ) {
          errors.push(`profile.${field} must be a string or null`);
        }
      }
      if (
        data.profile.dateOfBirth !== null &&
        !this.isDate(data.profile.dateOfBirth)
      ) {
        errors.push('profile.dateOfBirth must be a valid date or null');
      }
      for (const field of ['totalScore', 'gamesPlayed', 'puzzlesSolved']) {
        if (!Number.isInteger(data.profile[field]))
          errors.push(`profile.${field} must be an integer`);
      }
      if (
        data.profile.preferences !== null &&
        !this.isRecord(data.profile.preferences)
      ) {
        errors.push('profile.preferences must be an object or null');
      }
      if (!this.isDate(data.profile.createdAt))
        errors.push('profile.createdAt must be a valid date');
      if (!this.isDate(data.profile.updatedAt))
        errors.push('profile.updatedAt must be a valid date');
    }

    if (!Array.isArray(data.progress)) {
      errors.push('progress must be an array');
    } else {
      data.progress.forEach((entry, index) => {
        const path = `progress[${index}]`;
        if (!this.isRecord(entry)) {
          errors.push(`${path} must be an object`);
          return;
        }
        this.checkKeys(entry, PROGRESS_FIELDS, path, errors);
        if (typeof entry.id !== 'string' || !entry.id)
          errors.push(`${path}.id is required`);
        if (
          typeof entry.type !== 'string' ||
          ![
            'puzzle_completed',
            'quest_completed',
            'achievement_unlocked',
            'level_up',
            'score_earned',
          ].includes(entry.type)
        ) {
          errors.push(`${path}.type is invalid`);
        }
        if (typeof entry.referenceId !== 'string')
          errors.push(`${path}.referenceId must be a string`);
        if (!Number.isInteger(entry.points))
          errors.push(`${path}.points must be an integer`);
        if (typeof entry.isProcessed !== 'boolean')
          errors.push(`${path}.isProcessed must be a boolean`);
        if (entry.metadata !== null && !this.isRecord(entry.metadata))
          errors.push(`${path}.metadata must be an object or null`);
        if (!this.isDate(entry.createdAt))
          errors.push(`${path}.createdAt must be a valid date`);
        if (!this.isDate(entry.updatedAt))
          errors.push(`${path}.updatedAt must be a valid date`);
      });
    }
    return { valid: errors.length === 0, errors };
  }

  async sendExportEmail(
    playerId: string,
    format: ExportFormat,
  ): Promise<{ sent: true }> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Player not found');
    const attachment = await this.createEncryptedExport(playerId, format);
    const transport = nodemailer.createTransport(this.smtpOptions());
    await transport.sendMail({
      from: this.emailSender(),
      to: player.email,
      subject: 'Your encrypted player data export',
      text: 'Your requested player data export is attached as an encrypted file. Use the configured export encryption key to decrypt it.',
      attachments: [
        {
          filename: `player-data-${format}.encrypted.json`,
          content: attachment,
        },
      ],
    });
    return { sent: true };
  }

  async createSchedule(
    playerId: string,
    format: ExportFormat,
    cadence: ExportCadence,
  ): Promise<PlayerExportSchedule> {
    if (
      !Object.values(ExportFormat).includes(format) ||
      !Object.values(ExportCadence).includes(cadence)
    ) {
      throw new BadRequestException('Unsupported export format or cadence');
    }
    const player = await this.playerRepo.findOne({
      where: { id: playerId, isActive: true },
    });
    if (!player) throw new NotFoundException('Player not found');
    this.encryptionSecret();
    this.smtpOptions();
    const schedule = this.scheduleRepo.create({
      playerId,
      format,
      cadence,
      enabled: true,
      nextRunAt: this.nextRunAt(cadence),
    });
    return this.scheduleRepo.save(schedule);
  }

  listSchedules(playerId: string): Promise<PlayerExportSchedule[]> {
    return this.scheduleRepo.find({
      where: { playerId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteSchedule(playerId: string, scheduleId: string): Promise<void> {
    const result = await this.scheduleRepo.delete({ id: scheduleId, playerId });
    if (!result.affected)
      throw new NotFoundException('Export schedule not found');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledExports(): Promise<void> {
    const now = new Date();
    const dueSchedules = await this.scheduleRepo.find({
      where: { enabled: true, nextRunAt: LessThanOrEqual(now) },
    });
    for (const schedule of dueSchedules) {
      const nextRunAt = this.nextRunAt(schedule.cadence);
      const claim = await this.scheduleRepo.update(
        { id: schedule.id, enabled: true, nextRunAt: LessThanOrEqual(now) },
        { nextRunAt },
      );
      if (!claim.affected) continue;
      try {
        const player = await this.playerRepo.findOne({
          where: { id: schedule.playerId },
        });
        if (!player || !player.isActive) {
          await this.scheduleRepo.update(schedule.id, { enabled: false });
          continue;
        }
        await this.sendExportEmail(schedule.playerId, schedule.format);
      } catch (error) {
        this.logger.error(
          `Scheduled export ${schedule.id} failed`,
          error instanceof Error ? error.stack : undefined,
        );
        await this.scheduleRepo.update(schedule.id, {
          nextRunAt: new Date(Date.now() + 60_000),
        });
      }
    }
  }

  private async render(
    data: PlayerDataExport,
    format: ExportFormat,
  ): Promise<Buffer> {
    if (format === ExportFormat.JSON)
      return Buffer.from(JSON.stringify(data, null, 2));
    if (format === ExportFormat.CSV) return Buffer.from(this.toCsv(data));
    return this.toPdf(data);
  }

  private toCsv(data: PlayerDataExport): string {
    const rows: string[][] = [['section', 'record_id', 'field', 'value']];
    const append = (
      section: string,
      recordId: string,
      record: Record<string, unknown>,
    ) => {
      for (const [field, value] of Object.entries(record)) {
        rows.push([
          section,
          recordId,
          field,
          value === null
            ? ''
            : value instanceof Date
              ? value.toISOString()
              : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value),
        ]);
      }
    };
    append('export', '', {
      schemaVersion: data.schemaVersion,
      exportedAt: data.exportedAt,
    });
    append('player', data.player.id, data.player);
    if (data.profile)
      append('profile', String(data.profile.id || ''), data.profile);
    data.progress.forEach((entry) =>
      append('progress', String(entry.id || ''), entry),
    );
    return rows
      .map((row) =>
        row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','),
      )
      .join('\r\n');
  }

  private toPdf(data: PlayerDataExport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.fontSize(20).text('Player Data Export');
      document.moveDown(0.5).fontSize(9).text(`Exported: ${data.exportedAt}`);
      document.moveDown().fontSize(14).text('Player');
      document.fontSize(8).text(JSON.stringify(data.player, null, 2));
      document.moveDown().fontSize(14).text('Profile');
      document
        .fontSize(8)
        .text(
          data.profile ? JSON.stringify(data.profile, null, 2) : 'No profile',
        );
      document
        .moveDown()
        .fontSize(14)
        .text(`Progress (${data.progress.length} records)`);
      document
        .fontSize(8)
        .text(
          data.progress.length
            ? JSON.stringify(data.progress, null, 2)
            : 'No progress records',
        );
      document.end();
    });
  }

  private pickFields(
    source: object,
    fields: string[],
  ): Record<string, unknown> {
    const value = source as Record<string, unknown>;
    return Object.fromEntries(
      fields
        .filter((field) => field in value)
        .map((field) => [field, value[field]]),
    );
  }

  private checkKeys(
    value: Record<string, unknown>,
    allowed: string[],
    path: string,
    errors: string[],
  ): void {
    const unexpected = Object.keys(value).filter(
      (key) => !allowed.includes(key),
    );
    if (unexpected.length)
      errors.push(
        `${path} contains unsupported fields: ${unexpected.join(', ')}`,
      );
    for (const key of allowed) {
      if (!(key in value)) errors.push(`${path}.${key} is required`);
    }
  }

  private isRecord(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isDate(value: unknown): boolean {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }

  private encryptionSecret(): string {
    const secret = this.config.get<string>('EXPORT_ENCRYPTION_KEY');
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new ServiceUnavailableException(
        'EXPORT_ENCRYPTION_KEY must contain at least 32 bytes',
      );
    }
    return secret;
  }

  private smtpOptions() {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException(
        'SMTP_HOST and a valid SMTP_PORT are required for email delivery',
      );
    }
    this.emailSender();
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');
    return {
      host,
      port,
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      ...(user && password ? { auth: { user, pass: password } } : {}),
    };
  }

  private emailSender(): string {
    const sender =
      this.config.get<string>('EXPORT_EMAIL_FROM') ||
      this.config.get<string>('SMTP_USER');
    if (!sender) {
      throw new ServiceUnavailableException(
        'EXPORT_EMAIL_FROM or SMTP_USER is required for email delivery',
      );
    }
    return sender;
  }

  private nextRunAt(cadence: ExportCadence): Date {
    const next = new Date();
    next.setUTCDate(
      next.getUTCDate() + (cadence === ExportCadence.DAILY ? 1 : 7),
    );
    return next;
  }
}
