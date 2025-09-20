export class FFbinariesResolver {
    static ffmpeg(): string {
        return process.env.FFMPEG_PATH || "ffmpeg";
    }

    static ffprobe(): string {
        return process.env.FFPROBE_PATH || "ffprobe";
    }
}