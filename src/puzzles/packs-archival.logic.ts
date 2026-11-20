// Puzzle pack entitlements and automated archival policies. Closes #469, #473.
export interface PuzzlePack { id: string; puzzleIds: string[]; samplePuzzleIds: string[] }
export interface Entitlement { userId: string; packId: string; revoked: boolean }

// A puzzle is playable when it is a free sample or belongs to a pack the user owns (and was not refunded).
export function canAccessPuzzle(puzzleId: string, userId: string, packs: PuzzlePack[], entitlements: Entitlement[]): boolean {
  const owned = new Set(entitlements.filter((e) => e.userId === userId && !e.revoked).map((e) => e.packId));
  return packs.some((p) => p.samplePuzzleIds.includes(puzzleId) || (owned.has(p.id) && p.puzzleIds.includes(puzzleId)));
}

export function recordPurchase(entitlements: Entitlement[], userId: string, packId: string): Entitlement[] {
  const existing = entitlements.find((e) => e.userId === userId && e.packId === packId);
  if (existing && !existing.revoked) return entitlements; // Already owned: stored once.
  return [...entitlements.filter((e) => e !== existing), { userId, packId, revoked: false }];
}

export const refundPurchase = (entitlements: Entitlement[], userId: string, packId: string): Entitlement[] =>
  entitlements.map((e) => (e.userId === userId && e.packId === packId ? { ...e, revoked: true } : e));

export interface ArchivePolicy { inactiveDays?: number; minRating?: number; maxAgeDays?: number }
export interface ArchivablePuzzle { id: string; creatorId: string; createdAt: number; lastPlayedAt: number; rating: number; exempt?: boolean; archived?: boolean }

const DAY_MS = 86_400_000;

// Returns the puzzles a policy would archive; exempt and already archived puzzles are skipped.
export function evaluateArchival(puzzles: ArchivablePuzzle[], policy: ArchivePolicy, now = Date.now()): ArchivablePuzzle[] {
  return puzzles.filter((p) => {
    if (p.exempt || p.archived) return false;
    return (
      (policy.inactiveDays !== undefined && now - p.lastPlayedAt > policy.inactiveDays * DAY_MS) ||
      (policy.minRating !== undefined && p.rating < policy.minRating) ||
      (policy.maxAgeDays !== undefined && now - p.createdAt > policy.maxAgeDays * DAY_MS)
    );
  });
}

// Dry run only reports; apply marks the puzzles archived and returns creator notifications.
export function runArchival(puzzles: ArchivablePuzzle[], policy: ArchivePolicy, dryRun = true, now = Date.now()) {
  const affected = evaluateArchival(puzzles, policy, now);
  if (dryRun) return { puzzles, report: affected.map((p) => p.id), notifications: [] as { creatorId: string; puzzleId: string }[] };
  const ids = new Set(affected.map((p) => p.id));
  return {
    puzzles: puzzles.map((p) => (ids.has(p.id) ? { ...p, archived: true } : p)),
    report: [...ids],
    notifications: affected.map((p) => ({ creatorId: p.creatorId, puzzleId: p.id })),
  };
}
