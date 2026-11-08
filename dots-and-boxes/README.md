# Dots & Boxes

A mobile-friendly game for 2, 3, or 4 players. Play against Easy, Hard, or Expert computers, or join friends with a six-character room code. Board sizes: 3 × 2, 5 × 4, 8 × 6, and 11 × 9. Themes: Default, Classic, Dark, and Sunset.

Computer games are not saved. Online seat credentials are kept in this browser for up to 30 minutes to reconnect after refresh; explicit leaving clears them. Active matches show a leave warning; completed matches return directly home. Sound, volume, animation, and shadow preferences are remembered.

## Run locally

Use Node 24 or newer. Run `node build.mjs`, then `node dev.mjs`. Open http://127.0.0.1:5173. Local multiplayer uses an in-memory SQLite database that resets when the server stops.

The generated root `../index.html` also works with Live Server for computer play. Its online tab opens the hosted game.

## Verify

Run `node test-game.mjs`, `node test-ai.mjs`, `node test-ai-strategy.mjs`, `node test-sizes.mjs`, `node test-results.cjs`, and `node test-sound.cjs`.

## Publish

`node build.mjs` creates `dist/server/index.js`. The app requires a Cloudflare Worker with a D1 database bound as `DB`, initialized with `drizzle/0000_rooms.sql`. A static-only host cannot serve the multiplayer API. The existing Sites deployment is configured in `.openai/hosting.json`.

Source folders: `client/` contains the interface; `worker/` contains shared rules, computer strategy, and the multiplayer API; `drizzle/` contains database migrations. Room membership uses per-player tokens stored temporarily in the browser for reconnect; only token hashes are stored server-side.

Online rooms expire after 30 minutes without a successful game action (join, start, move, restart, rematch, or leave). Polling does not renew room lifetime. API traffic sweeps expired records at most once per minute; an expired room requested directly is deleted immediately. Without traffic, deletion waits for the next API request. Browser game data, reconnect credentials, and display/audio preferences also expire after 30 minutes. Browser cleanup runs while the page is open and on the next visit; a closed browser cannot run deletion timers.

Online turns allow 40 seconds plus a visible 20-second warning. At 60 seconds the server ends the match: the inactive player forfeits and all other players win. Each accepted move resets the turn timer; refreshing does not.

Mouse, finger and pen input select the nearest dot within its non-overlapping grid cell. Nearby clicks/taps and drag releases snap to dots on both PC and mobile. Only adjacent dots can connect.

The win target is floor(total boxes / 2) + 1: 100 boxes requires 51, and the 11 × 9 board requires 50 of 99. A player also secures victory when no opponent can catch their score with the remaining boxes. This shows a WIN badge without stopping play. Completed boards report results inline, with Play again and Main menu controls; forfeits keep their explanatory dialogs. Online guests continue listening for the host's next round.

Computer matches save locally after each state change and can be continued after refresh for 30 minutes without a move. Completed matches and explicitly abandoned computer matches delete their save. No computer-match state is sent to the database.
