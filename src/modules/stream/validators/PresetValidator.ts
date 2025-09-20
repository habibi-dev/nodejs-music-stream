export class PresetValidator{
    static validatePresets(data: any): void {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid JSON structure');
        }

        for (const [key, profile] of Object.entries(data)) {
            PresetValidator.validatePreset(key, profile as any);
        }
    }

    static validatePreset(key: string, profile: any): void {
        const required = ['label', 'type', 'video', 'audio'];

        for (const field of required) {
            if (!profile[field]) {
                throw new Error(`Preset ${key}: Missing ${field}`);
            }
        }

        PresetValidator.validateVideoConfig(key, profile.video);
        PresetValidator.validateAudioConfig(key, profile.audio);
    }

    private static validateVideoConfig(profileKey: string, video: any): void {
        const required = ['codec', 'bitrate', 'scale', 'fps', 'gop', 'profile', 'level', 'pix_fmt'];

        for (const field of required) {
            if (!video[field] && video[field] !== 0) {
                throw new Error(`Preset ${profileKey}: Missing video.${field}`);
            }
        }
    }

    private static validateAudioConfig(profileKey: string, audio: any): void {
        const required = ['codec', 'channels', 'bitrate', 'samplerate'];

        for (const field of required) {
            if (audio[field] === undefined) {
                throw new Error(`Preset ${profileKey}: Missing audio.${field}`);
            }
        }

        if (typeof audio.loudnorm !== 'boolean') {
            throw new Error(`Preset ${profileKey}: audio.loudnorm must be boolean`);
        }
    }
}