# TODO

## Completed
- [x] Server-authoritative chess rules (chess.js)
- [x] Multi-game architecture (engine per game via `src/games/` factory)
- [x] Tic-Tac-Toe (X/O, win/draw detection, clocks, resign, draw offer, rematch)
- [x] Room create / join / reconnect with hashed tokens
- [x] Spectators (2 max)
- [x] Castling / en passant / promotion / checkmate / stalemate
- [x] Increment-based time controls (3, 5, 10, unlimited)
- [x] Draw offers, resign, rematch (both-vote)
- [x] Quick Chat (preset messages, server-validated, rate limited)
- [x] Idempotent moves via `requestId`
- [x] WebSocket state sync with version field
- [x] Rate limiting, payload validation, input normalization
- [x] Automated tests
- [x] Dark/Light mode with View Transitions API (Ripple effect)
- [x] Smooth piece sliding animations
- [x] Real-time sound effects (Web Audio API)
- [x] Sound toggle button (mute/unmute)
- [x] Smart Paste & Clear buttons for room codes
- [x] Installable PWA (manifest + service worker)
- [x] Connect Four
- [x] Play vs bot
- [x] Fix Tic-Tac-Toe clocks, bot promotion, abandonment broadcast, service worker caching

## Future Work

### Quality
- [ ] Add tests for `gameHandlers` (move parsing, chat, rematch) and the bot
- [ ] Pin the `js-chess-engine` version (currently `^1.0.2`)

### Gameplay
- [ ] Highlight the winning line in Tic-Tac-Toe
- [ ] Per-game default time control (10 min is long for Tic-Tac-Toe)
- [ ] More games on top of the engine interface
- [ ] Premove support (chess)
- [ ] PGN import
- [ ] Elo / ratings

### Infrastructure
- [ ] Persistent storage (Redis / Postgres)
- [ ] Multi-instance deployment support
