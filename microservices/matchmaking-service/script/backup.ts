import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config();

const execAsync = promisify(exec);

interface BackupOptions {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupPath: string;
  retentionDays: number;
}

class DatabaseBackup {
  private options: BackupOptions;

  constructor() {
    this.options = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'myapp',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      backupPath: process.env.BACKUP_PATH || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    };
  }

  public async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.options.database}_${timestamp}.sql`;
    const filepath = path.join(this.options.backupPath, filename);

    // Ensure backup directory exists
    if (!fs.existsSync(this.options.backupPath)) {
      fs.mkdirSync(this.options.backupPath, { recursive: true });
    }

    const command = `PGPASSWORD="${this.options.password}" pg_dump -h ${this.options.host} -p ${this.options.port} -U ${this.options.username} -d ${this.options.database} -f ${filepath} --verbose --clean --no-owner --no-privileges`;

    try {
      console.log(`Creating backup: ${filename}`);
      await execAsync(command);
      console.log(`Backup created successfully: ${filepath}`);

      // Cleanup old backups
      await this.cleanupOldBackups();

      return filepath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  public async restoreBackup(backupFile: string): Promise<void> {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const command = `PGPASSWORD="${this.options.password}" psql -h ${this.options.host} -p ${this.options.port} -U ${this.options.username} -d ${this.options.database} -f ${backupFile}`;

    try {
      console.log(`Restoring backup: ${backupFile}`);
      await execAsync(command);
      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.options.backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);

      for (const file of files) {
        if (file.endsWith('.sql')) {
          const filepath = path.join(this.options.backupPath, file);
          const stats = fs.statSync(filepath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filepath);
            console.log(`Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  public async listBackups(): Promise<string[]> {
    if (!fs.existsSync(this.options.backupPath)) {
      return [];
    }

    const files = fs.readdirSync(this.options.backupPath);
    return files
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .reverse();
  }
}
