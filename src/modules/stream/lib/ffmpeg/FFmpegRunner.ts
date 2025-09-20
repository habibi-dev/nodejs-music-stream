import {spawn, ChildProcessWithoutNullStreams} from "child_process";
import Logger from "../../../../services/Logger";
import {FFbinariesResolver} from "./FFbinariesResolver";

export class FFmpegRunner {
    static run(args: string[], inherit = true): Promise<void> {
        const bin = FFbinariesResolver.ffmpeg();

        return new Promise((resolve, reject) => {
            const ps = spawn(bin, args, {stdio: inherit ? "inherit" : "pipe"});

            if (!inherit && ps.stderr) {
                // only capture stderr for errors
                ps.stderr.on("data", (d: Buffer) => {
                    Logger.error(d.toString().trim());
                });
            }

            ps.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    Logger.error(`FFmpeg exited with code ${code}`);
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            ps.on("error", (err) => {
                Logger.error(`Failed to start ffmpeg process: ${err.message}`);
                reject(err);
            });
        });
    }

    static runRaw(args: string[]): ChildProcessWithoutNullStreams {
        const bin = FFbinariesResolver.ffmpeg();
        return spawn(bin, args, {stdio: "pipe"});
    }

    static runWithOutput(args: string[]): Promise<string> {
        const bin = FFbinariesResolver.ffmpeg();

        return new Promise((resolve, reject) => {
            const ps = spawn(bin, args, {stdio: "pipe"});
            let output = '';
            let error = '';

            if (ps.stdout) {
                ps.stdout.on("data", (data: Buffer) => {
                    output += data.toString();
                });
            }

            if (ps.stderr) {
                ps.stderr.on("data", (data: Buffer) => {
                    error += data.toString();
                });
            }

            ps.on("close", (code) => {
                if (code === 0) {
                    resolve(output || error); // version info comes from stderr
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}: ${error}`));
                }
            });

            ps.on("error", (err) => {
                reject(err);
            });
        });
    }
}
