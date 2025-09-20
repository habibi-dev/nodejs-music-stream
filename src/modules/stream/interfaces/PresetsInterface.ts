export interface VideoConfigInterface {
    codec: string;
    bitrate: string;
    maxrate: string;
    bufsize: string;
    scale: string;
    fps: number;
    gop: number;
    profile: string;
    level: string;
    pix_fmt: string;
}

export interface AudioConfigInterface {
    codec: string;
    channels: number;
    bitrate: string;
    samplerate: number;
    loudnorm: boolean;
}

export interface PresetInterface {
    label: string;
    type: string;
    video: VideoConfigInterface;
    audio: AudioConfigInterface;
}

export interface PresetsConfigInterface {
    [key: string]: PresetInterface;
}