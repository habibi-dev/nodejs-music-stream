import {execSync} from "child_process";

export class FFChecker {
    private static checkCommand(command: string): boolean {
        try {
            // Try to get version of the command
            execSync(`${command} -version`, {stdio: "ignore"});
            return true;
        } catch {
            return false;
        }
    }

    public static hasFFmpeg(): boolean {
        const path = process.env.FFMPEG_PATH || "ffmpeg";
        return this.checkCommand(path);
    }

    public static hasFFprobe(): boolean {
        const path = process.env.FFPROBE_PATH || "ffprobe";
        return this.checkCommand(path);
    }

    public static checkAll(): { ffmpeg: boolean; ffprobe: boolean } {
        return {
            ffmpeg: this.hasFFmpeg(),
            ffprobe: this.hasFFprobe()
        };
    }
}
