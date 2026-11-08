# Dots & Boxes

Responsive Dots & Boxes with computer opponents and online rooms for 2–4 players.

Each board shows its total boxes and guaranteed win target (more than half). Once a player cannot be caught, a WIN badge appears while the remaining boxes stay playable. Completed boards use inline results and Play again/Main menu controls; timeout and opponent-leave explanations still use dialogs.

Live site: https://dotgame.web.app/

Source repository: https://github.com/tanvirbadhon/dot_game

## Build and preview

Requires Node.js 24 or newer.

```powershell
node build-firebase.mjs
cd dots-and-boxes
node dev.mjs
```

Open http://127.0.0.1:5173. The generated root `index.html` supports standalone computer play; `firebase-public/` is the Firebase deployment output.

## Publish

```powershell
node build-firebase.mjs
npx firebase-tools login
npx firebase-tools deploy --only hosting --project dotgame-30a10
```

Deployment requires access to the owner's Firebase project. Firebase serves the frontend; the configured Sites/Cloudflare Worker API and D1 database power online rooms. Forks need their own backend configuration and allowed origins for independent multiplayer hosting.

## Files

- `dots-and-boxes/client/`: interface, game interactions, sound and graphics.
- `dots-and-boxes/worker/`: rules, AI and multiplayer API.
- `dots-and-boxes/drizzle/`: SQL migration.
- `dots-and-boxes/test-*`: automated checks; run from that directory.
- `assets/`: browser and iPhone icons.
- `firebase.json`, `.firebaserc`: public Hosting configuration, not credentials.
- `process.txt`: short technology and implementation summary.

Generated builds, caches, logs and local secrets are excluded by `.gitignore`. Never commit Firebase tokens, service-account files or `.env` secrets.

After verifying a game update, commit and push the current source to this repository as well as publishing it. The game directory is stored as ordinary source files, so cloning or downloading the repository includes the complete project. Its separate local Sites Git metadata is not part of the GitHub upload.

Run `node stage-source.mjs` before committing to stage the game source correctly when a local Sites checkout is present. Stage changed root files normally, review the staged diff, then commit and push to `origin main`.
