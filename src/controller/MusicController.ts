import MusicRepository from "../repository/MusicRepository";
import {get, isEmpty, sample, without} from "lodash";
import {basename} from "path";
import FfmpegStream from "../lib/FfmpegStream";
import config from "../../config.json";
import {ServerInterface} from "../interfaces/ServerInterface";

export default class MusicController {
    start() {
        const servers = get(config, "servers", []) as ServerInterface[];

        for (const server of servers) {
            const {dir, ignore_directories, label, stream_key, url_rtmp} = server;

            const refreshFiles = () => {
                let files;
                try {
                    files = new MusicRepository().getMusics(dir, ignore_directories); // Attempt to get files from the directory
                } catch (err: any) {
                    console.error(`⛔ Error fetching music files from ${dir}: ${err.message}`);
                    return [];
                }

                if (isEmpty(files)) {
                    console.error(`⛔ No files found in directory: ${dir}`);
                }

                return files;
            };

            let files = refreshFiles(); // Initial fetch of music files

            // Function to handle streaming and replay logic
            const playNext = () => {
                if (isEmpty(files)) {
                    console.log("⏳ File list is empty, trying again in 5 seconds...");
                    setTimeout(() => {
                        files = refreshFiles(); // Re-fetch files after 5 seconds delay
                        playNext(); // Continue playback whether files are found or not
                    }, 5000); // 5000 milliseconds = 5 seconds
                    return; // Exit the current function and wait for setTimeout
                }

                let randomValue = sample(files) as string;

                new FfmpegStream(randomValue, server).stream(url_rtmp + stream_key, () => {
                    console.log("\x1b[35m%s\x1b[0m", `🔚 ${label} - End file ` + basename(randomValue));
                    files = without(files, randomValue); // Remove the played music from the list

                    playNext(); // Replay with next music file
                }, (err) => {
                    // Handle errors in the stream (e.g. file not found or stream issues)
                    console.error(`⛔ Streaming error for ${randomValue}: ${err.message}`);
                    files = refreshFiles(); // Attempt to refresh files if a stream error occurs
                    playNext();
                });
            };

            playNext(); // Start the first song
        }
    }
}
