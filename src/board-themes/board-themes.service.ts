import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardTheme, BoardThemeAssets } from './entities/board-theme.entity';
import { PlayerBoardThemeSelection } from './entities/player-board-theme-selection.entity';
import { PlayerBoardThemeUnlock } from './entities/player-board-theme-unlock.entity';
import {
  BoardThemeView,
  CreateBoardThemeDto,
  PlayerBoardThemeView,
  UpdateBoardThemeDto,
} from './dto/board-themes.dto';

const ASSET_URL_KEYS = ['boardImageUrl', 'pieceSetUrl', 'previewUrl'] as const;

/**
 * Appends the asset version to a URL (`?v=3`) so browsers and CDNs fetch the
 * new file after a theme's assets change.
 */
export function withAssetVersion(url: string, version: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

/** True when the two asset objects describe different files or colours. */
export function assetsChanged(
  current: BoardThemeAssets,
  next: BoardThemeAssets,
): boolean {
  return JSON.stringify(current ?? {}) !== JSON.stringify(next ?? {});
}

@Injectable()
export class BoardThemesService {
  constructor(
    @InjectRepository(BoardTheme)
    private readonly themeRepo: Repository<BoardTheme>,

    @InjectRepository(PlayerBoardThemeUnlock)
    private readonly unlockRepo: Repository<PlayerBoardThemeUnlock>,

    @InjectRepository(PlayerBoardThemeSelection)
    private readonly selectionRepo: Repository<PlayerBoardThemeSelection>,
  ) {}

  // ─── Catalog management ───────────────────────────────────────────────────

  async createTheme(dto: CreateBoardThemeDto): Promise<BoardTheme> {
    const existing = await this.themeRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        `Board theme with slug "${dto.slug}" already exists`,
      );
    }

    const theme = this.themeRepo.create({
      slug: dto.slug,
      name: dto.name,
      description: dto.description ?? null,
      isFree: dto.isFree ?? false,
      isActive: dto.isActive ?? true,
      unlockHint: dto.unlockHint ?? null,
      assets: { ...dto.assets },
      assetVersion: 1,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.themeRepo.save(theme);
  }

  async updateTheme(
    themeId: string,
    dto: UpdateBoardThemeDto,
  ): Promise<BoardTheme> {
    const theme = await this.findThemeOrThrow(themeId);

    if (dto.name !== undefined) theme.name = dto.name;
    if (dto.description !== undefined) theme.description = dto.description;
    if (dto.isFree !== undefined) theme.isFree = dto.isFree;
    if (dto.isActive !== undefined) theme.isActive = dto.isActive;
    if (dto.unlockHint !== undefined) theme.unlockHint = dto.unlockHint;
    if (dto.sortOrder !== undefined) theme.sortOrder = dto.sortOrder;

    if (dto.assets !== undefined && assetsChanged(theme.assets, dto.assets)) {
      theme.assets = { ...dto.assets };
      theme.assetVersion += 1;
    }

    return this.themeRepo.save(theme);
  }

  async findThemeOrThrow(themeId: string): Promise<BoardTheme> {
    const theme = await this.themeRepo.findOne({ where: { id: themeId } });
    if (!theme) {
      throw new NotFoundException(`Board theme "${themeId}" not found`);
    }
    return theme;
  }

  // ─── Catalog reads ────────────────────────────────────────────────────────

  /** Lists every active theme with its metadata, free themes first. */
  async listThemes(): Promise<BoardThemeView[]> {
    const themes = await this.findActiveThemes();
    return themes.map((t) => this.toView(t));
  }

  async getTheme(themeId: string): Promise<BoardThemeView> {
    const theme = await this.findThemeOrThrow(themeId);
    if (!theme.isActive) {
      throw new NotFoundException(`Board theme "${themeId}" not found`);
    }
    return this.toView(theme);
  }

  /** Lists active themes with the player's owned / locked / selected flags. */
  async listThemesForPlayer(userId: string): Promise<PlayerBoardThemeView[]> {
    const [themes, unlocks, selected] = await Promise.all([
      this.findActiveThemes(),
      this.unlockRepo.find({ where: { userId } }),
      this.getSelectedTheme(userId),
    ]);
    const ownedIds = new Set(unlocks.map((u) => u.themeId));

    return themes.map((theme) => {
      const owned = theme.isFree || ownedIds.has(theme.id);
      return {
        ...this.toView(theme),
        owned,
        locked: !owned,
        selected: selected?.id === theme.id,
      };
    });
  }

  // ─── Ownership ────────────────────────────────────────────────────────────

  /**
   * Gives a player a locked theme. Safe to call more than once: a second
   * grant returns the existing unlock instead of creating a duplicate.
   */
  async grantTheme(
    userId: string,
    themeId: string,
    source = 'grant',
  ): Promise<PlayerBoardThemeUnlock> {
    await this.findThemeOrThrow(themeId);

    const existing = await this.unlockRepo.findOne({
      where: { userId, themeId },
    });
    if (existing) return existing;

    return this.unlockRepo.save(
      this.unlockRepo.create({ userId, themeId, source }),
    );
  }

  async ownsTheme(userId: string, theme: BoardTheme): Promise<boolean> {
    if (theme.isFree) return true;
    const count = await this.unlockRepo.count({
      where: { userId, themeId: theme.id },
    });
    return count > 0;
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  /** Saves the player's chosen theme. Locked themes must be owned first. */
  async selectTheme(userId: string, themeId: string): Promise<BoardThemeView> {
    const theme = await this.findThemeOrThrow(themeId);
    if (!theme.isActive) {
      throw new NotFoundException(`Board theme "${themeId}" not found`);
    }
    if (!(await this.ownsTheme(userId, theme))) {
      throw new ForbiddenException(
        `Board theme "${theme.slug}" is locked for this player`,
      );
    }

    await this.selectionRepo.save(
      this.selectionRepo.create({ userId, themeId: theme.id }),
    );
    return this.toView(theme);
  }

  /**
   * Returns the player's selected theme. Falls back to the default free
   * theme when nothing is selected, or when the selected theme was disabled
   * or is no longer owned.
   */
  async getSelectedTheme(userId: string): Promise<BoardThemeView | null> {
    const selection = await this.selectionRepo.findOne({ where: { userId } });

    if (selection) {
      const theme = await this.themeRepo.findOne({
        where: { id: selection.themeId },
      });
      if (theme?.isActive && (await this.ownsTheme(userId, theme))) {
        return this.toView(theme);
      }
    }

    const fallback = await this.themeRepo.findOne({
      where: { isActive: true, isFree: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return fallback ? this.toView(fallback) : null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private findActiveThemes(): Promise<BoardTheme[]> {
    return this.themeRepo.find({
      where: { isActive: true },
      order: { isFree: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  toView(theme: BoardTheme): BoardThemeView {
    const assets: Record<string, unknown> = { ...(theme.assets ?? {}) };
    for (const key of ASSET_URL_KEYS) {
      const url = assets[key];
      if (typeof url === 'string' && url.length > 0) {
        assets[key] = withAssetVersion(url, theme.assetVersion);
      }
    }

    return {
      id: theme.id,
      slug: theme.slug,
      name: theme.name,
      description: theme.description,
      isFree: theme.isFree,
      unlockHint: theme.unlockHint,
      assets,
      assetVersion: theme.assetVersion,
      sortOrder: theme.sortOrder,
    };
  }
}
