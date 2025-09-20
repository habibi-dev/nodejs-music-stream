import {BootstrapInterface} from "../../interfaces/BootstrapInterface";
import StreamService from "./lib/stream/StreamService";
import Logger from "../../services/Logger";
import FFmpeg from "./lib/ffmpeg/FFmpeg";


export class StreamBootstrap implements BootstrapInterface {
    name = "Stream";
    priority = 1; // Highest priority

    async init() {
        // Initialize the StreamService with the current date
        await StreamService.init(new Date());

        StreamService.start();
    }

    async destroy() {
        const shutdown = async (sig: string) => {
            Logger.info(`Received ${sig}, shutting down...`, "stream");
            try {
                StreamService.stop();
            } finally {
                process.exit(0);
            }
        };
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));

        const ver =  await FFmpeg.version();
        Logger.info(`FFmpeg: ${ver}`, "bootstrap");
    }
}