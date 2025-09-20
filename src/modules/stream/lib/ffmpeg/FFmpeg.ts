import {FFmpegRunner} from "./FFmpegRunner";

class FFmpeg {
    private static exec(args: string[]): Promise<void> {
        return FFmpegRunner.run(["-hide_banner", "-y", ...args]);
    }

    private static execWithOutput(args: string[]): Promise<string> {
        return FFmpegRunner.runWithOutput(["-hide_banner", ...args]);
    }

    static async version(): Promise<string> {
        return this.execWithOutput(['-version']);
    }
}

export default FFmpeg;