import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AntiCheatService } from '../services/anti-cheat.service';
import type { AntiCheatConfig } from '../config/anti-cheat.config';
import type { PuzzleMove } from '../../game-engine/types/puzzle.types';

/**
 * Guard that performs real-time anti-cheat validation on puzzle moves
 * Checks rate limiting, timestamp validity, and session integrity
 */
@Injectable()
export class AntiCheatGuard implements CanActivate {
  private readonly logger = new Logger(AntiCheatGuard.name);
  private readonly shadowMode: boolean;
  private readonly blockMoves: boolean;

  constructor(
    private readonly antiCheatService: AntiCheatService,
    private readonly configService: ConfigService
  ) {
    const config = this.configService.get<AntiCheatConfig>('antiCheat')!;
    this.shadowMode = config.shadowMode.enabled;
    this.blockMoves = config.shadowMode.blockMoves;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { playerId, puzzleId } = request.params;
    const move: PuzzleMove = request.body;

    // Skip if anti-cheat is not enabled
    const enabled = this.configService.get<boolean>('antiCheat.enabled');
    if (!enabled) {
      return true;
    }

    try {
      // Perform real-time checks
      const checks = await Promise.all([
        this.antiCheatService.checkRateLimit(playerId, puzzleId),
        Promise.resolve(this.antiCheatService.validateMoveTimestamp(move)),
        this.antiCheatService.checkSessionIntegrity(request.headers)
      ]);

      const failedChecks = checks.filter(check => !check.passed);

      if (failedChecks.length > 0) {
        this.logger.warn('Anti-cheat checks failed', {
          playerId,
          puzzleId,
          failures: failedChecks.map(c => c.reason)
        });

        // In shadow mode, log but don't block unless explicitly configured
        if (this.shadowMode && !this.blockMoves) {
          this.logger.warn('[SHADOW MODE] Would have blocked move but allowing due to shadow mode');
          return true;
        }

        // Block the move
        throw new BadRequestException({
          message: 'Move rejected due to suspicious activity',
          details: failedChecks.map(c => c.reason)
        });
      }

      return true;
    } catch (error: any) {
      // If it's our BadRequestException, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log unexpected errors but allow the request through
      this.logger.error(`Anti-cheat guard error: ${error.message}`, error.stack);
      return true;
    }
  }
}
