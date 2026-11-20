// Head-to-head friend challenges and weekly community goals. Closes #468, #470.
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';

export interface Challenge {
  id: string;
  challengerId: string;
  opponentId: string;
  puzzleSeed: string; // Locked at creation so both players get the same puzzle.
  status: ChallengeStatus;
  expiresAt: number;
  results: Record<string, { score: number; timeMs: number }>;
}

export function createChallenge(challengerId: string, opponentId: string, friendIds: string[], seed: string, ttlMs = 86_400_000): Challenge {
  if (!friendIds.includes(opponentId)) throw new Error('Challenges can only be sent to friends');
  return { id: `${challengerId}:${opponentId}:${Date.now()}`, challengerId, opponentId, puzzleSeed: seed, status: 'pending', expiresAt: Date.now() + ttlMs, results: {} };
}

// Unanswered challenges close automatically once past expiry.
export function refreshStatus(c: Challenge, now = Date.now()): Challenge {
  return c.status === 'pending' && now > c.expiresAt ? { ...c, status: 'expired' } : c;
}

export function respond(c: Challenge, userId: string, accept: boolean): Challenge {
  const current = refreshStatus(c);
  if (current.status !== 'pending' || userId !== c.opponentId) throw new Error('Cannot respond to this challenge');
  return { ...current, status: accept ? 'accepted' : 'declined' };
}

export function recordResult(c: Challenge, userId: string, score: number, timeMs: number): Challenge {
  if (c.status !== 'accepted' || ![c.challengerId, c.opponentId].includes(userId)) throw new Error('Challenge not active');
  const results = { ...c.results, [userId]: c.results[userId] ?? { score, timeMs } };
  return { ...c, results, status: Object.keys(results).length === 2 ? 'completed' : c.status };
}

// Higher score wins; ties are broken by the faster time; identical results are a draw (null).
export function winner(c: Challenge): string | null {
  const [a, b] = [c.results[c.challengerId], c.results[c.opponentId]];
  if (!a || !b) return null;
  if (a.score !== b.score) return a.score > b.score ? c.challengerId : c.opponentId;
  return a.timeMs === b.timeMs ? null : a.timeMs < b.timeMs ? c.challengerId : c.opponentId;
}

export interface CommunityGoal { week: string; target: number; progress: number; seen: Set<string>; rewardUnlocked: boolean }

// ISO-style week key, so the goal resets when the week changes.
export const weekKey = (d = new Date()) => `${d.getUTCFullYear()}-W${Math.ceil(((+d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7)}`;

export const newGoal = (target: number, now = new Date()): CommunityGoal => ({ week: weekKey(now), target, progress: 0, seen: new Set(), rewardUnlocked: false });

// Each action id counts once; synchronous updates avoid race conditions (use an atomic DB increment in production).
export function contribute(g: CommunityGoal, actionId: string, amount = 1, now = new Date()): CommunityGoal {
  const goal = g.week === weekKey(now) ? g : newGoal(g.target, now);
  if (goal.seen.has(actionId)) return goal;
  goal.seen.add(actionId);
  goal.progress += amount;
  goal.rewardUnlocked = goal.rewardUnlocked || goal.progress >= goal.target;
  return goal;
}

export const goalProgress = (g: CommunityGoal) => ({ week: g.week, progress: g.progress, target: g.target, percent: Math.min(100, Math.round((g.progress / g.target) * 100)), rewardUnlocked: g.rewardUnlocked });
