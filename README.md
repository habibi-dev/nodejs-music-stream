# NodeJS Music Stream

NodeJS Music Stream is an Express-based media streaming service that schedules channel playlists and pushes them through an HLS pipeline backed by FFmpeg. The current revision is an MVP that prioritises end-to-end functionality over polish; many safeguards and observability pieces are still TODO and will evolve over time.

## Highlights
- Modular bootstrap layer that auto-discovers modules (core, stream, etc.) and initialises them in priority order.
- Stream module builds daily playlists from `channels/*.json` definitions, merges overrides, and keeps per-channel file caches.
- Background runtime watches channel state, restarts FFmpeg sessions when slots change, and auto-reloads channel data when the day rolls over.
- Playlist file caches are re-built after each full cycle so new media dropped in watched directories is picked up without manual restarts.
- HLS output is written to `public/hls/<channelId>` and exposed via `/hls`, while the embedded web player is served at `/stream/:channelId` using EJS views and hls.js.
- Static asset middleware applies media-friendly headers (MPEG-TS, M3U8, byte ranges) and forces no-cache semantics for live playlists.

## Project Layout
```
channels/                  Channel JSON definitions (enabled schedule, overrides, output targets)
public/hls/                 Generated HLS playlists and segments per channel
src/
  config/                   Core Express configuration (security, CORS, timers, static headers)
  modules/
    core/                   Logger/bootstrap wiring and example tests
    stream/                 Streaming logic, controllers, views, FFmpeg orchestration
  services/                 Bootstrap manager, logger, web server wrapper
  utils/                    Shared helpers (HTTP response wrapper, file scanning, etc.)
```

## Prerequisites
- Node.js 18+
- FFmpeg and FFprobe available in PATH or configured via `FFMPEG_PATH` / `FFPROBE_PATH`
- Optional: HTTPS certificates if you want to terminate TLS directly in the app (`PRIVKEY`, `FULLCHAIN`)

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and adjust the values. Key settings:
   - `CHANNELS_DIR` for channel JSON files (defaults to `./channels`).
   - `HLS_BASE_URL` and `HLS_ROOT_DIR` for the public HLS endpoint and storage path.
   - `FFMPEG_PATH` / `FFPROBE_PATH` if binaries are not globally available.
3. Prepare at least one channel file in `channels/` (see below).
4. Build the TypeScript sources:
   ```bash
   npm run build
   ```
5. Start the service:
   ```bash
   npm run start
   ```
6. Visit the status endpoint (`/api/status`) or open the player at `/stream/<channelId>`.

For iterative development you can run `npm run watch` to rebuild on change and wire the compiled output into your preferred process runner.

## Channel Files
Each channel is declared as `<channelId>.json` inside the directory defined by `CHANNELS_DIR`. Important fields:
- `enabled`: toggles whether the channel is loaded.
- `schedule`: array of slots with `start`/`end` (UTC HH:mm), `content_type` (`file` or `live`), and media selectors (`paths`, `extensions`, `ignore_directories`).
- `overrides`: additional slots that replace segments of the base schedule (shorter windows replace overlapping portions).
- `presets`, `overlay`, and `source_live` configure FFmpeg presets, on-screen graphics, and live input URLs respectively.

When the service boots (and at each midnight UTC roll-over) playlists are rebuilt and cached. For file-based playlists the system scans the configured directories, sorts files using the requested method (date, name, size, random), and loops through them. After the runtime finishes every file in a playlist slot it immediately rescans the filesystem so newly added tracks appear in the next cycle.

## Runtime Behaviour
- The bootstrap manager discovers modules under `src/modules/**/Bootstrap.ts`, initialises them, and hooks optional clean-up.
- `StreamService` manages FFmpeg lifecycles per channel. It keeps state in memory (current item, file index, backoff) and restarts encoders when the active slot changes or an error happens.
- Daily playlist rebuilds happen automatically; channel processes are stopped, channel JSON is reloaded, and fresh runtimes spin up with the new schedule.
- HLS artifacts live in `public/hls`. The static asset middleware sets the correct MIME types and disables caching so players always see the latest manifest.
- Routes are discovered dynamically from each module's `routes/` folder; the streaming player controller validates channel IDs and renders the EJS view with hls.js.

## Known Gaps / Roadmap
- No persistence layer yet for runtime state or analytics; everything is in-memory.
- Minimal validation on channel JSON and no management UI.
- Error handling and logging are intentionally sparse in this MVP; structured logs and metrics should be added.
- Automated tests only cover the sample core module. Stream services, FFmpeg orchestration, and config loading need coverage.
- Deployment automation (Docker, PM2/systemd unit files, CI pipelines) is not included.

Contributions and hardening will come later; for now the focus is iterating on the core streaming flow.
