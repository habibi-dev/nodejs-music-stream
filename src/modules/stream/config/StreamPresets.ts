import {FFmpegArgsBuilder} from '../utils/FFmpegArgsBuilder';
import {JsonLoader} from "../utils/JsonLoader";
import {
    AudioConfigInterface,
    PresetInterface,
    PresetsConfigInterface,
    VideoConfigInterface
} from "../interfaces/PresetsInterface";
import {join} from "path";
import {PresetValidator} from "../validators/PresetValidator";

class StreamPresets {
    private static instance: StreamPresets;
    private profiles: PresetsConfigInterface = {};
    private isLoaded = false;

    static getInstance(): StreamPresets {
        if (!StreamPresets.instance) {
            StreamPresets.instance = new StreamPresets();
        }
        return StreamPresets.instance;
    }

    loadFromFile(): void {
        const filePath = join(process.cwd(), 'config', 'presets.json');
        this.profiles = JsonLoader.loadFromFile<PresetsConfigInterface>(filePath, PresetValidator.validatePresets);
        this.isLoaded = true;
    }

    getPreset(name: string): PresetInterface | null {
        this.ensureLoaded();
        return this.profiles[name] || null;
    }

    getAllPresets(): PresetsConfigInterface {
        this.ensureLoaded();
        return {...this.profiles};
    }

    getPresetNames(): string[] {
        this.ensureLoaded();
        return Object.keys(this.profiles);
    }

    hasPreset(name: string): boolean {
        this.ensureLoaded();
        return name in this.profiles;
    }

    getVideoConfig(profileName: string): VideoConfigInterface | null {
        const profile = this.getPreset(profileName);
        return profile?.video || null;
    }

    getAudioConfig(profileName: string): AudioConfigInterface | null {
        const profile = this.getPreset(profileName);
        return profile?.audio || null;
    }

    getFFmpegVideoArgs(profileName: string): string[] {
        const video = this.getVideoConfig(profileName);
        return video ? FFmpegArgsBuilder.buildVideoArgs(video) : [];
    }

    getFFmpegAudioArgs(profileName: string): string[] {
        const audio = this.getAudioConfig(profileName);
        return audio ? FFmpegArgsBuilder.buildAudioArgs(audio) : [];
    }

    getCompleteFFmpegArgs(profileName: string): string[] {
        const profile = this.getPreset(profileName);
        if (!profile) return [];

        return FFmpegArgsBuilder.buildCompleteArgs(profile.video, profile.audio);
    }

    private ensureLoaded(): void {
        if (!this.isLoaded) {
            this.loadFromFile();
        }
    }
}

export default StreamPresets.getInstance();

