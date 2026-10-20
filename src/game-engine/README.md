# Game Engine

The game engine owns the puzzle lifecycle: creating a puzzle, accepting moves,
scoring the result and handing the state back to the player.

## Undo / redo and move history

Every puzzle session keeps an ordered **move history**: the moves the player
made, the state before and after each of them, and any undo/redo actions in
between. The history is the single source of truth for three things:

- **Undo / redo** — restoring the exact state that preceded a move.
- **Replays** — the history converts into replay actions, so a replay shows
  exactly what the player did, including their undos.
- **Analytics** — move counts, undo counts and the penalties they incurred.

### How undo and redo work

The history is a list of state snapshots with a cursor into it:

- a new move truncates anything ahead of the cursor (the redo branch is gone),
- **undo** moves the cursor back one step and returns that state,
- **redo** moves the cursor forward one step and returns that state.

Because the snapshot is returned as-is, undo and redo restore the *exact*
prior state rather than replaying moves and hoping for the same result.

### Rules

Two rules are enforced by `MoveHistoryService`:

**Undo depth is limited per puzzle type.** Complex puzzles keep a shallower
history because their state snapshots are large.

| Puzzle type     | Undo depth |
| --------------- | ---------- |
| `logic_grid`    | 5          |
| `sequence`      | 5          |
| `spatial`       | 8          |
| `mathematical`  | 10         |
| `pattern_matching` | 15      |
| `word_puzzle`   | 20         |
| `custom`        | 10         |

**Ranked modes do not get a free undo.** Competitive modes either disable
undo outright or charge a score penalty for it:

| Mode        | Undo                     |
| ----------- | ------------------------ |
| `practice`  | allowed, free            |
| `zen`       | allowed, free            |
| `challenge` | allowed, penalised       |
| `timed`     | allowed, penalised       |
| `ranked`    | **disabled**             |

The penalty is a ratio of the base score, applied by `ScoringService` in the
same way the hint penalty is, and is reported back on the undo/redo response.

The mode and the puzzle type are fixed when the puzzle is created and cannot
be changed afterwards, so a client cannot downgrade a ranked session to get a
free undo.

### Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `POST` | `/puzzles/:puzzleId/player/:playerId/undo` | Undo the last move |
| `POST` | `/puzzles/:puzzleId/player/:playerId/redo` | Redo the last undone move |
| `GET`  | `/puzzles/:puzzleId/player/:playerId/move-history` | The ordered move history |

The undo and redo endpoints accept an optional `replayId`. When it is given,
the action is mirrored onto that replay so the replay records the undo as
well. The move history endpoint accepts `includeReplayActions=true` to return
the history converted into replay actions, ready to be imported into the
replay system.

### Configuration

All values are environment driven (see `.env.example`):

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `GAME_UNDO_ENABLED` | `true` | Master switch for undo |
| `GAME_MAX_UNDO_DEPTH` | `10` | Undo depth for types without an explicit limit |
| `GAME_MAX_UNDO_DEPTH_LOGIC_GRID` | `5` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_SEQUENCE` | `5` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_SPATIAL` | `8` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_MATHEMATICAL` | `10` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_PATTERN_MATCHING` | `15` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_WORD_PUZZLE` | `20` | Per-type undo depth |
| `GAME_MAX_UNDO_DEPTH_CUSTOM` | `10` | Per-type undo depth |
| `GAME_UNDO_PENALTY` | `0.05` | Score penalty ratio per undo in a penalised mode |
| `GAME_REDO_PENALTY` | `0.02` | Score penalty ratio per redo in a penalised mode |
