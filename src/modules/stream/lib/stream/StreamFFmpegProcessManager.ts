import {ChildProcessWithoutNullStreams} from "child_process";
import Logger from "../../../../services/Logger";
import {FFmpegRunner} from "../ffmpeg/FFmpegRunner";

export class StreamFFmpegProcessManager {
    startProcess(
        channelId: string,
        args: string[],
        onClose: (code: number | null) => void,
        onError: (error: Error) => void
    ): ChildProcessWithoutNullStreams {
        Logger.info(`Starting FFmpeg for channel=${channelId}`, "stream");

        const process = FFmpegRunner.runRaw(args);

        // Handle stderr output
        process.stderr?.on("data", (buffer: Buffer) => {
            const line = buffer.toString().trim();
            if (line.includes("rror")) {
                Logger.error(line, "ffmpeg");
            } else {
                Logger.debug(line, "ffmpeg");
            }
        });

        process.on("close", onClose);
        process.on("error", onError);

        return process;
    }

    stopProcess(process: ChildProcessWithoutNullStreams, channelId: string): void {
        try {
            Logger.info(`Stopping FFmpeg for channel=${channelId}`, "stream");
            process.kill("SIGTERM");
        } catch (e: any) {
            Logger.error(`Failed to stop process for channel=${channelId}: ${e?.message ?? e}`, "stream");
        }
    }
}