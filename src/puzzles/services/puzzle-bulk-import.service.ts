import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as yaml from 'js-yaml';
import { Puzzle } from '../entities/puzzle.entity';
import {
  PuzzleImportHistory,
  ImportStatus,
} from '../entities/puzzle-import-history.entity';
import {
  BulkImportPuzzlesDto,
  PuzzleBulkImportReport,
  PuzzleImportFormat,
  PuzzleImportRowError,
} from '../dto/puzzle-bulk-import.dto';
import { AdminAuditLogService } from '../../admin/services/admin-audit-log.service';

export interface ParsedPuzzleRecord {
  title: string;
  description: string;
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  difficultyRating?: number;
  basePoints?: number;
  timeLimit?: number;
  maxHints?: number;
  content: {
    type?: string;
    question: string;
    options?: string[];
    correctAnswer: any;
    explanation?: string;
    media?: any;
  };
  hints?: any[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

@Injectable()
export class PuzzleBulkImportService {
  private readonly logger = new Logger(PuzzleBulkImportService.name);

  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleImportHistory)
    private readonly importHistoryRepository: Repository<PuzzleImportHistory>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly auditLogService?: AdminAuditLogService,
  ) {}

  /**
   * Main import method accepting an uploaded file or body payload
   */
  async importFromFile(
    file: { buffer?: Buffer; originalname?: string; mimetype?: string } | undefined,
    dto: BulkImportPuzzlesDto,
    adminId: string,
    dryRun: boolean = false,
  ): Promise<PuzzleBulkImportReport> {
    let filename = file?.originalname || 'import_payload';
    let rawContent = '';
    let format = dto.format || PuzzleImportFormat.JSON;

    if (file && file.buffer) {
      rawContent = file.buffer.toString('utf-8');
      filename = file.originalname || 'uploaded_file';
      if (filename.endsWith('.csv')) {
        format = PuzzleImportFormat.CSV;
      } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        format = PuzzleImportFormat.YAML;
      } else if (filename.endsWith('.json')) {
        format = PuzzleImportFormat.JSON;
      }
    } else if (dto.fileContent) {
      rawContent = dto.fileContent;
    } else if (dto.data) {
      rawContent = typeof dto.data === 'string' ? dto.data : JSON.stringify(dto.data);
    } else {
      throw new BadRequestException(
        'No file or data provided for puzzle import',
      );
    }

    // Parse records from raw content
    const parsedItems = this.parseContent(rawContent, format);

    if (!parsedItems || parsedItems.length === 0) {
      throw new BadRequestException('Import file contains no records to process');
    }

    // Validate each record and record row errors
    const errors: PuzzleImportRowError[] = [];
    const validRecords: { row: number; data: ParsedPuzzleRecord }[] = [];

    parsedItems.forEach((item, index) => {
      // 1-based row number. For CSV, row 1 is header so data starts at row 2.
      const row = format === PuzzleImportFormat.CSV ? index + 2 : index + 1;
      const recordErrors = this.validateRecord(item);

      if (recordErrors.length > 0) {
        errors.push({
          row,
          title: item?.title || undefined,
          errors: recordErrors,
        });
      } else {
        validRecords.push({ row, data: this.sanitizeRecord(item) });
      }
    });

    const totalRecords = parsedItems.length;
    const validCount = validRecords.length;
    const invalidCount = errors.length;

    let status: 'success' | 'failed' | 'partial';
    if (invalidCount === 0) {
      status = 'success';
    } else if (validCount > 0) {
      status = 'partial';
    } else {
      status = 'failed';
    }

    let importedPuzzles: Array<{ id: string; title: string }> = [];

    // Dry Run mode: changes nothing in the puzzles table
    if (dryRun) {
      this.logger.log(
        `Dry run completed for ${filename}: ${validCount}/${totalRecords} valid`,
      );

      const history = this.importHistoryRepository.create({
        adminId,
        filename,
        format,
        totalRecords,
        importedCount: 0,
        failedCount: invalidCount,
        isDryRun: true,
        status: status as ImportStatus,
        report: {
          dryRun: true,
          totalRecords,
          validCount,
          invalidCount,
          errors,
        },
      });
      const savedHistory = await this.importHistoryRepository.save(history);

      return {
        dryRun: true,
        filename,
        totalRecords,
        validCount,
        invalidCount,
        status,
        errors,
        importHistoryId: savedHistory.id,
      };
    }

    // Actual Import: Commit valid records in a transaction
    if (validRecords.length > 0) {
      importedPuzzles = await this.dataSource.transaction(async (manager) => {
        const savedList: Array<{ id: string; title: string }> = [];
        for (const item of validRecords) {
          const puzzleEntity = manager.create(Puzzle, {
            title: item.data.title,
            description: item.data.description,
            category: item.data.category,
            difficulty: item.data.difficulty || 'medium',
            difficultyRating: item.data.difficultyRating || 1,
            basePoints: item.data.basePoints ?? 100,
            timeLimit: item.data.timeLimit ?? 300,
            maxHints: item.data.maxHints ?? 3,
            content: item.data.content as any,
            hints: item.data.hints || [],
            tags: item.data.tags || [],
            isActive: item.data.isActive ?? true,
            isFeatured: item.data.isFeatured ?? false,
            createdBy: adminId,
          });

          const saved = await manager.save(Puzzle, puzzleEntity);
          savedList.push({ id: saved.id, title: saved.title });
        }
        return savedList;
      });
    }

    // Record import history log
    const history = this.importHistoryRepository.create({
      adminId,
      filename,
      format,
      totalRecords,
      importedCount: importedPuzzles.length,
      failedCount: invalidCount,
      isDryRun: false,
      status: status as ImportStatus,
      report: {
        dryRun: false,
        totalRecords,
        validCount: importedPuzzles.length,
        invalidCount,
        errors,
        importedIds: importedPuzzles.map((p) => p.id),
      },
    });
    const savedHistory = await this.importHistoryRepository.save(history);

    if (this.auditLogService) {
      await this.auditLogService.log({
        adminId,
        action: 'BULK_IMPORT_PUZZLES',
        targetType: 'PUZZLE',
        details: {
          filename,
          totalRecords,
          importedCount: importedPuzzles.length,
          failedCount: invalidCount,
          historyId: savedHistory.id,
        },
      });
    }

    return {
      dryRun: false,
      filename,
      totalRecords,
      validCount: importedPuzzles.length,
      invalidCount,
      status,
      errors,
      importedPuzzles,
      importHistoryId: savedHistory.id,
    };
  }

  /**
   * Parse structured content by format
   */
  parseContent(content: string, format: PuzzleImportFormat): any[] {
    try {
      if (format === PuzzleImportFormat.CSV) {
        return this.parseCSV(content);
      } else if (format === PuzzleImportFormat.YAML) {
        const parsed = yaml.load(content);
        return Array.isArray(parsed) ? parsed : (parsed as any)?.puzzles || [parsed];
      } else {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed && Array.isArray(parsed.puzzles)) {
          return parsed.puzzles;
        } else {
          return [parsed];
        }
      }
    } catch (err) {
      throw new BadRequestException(
        `Failed to parse import file as ${format}: ${err.message}`,
      );
    }
  }

  /**
   * Simple and robust CSV line parser supporting quoted fields with commas
   */
  private parseCSV(csvText: string): any[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header and at least one data row');
    }

    const headers = this.parseCSVLine(lines[0]).map((h) => h.trim());
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record: Record<string, any> = {};

      headers.forEach((header, colIndex) => {
        let val: any =
          values[colIndex] !== undefined ? values[colIndex].trim() : '';
        // Parse nested JSON if applicable
        if (
          (header === 'content' || header === 'hints' || header === 'tags') &&
          val.startsWith('{') && val.endsWith('}')
        ) {
          try {
            val = JSON.parse(val);
          } catch {}
        } else if (
          (header === 'hints' || header === 'tags') &&
          val.startsWith('[') && val.endsWith(']')
        ) {
          try {
            val = JSON.parse(val);
          } catch {}
        } else if (header === 'tags' && typeof val === 'string' && val.includes(',')) {
          val = val.split(',').map((t) => t.trim()).filter(Boolean);
        } else if (
          header === 'basePoints' ||
          header === 'timeLimit' ||
          header === 'maxHints' ||
          header === 'difficultyRating'
        ) {
          if (val !== '') {
            const num = Number(val);
            if (!isNaN(num)) val = num as any;
          }
        } else if (header === 'isActive' || header === 'isFeatured') {
          if (val.toLowerCase() === 'true') val = true as any;
          if (val.toLowerCase() === 'false') val = false as any;
        }
        record[header] = val;
      });

      records.push(record);
    }

    return records;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  /**
   * Validate a single puzzle import record
   */
  validateRecord(item: any): string[] {
    const errors: string[] = [];

    if (!item || typeof item !== 'object') {
      errors.push('Record is not a valid object');
      return errors;
    }

    // Title validation
    if (!item.title || typeof item.title !== 'string' || item.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters long');
    } else if (item.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }

    // Description validation
    if (
      !item.description ||
      typeof item.description !== 'string' ||
      item.description.trim().length < 10
    ) {
      errors.push('Description is required and must be at least 10 characters long');
    }

    // Category validation
    if (!item.category || typeof item.category !== 'string' || item.category.trim().length === 0) {
      errors.push('Category is required');
    }

    // Difficulty validation
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    if (item.difficulty && !validDifficulties.includes(String(item.difficulty).toLowerCase())) {
      errors.push(
        `Invalid difficulty '${item.difficulty}'. Allowed values: easy, medium, hard, expert`,
      );
    }

    // Numerical checks
    if (item.basePoints !== undefined && item.basePoints !== '') {
      const pts = Number(item.basePoints);
      if (isNaN(pts) || pts < 0) {
        errors.push('basePoints must be a non-negative number');
      }
    }

    if (item.timeLimit !== undefined && item.timeLimit !== '') {
      const tl = Number(item.timeLimit);
      if (isNaN(tl) || tl < 10) {
        errors.push('timeLimit must be a number of at least 10 seconds');
      }
    }

    if (item.maxHints !== undefined && item.maxHints !== '') {
      const mh = Number(item.maxHints);
      if (isNaN(mh) || mh < 0) {
        errors.push('maxHints must be a non-negative number');
      }
    }

    // Content validation
    let contentObj = item.content;
    if (typeof contentObj === 'string') {
      try {
        contentObj = JSON.parse(contentObj);
      } catch {
        errors.push('Content must be a valid JSON object');
      }
    }

    if (!contentObj || typeof contentObj !== 'object') {
      errors.push('Content configuration is required');
    } else {
      if (!contentObj.question || String(contentObj.question).trim().length < 5) {
        errors.push('Content must include a valid question of at least 5 characters');
      }
      if (contentObj.correctAnswer === undefined || contentObj.correctAnswer === null || contentObj.correctAnswer === '') {
        errors.push('Content must include a correctAnswer');
      }
    }

    // Hints validation
    if (item.hints) {
      let hintsArr = item.hints;
      if (typeof hintsArr === 'string') {
        try {
          hintsArr = JSON.parse(hintsArr);
        } catch {
          errors.push('Hints must be a valid JSON array');
        }
      }
      if (Array.isArray(hintsArr)) {
        const maxAllowed = item.maxHints !== undefined ? Number(item.maxHints) : 3;
        if (hintsArr.length > maxAllowed) {
          errors.push(`Number of hints (${hintsArr.length}) exceeds maxHints (${maxAllowed})`);
        }
      }
    }

    return errors;
  }

  /**
   * Sanitize record with appropriate defaults
   */
  private sanitizeRecord(item: any): ParsedPuzzleRecord {
    let content = item.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = { question: content, correctAnswer: '' };
      }
    }

    let hints = item.hints;
    if (typeof hints === 'string') {
      try {
        hints = JSON.parse(hints);
      } catch {
        hints = [];
      }
    }

    let tags = item.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const difficulty = (
      item.difficulty ? String(item.difficulty).toLowerCase() : 'medium'
    ) as 'easy' | 'medium' | 'hard' | 'expert';

    return {
      title: String(item.title).trim(),
      description: String(item.description).trim(),
      category: String(item.category).trim(),
      difficulty,
      difficultyRating: item.difficultyRating ? Number(item.difficultyRating) : 1,
      basePoints: item.basePoints !== undefined ? Number(item.basePoints) : 100,
      timeLimit: item.timeLimit !== undefined ? Number(item.timeLimit) : 300,
      maxHints: item.maxHints !== undefined ? Number(item.maxHints) : 3,
      content,
      hints: Array.isArray(hints) ? hints : [],
      tags: Array.isArray(tags) ? tags : [],
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
      isFeatured: item.isFeatured !== undefined ? Boolean(item.isFeatured) : false,
    };
  }

  /**
   * Get paginated import history
   */
  async getImportHistory(
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ history: PuzzleImportHistory[]; total: number }> {
    const [history, total] = await this.importHistoryRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { history, total };
  }

  /**
   * Get import history by ID
   */
  async getImportHistoryById(id: string): Promise<PuzzleImportHistory> {
    const record = await this.importHistoryRepository.findOne({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException(`Import history ${id} not found`);
    }
    return record;
  }
}
