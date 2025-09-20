import StreamOverlay from "../../../config/StreamOverlay";
import {PlaylistItemInterface} from "../../../interfaces/PlaylistItemInterface";
import {MediaInfo} from "../StreamFFmpegArgsBuilder";
import StreamPresets from "../../../config/StreamPresets";
import Logger from "../../../../../services/Logger";
import path from "path";

export class StreamFFmpegFilterComplexBuilder {
    constructor(private overlay = StreamOverlay) {
    }

    build(
        playlist: PlaylistItemInterface,
        mediaInfo: MediaInfo | null,
        isAudioOnly: boolean
    ): string {
        let filterGraph = "";
        let currentInput = "[0:v]";
        let inputIndex = 1;

        // Handle audio-only content - add cover
        if (isAudioOnly) {
            const targetScale = this.getTargetScale(playlist);
            filterGraph = `[1:v]scale=${targetScale}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p[base]`;
            currentInput = "[base]";
            inputIndex = 2;
        }

        // Handle video content - normalize to target frame size
        if (!isAudioOnly) {
            const targetScale = this.getTargetScale(playlist); // e.g. "1280:720"
            const [tw, th] = targetScale.split(':');

            // Fit inside target with aspect preserved, then pad to exact WxH, even dimensions, SAR=1
            const norm =
                `[0:v]` +
                `scale=${targetScale}:force_original_aspect_ratio=decrease,` +
                `scale=trunc(iw/2)*2:trunc(ih/2)*2,` +
                `setsar=1,` +
                `pad=${tw}:${th}:(ow-iw)/2:(oh-ih)/2:color=black[vnorm]`;

            filterGraph = filterGraph ? `${filterGraph};${norm}` : norm;
            currentInput = `[vnorm]`;
            inputIndex = 1;
        }

        // Add logo overlay (for both audio and video)
        const logoResult = this.addLogoOverlay(filterGraph, currentInput, inputIndex);
        filterGraph = logoResult.filterGraph;
        currentInput = logoResult.currentInput;
        inputIndex = logoResult.inputIndex;

        // Add text overlays (for both audio and video)
        const finalFilter = this.addTextOverlays(
            filterGraph,
            currentInput,
            mediaInfo?.nowPlayingTitle ?? "-"
        );

        // Return empty string only if no processing was done at all
        if (!finalFilter) {
            return "";
        }

        return finalFilter;
    }

    private addLogoOverlay(filterGraph: string, currentInput: string, inputIndex: number) {
        if (!this.overlay.isLogoEnabled()) {
            return {filterGraph, currentInput, inputIndex};
        }

        const logoConfig = this.overlay.getLogoConfig();
        const logoPath = path.isAbsolute(logoConfig.path)
            ? logoConfig.path
            : path.join(process.cwd(), logoConfig.path);

        if (!require('fs').existsSync(logoPath)) {
            return {filterGraph, currentInput, inputIndex};
        }

        const position = this.getLogoPosition(logoConfig);        // e.g. "x=20:y=20" or "20:20"
        const logoScale = this.convertLogoScale(logoConfig.scale); // e.g. "iw*0.1:ih*0.1"

        // Use unique labels to avoid collisions
        const logoLbl = `[logo_${inputIndex}]`;
        const withLbl = `[with_logo_${inputIndex}]`;

        const logoFilter =
            `[${inputIndex}:v]scale=${logoScale}:flags=lanczos,format=yuva420p${logoLbl};` +
            `${currentInput}${logoLbl}overlay=${position}:format=auto${withLbl}`;

        filterGraph = filterGraph ? `${filterGraph};${logoFilter}` : logoFilter;
        currentInput = withLbl;
        inputIndex++;

        return {filterGraph, currentInput, inputIndex};
    }


    private addTextOverlays(filterGraph: string, currentInput: string, nowPlayingTitle?: string): string {
        const textFilters = this.buildTextOverlays(nowPlayingTitle);

        if (textFilters.length > 0) {
            const textFilterStr = textFilters.join(',');
            if (filterGraph) {
                return `${filterGraph};${currentInput}${textFilterStr},format=yuv420p[out]`;
            } else {
                return `${currentInput}${textFilterStr},format=yuv420p[out]`;
            }
        }

        // No text overlays
        if (filterGraph) {
            // We have previous filters (logo or cover), need to terminate properly
            return `${filterGraph};${currentInput}format=yuv420p[out]`;
        }

        // No filters at all for video content
        return "";
    }

    private buildTextOverlays(nowPlayingTitle?: string): string[] {
        const filters: string[] = [];

        if (this.overlay.isNowPlayingEnabled() && nowPlayingTitle) {
            const nowPlayingFilter = this.buildNowPlayingTextFilter(nowPlayingTitle);
            if (nowPlayingFilter) {
                filters.push(nowPlayingFilter);
            }
        }

        if (this.overlay.isTimeEnabled()) {
            const timeFilter = this.buildTimeTextFilter();
            if (timeFilter) {
                filters.push(timeFilter);
            }
        }

        return filters;
    }

    private buildNowPlayingTextFilter(title: string): string | null {
        const config = this.overlay.getNowPlayingConfig();
        if (!config?.enabled) return null;

        const escapedTitle = this.escapeFFmpegText(title);
        const escapedText = this.escapeFFmpegText(config.template.replace('{title}', escapedTitle));
        const position = this.getTextPosition(config.position);
        const style = this.buildTextStyle(config);

        return `drawtext=text='${escapedText}':${style}:${position}`;
    }

    private buildTimeTextFilter(): string | null {
        const config = this.overlay.getTimeConfig();
        if (!config?.enabled) return null;

        const position = this.getTextPosition(config.position);
        const style = this.buildTextStyle(config);

        return `drawtext=text='%{localtime\\:%X}':${style}:${position}`;
    }

    private getTargetScale(playlist: PlaylistItemInterface): string {
        const presetKey = playlist.presets?.[0] ?? "hd_720p";
        const vcfg = StreamPresets.getVideoConfig(presetKey);
        return (vcfg?.scale?.trim()) ? vcfg.scale : "1280:720";
    }

    private convertLogoScale(scale: string): string {
        if (scale.endsWith('%')) {
            const percentage = parseInt(scale.replace('%', ''));
            const ratio = percentage / 100;
            return `iw*${ratio}:ih*${ratio}`;
        }
        return scale;
    }

    private getLogoPosition(logoConfig: any): string {
        const {position, margin} = logoConfig;
        const {x = 20, y = 20} = margin || {};

        const positions: Record<string, string> = {
            'top-left': `${x}:${y}`,
            'top-right': `W-w-${x}:${y}`,
            'bottom-left': `${x}:H-h-${y}`,
            'bottom-right': `W-w-${x}:H-h-${y}`,
            'center': `(W-w)/2:(H-h)/2`
        };

        return positions[position] || `${x}:${y}`;
    }

    private getTextPosition(position: string): string {
        const positions: Record<string, string> = {
            'top-left': 'x=10:y=10',
            'top-right': 'x=w-tw-10:y=10',
            'bottom-left': 'x=10:y=h-th-10',
            'bottom-right': 'x=w-tw-10:y=h-th-10',
            'center': 'x=(w-tw)/2:y=(h-th)/2'
        };

        return positions[position] || 'x=10:y=10';
    }

    private buildTextStyle(config: any): string {
        const styles: string[] = [];

        // Skip font configuration to avoid Fontconfig errors
        // FFmpeg will use system default font

        styles.push(
            `fontsize=${config.size}`,
            `fontcolor=${config.color}`
        );

        if (config.background) {
            styles.push(`box=1:boxcolor=${config.background}`);
            if (config.padding) {
                styles.push(`boxborderw=${config.padding}`);
            }
        }

        return styles.join(':');
    }

    private isFontAccessible(fontPath: string): boolean {
        try {
            return require('fs').existsSync(fontPath);
        } catch (e) {
            Logger.warn(`Cannot access font file: ${fontPath}`, "stream");
            return false;
        }
    }

    private escapeFFmpegText(text: string): string {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "'\\''")
            .replace(/:/g, '\\:')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;')
            .replace(/%/g, '\\%');
    }
}