import MusicRepository from "../repository/MusicRepository";
import {get, isEmpty, sample, without} from "lodash";
import {basename} from "path";
import FfmpegStream from "../lib/FfmpegStream";
import config from "../../config.json"
import {ServerInterface} from "../interfaces/ServerInterface";

export default class MusicController {
    start() {
        const servers = get(config, "servers", []) as ServerInterface[];

        for (const server of servers) {
            const {dir, ignore_directories, label, stream_key, url_rtmp} = server;
            let files = new MusicRepository().getMusics(dir, ignore_directories)

            if (isEmpty(files)) return;

            // Function to handle streaming and replay logic
            const playNext = () => {
                if (isEmpty(files)) {
                    files = new MusicRepository().getMusics(dir, ignore_directories) // Refresh the list when it's empty
                }

                let randomValue = sample(files) as string;

                new FfmpegStream(randomValue, server).stream(url_rtmp + stream_key, () => {
                    console.log("\x1b[35m%s\x1b[0m", `🔚 ${label} - End file ` + basename(randomValue));
                    files = without(files, randomValue); // Remove the played music from the list

                    playNext(); // Replay with next music file
                });
            };

            playNext(); // Start the first song

        }

    }
}
