import MusicRepository from "../repository/MusicRepository";
import {get, isEmpty, sample, without} from "lodash";
import {basename} from "path";
import FfmpegStream from "../lib/FfmpegStream";
import config from "../../config.json";
import {ServerInterface} from "../interfaces/ServerInterface";
import Logger from "../lib/Logger";

export default class MusicController {
    start() {
        const servers = get(config, "servers", []) as ServerInterface[];

        for (const server of servers) {
            const {dir, ignore_directories, label, stream_key, url_rtmp, shuffle} = server;

            const refreshFiles = () => {
                let files;
                try {
                    files = new MusicRepository().getMusics(dir, ignore_directories); // Attempt to get files from the directory
                } catch (err: any) {
                    Logger.error(`⛔ Error fetching music files from ${dir}: ${err.message}`, label.toLowerCase());
                    return [];
                }

                if (isEmpty(files)) {
                    Logger.warn(`⛔ No files found in directory: ${dir}`, label.toLowerCase());
                }

                return files;
            };

            let files = refreshFiles(); // Initial fetch of music files

            // Function to handle streaming and replay logic
            const playNext = () => {
                if (isEmpty(files)) {
                    Logger.warn("⏳ File list is empty, trying again in 5 seconds...", label.toLowerCase());
                    setTimeout(() => {
                        files = refreshFiles(); // Re-fetch files
                        playNext(); // Continue playback
                    }, 5000);
                    return;
                }

                // Check the shuffle setting from the config file
                let nextFile = shuffle ? sample(files) as string : files.shift() as string;

                new FfmpegStream(nextFile, server).stream(url_rtmp + stream_key, () => {
                    Logger.info(`End file ` + basename(nextFile), label.toLowerCase());

                    // Remove the played file
                    if (!shuffle) {
                        if (isEmpty(files)) {
                            files = refreshFiles(); // Refill files when all are played
                        }
                    } else {
                        files = without(files, nextFile);
                    }

                    playNext(); // Play next song
                }, (err) => {
                    Logger.error(`⛔ Streaming error for ${nextFile}: ${err.message}`, label.toLowerCase());
                    playNext(); // Skip to the next song
                });
            };

            playNext(); // Start the first song
        }
    }
}
