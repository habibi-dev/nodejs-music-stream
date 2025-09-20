import {
    OverlayLogoConfigInterface,
    OverlayNowPlayingConfigInterface,
    OverlayPositionInterface,
    OverlayTimeConfigInterface
} from '../interfaces/OverlayInterface';
import fs from "fs";

export class FFmpegOverlayArgsBuilder {

    static buildLogoArgs(logo: OverlayLogoConfigInterface): string[] {
        if (!logo.enabled) return [];

        const position = this.getPositionCoordinates(logo.position, logo.margin);

        return [
            '-i', logo.path,
            '-filter_complex',
            `[1:v]scale=${logo.scale}[logo];[0:v][logo]overlay=${position}:format=auto,format=yuv420p[out]`,
            '-map', '[out]'
        ];
    }

    static buildNowPlayingArgs(config: OverlayNowPlayingConfigInterface, title?: string): string[] {
        if (!config.enabled) return [];

        const text = title ? config.template.replace('{title}', title) : config.template.replace('{title}', 'Unknown');
        const position = this.getTextPosition(config.position);
        const style = this.buildTextStyle(config);

        return ['-vf', `drawtext=text='${text}':${style}:${position}`];
    }

    static buildTimeArgs(config: OverlayTimeConfigInterface): string[] {
        if (!config.enabled) return [];

        const position = this.getTextPosition(config.position);
        const style = this.buildTextStyle(config);

        return ['-vf', `drawtext=text='%{localtime\\:${config.format}}':${style}:${position}`];
    }

    static buildCompleteOverlay(
        logo?: OverlayLogoConfigInterface,
        nowPlaying?: OverlayNowPlayingConfigInterface,
        time?: OverlayTimeConfigInterface,
        title?: string
    ): string[] {
        const filters: string[] = [];
        let inputCount = 1; // Start with video input [0:v]
        let currentVideo = '[0:v]';

        if (logo && logo.enabled) {
            const position = this.getPositionCoordinates(logo.position, logo.margin);
            const logoFilter = `[${inputCount}:v]scale=${logo.scale}[logo${inputCount}];${currentVideo}[logo${inputCount}]overlay=${position}[v${inputCount}]`;
            filters.push(logoFilter);
            currentVideo = `[v${inputCount}]`;
            inputCount++;
        }

        const textFilters: string[] = [];

        if (nowPlaying && nowPlaying.enabled) {
            const text = title ? nowPlaying.template.replace('{title}', title) : nowPlaying.template.replace('{title}', 'Unknown');
            const position = this.getTextPosition(nowPlaying.position);
            const style = this.buildTextStyle(nowPlaying);
            textFilters.push(`drawtext=text='${text}':${style}:${position}`);
        }

        if (time && time.enabled) {
            const position = this.getTextPosition(time.position);
            const style = this.buildTextStyle(time);
            textFilters.push(`drawtext=text='%{localtime\\:${time.format}}':${style}:${position}`);
        }

        if (textFilters.length > 0) {
            const combinedTextFilter = `${currentVideo}${textFilters.join(',')}[out]`;
            filters.push(combinedTextFilter);
        } else if (filters.length > 0) {
            filters[filters.length - 1] = filters[filters.length - 1].replace(/\[v\d+\]$/, '[out]');
        }

        if (filters.length === 0) return [];

        return ['-filter_complex', filters.join(';'), '-map', '[out]'];
    }

    private static getPositionCoordinates(position: OverlayPositionInterface, margin?: {
        x: number;
        y: number
    }): string {
        const marginX = margin?.x || 0;
        const marginY = margin?.y || 0;

        switch (position) {
            case 'top-left':
                return `${marginX}:${marginY}`;
            case 'top-right':
                return `W-w-${marginX}:${marginY}`;
            case 'bottom-left':
                return `${marginX}:H-h-${marginY}`;
            case 'bottom-right':
                return `W-w-${marginX}:H-h-${marginY}`;
            case 'center':
                return '(W-w)/2:(H-h)/2';
            default:
                return `${marginX}:${marginY}`;
        }
    }

    private static getTextPosition(position: OverlayPositionInterface): string {
        switch (position) {
            case 'top-left':
                return 'x=10:y=10';
            case 'top-right':
                return 'x=w-tw-10:y=10';
            case 'bottom-left':
                return 'x=10:y=h-th-10';
            case 'bottom-right':
                return 'x=w-tw-10:y=h-th-10';
            case 'center':
                return 'x=(w-tw)/2:y=(h-th)/2';
            default:
                return 'x=10:y=10';
        }
    }

    private static buildTextStyle(config: OverlayNowPlayingConfigInterface | OverlayTimeConfigInterface): string {
        const styles: string[] = [];

        // Only add fontfile if provided
        if (config.font && fs.existsSync(config.font)) {
            styles.push(`fontfile='${config.font}'`);
        }

        styles.push(
            `fontsize=${config.size}`,
            `fontcolor=${config.color}`
        );

        if (config.background) {
            styles.push(`box=1:boxcolor=${config.background}`);
        }

        if ('padding' in config && config.padding) {
            styles.push(`boxborderw=${config.padding}`);
        }

        return styles.join(':');
    }

    static buildSimpleOverlay(type: 'logo' | 'text', config: any, title?: string): string {
        switch (type) {
            case 'logo': {
                const position = this.getPositionCoordinates(config.position, config.margin);
                return `[1:v]scale=${config.scale}[logo];[0:v][logo]overlay=${position}[out]`;
            }
            case 'text': {
                const textPosition = this.getTextPosition(config.position);
                const textStyle = this.buildTextStyle(config);
                const text = config.template
                    ? (title ? config.template.replace('{title}', title) : config.template.replace('{title}', 'Unknown'))
                    : `%{localtime\\:${config.format}}`;
                return `drawtext=text='${text}':${textStyle}:${textPosition}`;
            }
            default:
                return '';
        }
    }
}
