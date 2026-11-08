# Dot Game project instructions

- The user's GitHub repository is `https://github.com/tanvirbadhon/dot_game` (root `origin`, branch `main`). After completing and verifying game changes, commit and push the updated source there unless the user explicitly requests otherwise. Do not stop after updating Firebase or Sites alone.
- The root repository must include the actual files under `dots-and-boxes/`, not a Git submodule or embedded-repository link. Preserve its local `.git` directory because Sites uses that separate checkout; never publish that Git metadata.
- Run `node stage-source.mjs` from the root to stage nested game files as ordinary source while preserving the local Sites checkout. Then stage changed root files normally. The helper excludes generated output and local state and retains the public `.openai/hosting.json` source manifest.
- Build from the root with `node build-firebase.mjs`. Run relevant checks from `dots-and-boxes/`; a complete verification runs its `test-*.mjs` and `test-*.cjs` files after the build.
- Keep generated builds, caches, archives, machine configuration, authentication credentials, and secret files out of GitHub. Respect `.gitignore` and review staged changes before committing.
- The live website is `https://dotgame.web.app/`. Its frontend calls the configured Sites/Cloudflare Worker API. Preserve the 30-minute game-data expiration rules and responsive mobile layout when making changes.
