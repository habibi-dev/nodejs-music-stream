import {JsonLoader} from "../utils/JsonLoader";
import {
    OverlayLogoConfigInterface,
    OverlayTextConfigInterface,
    OverlayNowPlayingConfigInterface,
    OverlayTimeConfigInterface, OverlayInterface, OverlayCoverConfigInterface
} from "../interfaces/OverlayInterface";
import path, {join} from "path";
import {FFmpegOverlayArgsBuilder} from "../utils/FFmpegOverlayArgsBuilder";
import {OverlayValidator} from "../validators/OverlayValidator";
import fs from "fs";

class StreamOverlay {
    private static instance: StreamOverlay;
    private config!: OverlayInterface;
    private isLoaded = false;

    static getInstance(): StreamOverlay {
        if (!StreamOverlay.instance) {
            StreamOverlay.instance = new StreamOverlay();
        }
        return StreamOverlay.instance;
    }

    loadFromFile(): void {
        const filePath = join(process.cwd(), 'config', 'overlay.json');
        this.config = JsonLoader.loadFromFile<OverlayInterface>(filePath, OverlayValidator.validateOverlay);
        this.isLoaded = true;
    }

    getConfig(): OverlayInterface {
        this.ensureLoaded();
        return this.config;
    }

    getLogoConfig(): OverlayLogoConfigInterface {
        this.ensureLoaded();
        return this.config.logo;
    }

    getTextConfig(): OverlayTextConfigInterface {
        this.ensureLoaded();
        return this.config.text;
    }

    getNowPlayingConfig(): OverlayNowPlayingConfigInterface {
        this.ensureLoaded();
        return this.config.text.now_playing;
    }

    getTimeConfig(): OverlayTimeConfigInterface {
        this.ensureLoaded();
        return this.config.text.time;
    }

    isLogoEnabled(): boolean {
        this.ensureLoaded();
        return this.config.logo.enabled || false;
    }

    isTextEnabled(): boolean {
        this.ensureLoaded();
        return this.config.text.enabled || false;
    }

    isNowPlayingEnabled(): boolean {
        this.ensureLoaded();
        return this.config.text.now_playing.enabled || false;
    }

    isTimeEnabled(): boolean {
        this.ensureLoaded();
        return this.config.text.time.enabled || false;
    }

    getLogoArgs(): string[] {
        const logo = this.getLogoConfig();
        return (logo && logo.enabled) ? FFmpegOverlayArgsBuilder.buildLogoArgs(logo) : [];
    }

    getNowPlayingArgs(title?: string): string[] {
        const nowPlaying = this.getNowPlayingConfig();
        return (nowPlaying && nowPlaying.enabled) ?
            FFmpegOverlayArgsBuilder.buildNowPlayingArgs(nowPlaying, title) : [];
    }

    getTimeArgs(): string[] {
        const time = this.getTimeConfig();
        return (time && time.enabled) ? FFmpegOverlayArgsBuilder.buildTimeArgs(time) : [];
    }

    getAllOverlayArgs(title?: string): string[] {

        this.ensureLoaded();
        if (!this.config) return [];

        const args: string[] = [];

        // Add logo overlay
        if (this.isLogoEnabled()) {
            args.push(...this.getLogoArgs());
        }

        // Add text overlays
        if (this.isTextEnabled()) {
            if (this.isNowPlayingEnabled()) {
                args.push(...this.getNowPlayingArgs(title));
            }

            if (this.isTimeEnabled()) {
                args.push(...this.getTimeArgs());
            }
        }

        return args;
    }

    isCoverEnabled(): boolean {
        this.ensureLoaded();
        return !!this.config.cover?.enabled && !!this.config.cover?.path;
    }

    getCoverConfig(): OverlayCoverConfigInterface | null {
        this.ensureLoaded();
        return this.config.cover ?? null;
    }

    getCoverInputArgs(): string[] {
        const c = this.getCoverConfig();
        if (!c || !c.enabled || !c.path) return [];
        const p = path.isAbsolute(c.path) ? c.path : path.join(process.cwd(), c.path);
        if (!fs.existsSync(p)) return [];
        const fps = String(c.fps ?? 25);
        return ["-loop", "1", "-framerate", fps, "-i", p];
    }

    getCoverFilterGraphLabel(): string {
        const c = this.getCoverConfig();
        const scale = c?.scale ?? "1280:720";
        const fr = c?.force_ratio ?? "decrease";
        const base = `[1:v]scale=${scale}:force_original_aspect_ratio=${fr}`;
        const pad = c?.pad ? `,pad=${c.pad.w}:${c.pad.h}:${c.pad.x ?? "(ow-iw)/2"}:${c.pad.y ?? "(oh-ih)/2"}:${c.pad.color ?? "black"}` : "";
        return `${base}${pad},format=yuv420p[vbase]`;
    }

    getCompleteFilterComplex(title?: string): string {
        const overlayArgs = this.getAllOverlayArgs(title);
        return overlayArgs.length > 0 ? overlayArgs.join(',') : '';
    }

    private ensureLoaded(): void {
        if (!this.isLoaded) {
            this.loadFromFile();
        }
    }
}

export default StreamOverlay.getInstance();