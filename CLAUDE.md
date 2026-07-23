# CLAUDE.md — FMGMT (WA-FMGMT Scouts)

## Project Overview

FMGMT is a WhatsApp message archiver bot for a French Scouts group ("Ronde Ste Bernadette"). It connects to WhatsApp via the Baileys library, listens for all incoming messages, and appends each one as a row to a Google Sheet. It runs on Railway as a long-lived Node.js process.

The entire application is a single file (`index.js`, ~85 lines). There is no web server, no API, no database, no build step, and no tests.

## Architecture

```
WhatsApp (Baileys WebSocket) → index.js → Google Sheets API
```

- **WhatsApp connection**: Uses `@whiskeysockets/baileys` (unofficial WhatsApp Web multi-device protocol). Auth state is stored at `/tmp/auth_info_multi`. Initial pairing requires scanning a QR code printed to the terminal.
- **Message archiving**: Every received message (group or private) is logged to the console and appended to the first sheet of the configured Google Spreadsheet with columns: `date`, `auteur`, `contenu`, `groupe`.
- **Reconnection**: On disconnect, the bot auto-reconnects after 3 seconds unless the session was explicitly logged out.

## File Structure

```
/
├── index.js         # Entire application (bot logic, message handler, Google Sheets write)
├── package.json     # npm manifest (2 dependencies, start script)
├── readme.txt       # Brief project description (French, partially outdated)
└── CLAUDE.md        # This file
```

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@whiskeysockets/baileys` | ^6.6.0 | WhatsApp Web API client (multi-device) |
| `google-spreadsheet` | ^3.3.0 | Google Sheets API wrapper (v3, service account auth) |

> **Note**: `readme.txt` references `whatsapp-web.js` and `qrcode-terminal` — those are outdated. The project migrated to Baileys which has built-in QR printing.

## Environment Variables

Both must be set in the hosting environment (Railway). There is no `.env` file.

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CREDS_JSON` | Yes | Full JSON string of Google service account credentials |
| `SPREADSHEET_ID` | Yes | ID of the target Google Spreadsheet |

## Running

```bash
npm install
npm start          # runs: node index.js
```

On first run, a QR code is printed to the terminal — scan it with WhatsApp to pair the bot. Subsequent runs reuse the saved auth state.

## Development Notes

- **Language**: JavaScript (CommonJS `require`, no ESM, no TypeScript)
- **No build step**: Code runs directly via `node index.js`
- **No linting/formatting**: No ESLint, Prettier, or similar tooling configured
- **No tests**: No test framework, no test files, no test script
- **No CI/CD**: No GitHub Actions or other pipeline
- **No `.gitignore`**: Missing — should exclude `node_modules/` and auth state files
- **Hosting**: Designed for Railway (cloud platform)
- **Locale**: All logs, variable names, and comments are in **French**

## Conventions for AI Assistants

- Keep comments and log messages in **French** to match the existing codebase style.
- The project is intentionally minimal — avoid introducing frameworks, abstractions, or tooling unless explicitly requested.
- `google-spreadsheet` v3 uses `doc.useServiceAccountAuth(creds)` — this is the legacy API. v4 uses a different auth pattern. Do not upgrade without explicit request.
- Baileys is an unofficial WhatsApp library with frequent breaking changes. Pin versions carefully.
- Environment variables contain secrets (`GOOGLE_CREDS_JSON`). Never log, commit, or expose them.
- The bot creates a new `GoogleSpreadsheet` instance per message — this is intentional for simplicity in this low-volume use case.
