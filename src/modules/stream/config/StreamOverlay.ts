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
    private config: OverlayInterface | null = null;
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

    getConfig(override?: OverlayInterface | null): OverlayInterface {
        const config = this.resolveConfig(override);
        if (!config) {
            throw new Error('Overlay configuration not available');
        }
        return config;
    }

    getLogoConfig(override?: OverlayInterface | null): OverlayLogoConfigInterface {
        const config = this.resolveConfig(override);
        if (!config?.logo) {
            throw new Error('Overlay logo configuration missing');
        }
        return config.logo;
    }

    getTextConfig(override?: OverlayInterface | null): OverlayTextConfigInterface {
        const config = this.resolveConfig(override);
        if (!config?.text) {
            throw new Error('Overlay text configuration missing');
        }
        return config.text;
    }

    getNowPlayingConfig(override?: OverlayInterface | null): OverlayNowPlayingConfigInterface {
        const text = this.getTextConfig(override);
        if (!text?.now_playing) {
            throw new Error('Overlay now playing configuration missing');
        }
        return text.now_playing;
    }

    getTimeConfig(override?: OverlayInterface | null): OverlayTimeConfigInterface {
        const text = this.getTextConfig(override);
        if (!text?.time) {
            throw new Error('Overlay time configuration missing');
        }
        return text.time;
    }

    isLogoEnabled(override?: OverlayInterface | null): boolean {
        const config = this.resolveConfig(override);
        return !!config?.logo?.enabled;
    }

    isTextEnabled(override?: OverlayInterface | null): boolean {
        const config = this.resolveConfig(override);
        return !!config?.text?.enabled;
    }

    isNowPlayingEnabled(override?: OverlayInterface | null): boolean {
        const text = this.resolveConfig(override)?.text;
        return !!text?.now_playing?.enabled;
    }

    isTimeEnabled(override?: OverlayInterface | null): boolean {
        const text = this.resolveConfig(override)?.text;
        return !!text?.time?.enabled;
    }

    getLogoArgs(override?: OverlayInterface | null): string[] {
        const logo = this.resolveConfig(override)?.logo;
        return (logo && logo.enabled) ? FFmpegOverlayArgsBuilder.buildLogoArgs(logo) : [];
    }

    getNowPlayingArgs(title?: string, override?: OverlayInterface | null): string[] {
        const nowPlaying = this.resolveConfig(override)?.text?.now_playing;
        return (nowPlaying && nowPlaying.enabled) ?
            FFmpegOverlayArgsBuilder.buildNowPlayingArgs(nowPlaying, title) : [];
    }

    getTimeArgs(override?: OverlayInterface | null): string[] {
        const time = this.resolveConfig(override)?.text?.time;
        return (time && time.enabled) ? FFmpegOverlayArgsBuilder.buildTimeArgs(time) : [];
    }

    getAllOverlayArgs(title?: string, override?: OverlayInterface | null): string[] {
        const config = this.resolveConfig(override);
        if (!config) return [];

        const args: string[] = [];

        if (config.logo?.enabled) {
            args.push(...this.getLogoArgs(override));
        }

        if (config.text?.enabled) {
            if (config.text.now_playing?.enabled) {
                args.push(...this.getNowPlayingArgs(title, override));
            }

            if (config.text.time?.enabled) {
                args.push(...this.getTimeArgs(override));
            }
        }

        return args;
    }

    isCoverEnabled(override?: OverlayInterface | null): boolean {
        const cover = this.resolveConfig(override)?.cover;
        return !!cover?.enabled && !!cover?.path;
    }

    getCoverConfig(override?: OverlayInterface | null): OverlayCoverConfigInterface | null {
        const config = this.resolveConfig(override);
        return config?.cover ?? null;
    }

    getCoverInputArgs(override?: OverlayInterface | null): string[] {
        const c = this.getCoverConfig(override);
        if (!c || !c.enabled || !c.path) return [];
        const p = path.isAbsolute(c.path) ? c.path : path.join(process.cwd(), c.path);
        if (!fs.existsSync(p)) return [];
        const fps = String(c.fps ?? 25);
        return ["-loop", "1", "-framerate", fps, "-i", p];
    }

    getCoverFilterGraphLabel(override?: OverlayInterface | null): string {
        const c = this.getCoverConfig(override);
        const scale = c?.scale ?? "1280:720";
        const fr = c?.force_ratio ?? "decrease";
        const base = `[1:v]scale=${scale}:force_original_aspect_ratio=${fr}`;
        const pad = c?.pad ? `,pad=${c.pad.w}:${c.pad.h}:${c.pad.x ?? "(ow-iw)/2"}:${c.pad.y ?? "(oh-ih)/2"}:${c.pad.color ?? "black"}` : "";
        return `${base}${pad},format=yuv420p[vbase]`;
    }

    getCompleteFilterComplex(title?: string, override?: OverlayInterface | null): string {
        const overlayArgs = this.getAllOverlayArgs(title, override);
        return overlayArgs.length > 0 ? overlayArgs.join(',') : '';
    }

    private ensureLoaded(): void {
        if (!this.isLoaded) {
            this.loadFromFile();
        }
    }

    private resolveConfig(override?: OverlayInterface | null): OverlayInterface | null {
        if (override) {
            return override;
        }
        this.ensureLoaded();
        return this.config;
    }
}

export default StreamOverlay.getInstance();
