# Live streaming and spectator mode

Backend for broadcasting a puzzle attempt with spectator chat, viewer tracking,
quality adaptation, moderation, recording and analytics. It is self-contained:
`LiveStreamingModule` wires its own TypeORM repositories and a Socket.IO gateway
under the `/streams` namespace, and is imported by `AppModule`.

## Model

| Entity | Purpose |
| --- | --- |
| `LiveStream` | The broadcast. Status (`scheduled` → `live` → `ended`/`cancelled`), cached viewer counts, recording state. |
| `StreamViewer` | One spectator's membership. Rows survive a leave (`isActive = false`) so viewership is analysable. |
| `StreamChatMessage` | Chat. Deletes are soft so the audit trail survives. |
| `StreamModerationAction` | Immutable moderator decisions; enforcement reads these rows. |

## REST

All routes take the caller's id in the `x-user-id` header. The service enforces
that only the host (or an assigned moderator) can manage a stream; wiring the
header to the JWT guard is a shell concern.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/live-streaming/streams` | Create |
| `GET` | `/live-streaming/streams` | List, optional `?status=` |
| `GET` | `/live-streaming/streams/:id` | Read |
| `POST` | `/live-streaming/streams/:id/start` \| `/end` \| `/cancel` | Host only |
| `POST` | `/live-streaming/streams/:id/viewers` | Join as spectator |
| `DELETE` | `/live-streaming/streams/:id/viewers/me` | Leave |
| `GET` | `/live-streaming/streams/:id/viewers/count` | Live count |
| `PATCH` | `/live-streaming/streams/:id/quality` | `{ bandwidthKbps }` |
| `POST` `GET` | `/live-streaming/streams/:id/chat` | Post / history |
| `POST` `GET` | `/live-streaming/streams/:id/moderation` | Moderate / log |
| `POST` | `/live-streaming/streams/:id/recording/start` \| `/stop` | Host only |
| `GET` | `/live-streaming/streams/:id/analytics` | Viewership + chat summary |

## WebSocket (`/streams`)

`stream:join`, `stream:leave`, `stream:chat`, `stream:quality`. Chat is broadcast
to the `stream:<id>` room; viewer counts are re-read from the roster so two
sockets cannot drift the number. A disconnect leaves the roster on behalf of the
socket's stored user id.

## Quality ladder

`qualityForBandwidth` is a pure, deterministic mapping: `< 1000` kbps → `low`,
`>= 1000` → `medium`, `>= 2500` → `high`, `>= 6000` → `source`; an unknown
bandwidth joins at `medium`.

## Migration

`1760000000000-CreateLiveStreamingTables` creates the four tables and their
indexes; `down` drops them in reverse.
