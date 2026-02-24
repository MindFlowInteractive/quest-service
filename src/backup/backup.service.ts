import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  @Cron('0 * * * *') // hourly
  async hourlyBackup() {
    await this.runBackup('hourly');
  }

  @Cron('0 0 * * *') // daily
  async dailyBackup() {
    await this.runBackup('daily');
  }

  private async runBackup(type: 'hourly' | 'daily') {
    const timestamp = new Date().toISOString();
    const file = `backup-${type}-${timestamp}.sql`;

    exec(`pg_dump mydb > ${file}`, async (err) => {
      if (err) {
        this.logger.error(`Backup failed: ${err.message}`);
        // trigger alert
        return;
      }

      // Encrypt backup
      const data = fs.readFileSync(file);
      const cipher = crypto.createCipher('aes-256-cbc', process.env.BACKUP_KEY!);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      fs.writeFileSync(`${file}.enc`, encrypted);

      this.logger.log(`Backup ${file} completed and encrypted`);
      // upload to cloud storage here
    });
  }
}
