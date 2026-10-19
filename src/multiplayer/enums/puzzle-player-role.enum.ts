/**
 * Co-operative roles inside a puzzle session.
 *
 * - LEADER: can start/complete the session and assign roles.
 * - CONTRIBUTOR: can submit solutions and chat (the default role).
 * - OBSERVER: read-only participant; can chat but cannot submit solutions.
 */
export enum PuzzlePlayerRole {
  LEADER = 'LEADER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  OBSERVER = 'OBSERVER',
}
