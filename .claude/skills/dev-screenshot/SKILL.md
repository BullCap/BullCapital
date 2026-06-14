---
name: dev-screenshot
description: Use Chromium to capture authenticated screenshots of the BullCapital local Next.js dev server. Use when the user asks to see, verify, compare, or document local UI screens behind login, especially routes like /home, /clients, /terminal, /asset/[ticker], or responsive desktop/mobile states.
---

# Dev Screenshot

## Overview

Capture local BullCapital UI screenshots through a real Chromium browser session. Authenticate with the dev seed user by default, then save PNG files under `.screenshots/`.

## Workflow

1. Confirm the local web server is running. Default base URL is `http://localhost:3000`; use `DEV_SERVER_URL` or `--base` when the server runs elsewhere.
2. Confirm Postgres is reachable for the dev app. If the local stack is down, start it with `docker compose up` or the project-specific database command before capturing protected routes.
3. If login may fail because the dev user is missing, run `cd web && pnpm db:seed`. The seed user is `dev@bullcapital.app` with password `senha123456`.
4. If `web/.env.local` has `NEXTAUTH_URL` set to an ngrok or preview host, either pass that reachable host with `--base` or restart the dev server with `NEXTAUTH_URL` matching the local URL.
5. Run the bundled script from the repo root:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs /home --both
```

6. Inspect the generated files in `.screenshots/`. If visual QA matters, open the PNGs or use an image viewer before reporting results.

## Common Commands

Capture authenticated desktop screenshot of `/home`:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs /home
```

Capture desktop and mobile:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs /clients --both
```

Capture a custom viewport:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs /terminal --viewport 1280x900
```

Use a non-default dev port:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs /home --base http://localhost:3001
```

Capture a public route without auth:

```bash
node .claude/skills/dev-screenshot/scripts/capture.mjs / --no-auth
```

## Script Options

- `--desktop`, `--mobile`, `--both`: choose responsive targets. Default is desktop.
- `--viewport WxH`: use one custom viewport.
- `--selector <css>`: wait for a specific element before capture.
- `--wait <ms>`: wait after load and font readiness. Default is `1200`.
- `--no-full-page`: capture only the viewport instead of the full page.
- `--out <dir>` and `--name <slug>`: control output path and filename stem.
- `--email <email>` and `--password <pass>`: override dev credentials; environment alternatives are `DEV_SCREENSHOT_EMAIL` and `DEV_SCREENSHOT_PASSWORD`.
- `--headed`: show Chromium for debugging.

## Troubleshooting

- If the script says the server is unreachable, start the app with `cd web && pnpm dev`, or pass the active port with `--base`.
- If login fails with `Algo deu errado`, check that Postgres is running, seed the database with `cd web && pnpm db:seed`, and make sure `NEXTAUTH_URL` matches `--base`.
- If a page captures before async content appears, rerun with `--selector` for stable page content or increase `--wait`.
- Do not commit `.screenshots/`; it is a local visual QA output directory.
