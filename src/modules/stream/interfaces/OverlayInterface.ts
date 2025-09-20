export type OverlayPositionInterface = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface OverlayMarginInterface {
    x: number;
    y: number;
}

export interface OverlayLogoConfigInterface {
    enabled: boolean;
    path: string;
    position: OverlayPositionInterface;
    scale: string;
    margin: OverlayMarginInterface;
}

export interface OverlayTextStyleConfigInterface {
    enabled: boolean;
    position: OverlayPositionInterface;
    font: string;
    size: number;
    color: string;
    background: string;
    padding?: number;
}

export interface OverlayNowPlayingConfigInterface extends OverlayTextStyleConfigInterface {
    template: string;
}

export interface OverlayTimeConfigInterface extends OverlayTextStyleConfigInterface {
    format: string;
}

export interface OverlayTextConfigInterface {
    enabled: boolean;
    now_playing: OverlayNowPlayingConfigInterface;
    time: OverlayTimeConfigInterface;
}

export interface OverlayCoverConfigInterface {
    enabled: boolean;
    path: string;                 // absolute or relative to process.cwd()
    fps?: number;                 // default 25
    scale?: string;               // e.g. "1280:720" or "1280:-2"
    force_ratio?: "decrease" | "increase" | "disable"; // default "decrease"
    pad?: { w: number; h: number; x?: string; y?: string; color?: string }; // optional
}

export interface OverlayInterface {
    logo: OverlayLogoConfigInterface;
    text: OverlayTextConfigInterface;
    cover: OverlayCoverConfigInterface;
}