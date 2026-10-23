# Dots & Boxes

Responsive Dots & Boxes with computer opponents and online rooms for 2–4 players.

Live site: https://dotgame.web.app/

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
