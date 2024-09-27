import MusicRepository from "../repository/MusicRepository";
import pkg, {get, without} from "lodash";
import {basename} from "path";
import FfmpegStream from "../lib/FfmpegStream";
import config from "../../config.json"
import {ServerInterface} from "../interfaces/ServerInterface";

export default class MusicController {
    start() {
        const servers = get(config, "servers", []) as ServerInterface[];

        for (const server of servers) {
            const {dir, ignore_directories, cover, stream_key, url_rtmp} = server;
            let files = new MusicRepository().getMusics(dir, ignore_directories)

            if (pkg.isEmpty(files)) return;

            // Function to handle streaming and replay logic
            const playNext = () => {
                if (pkg.isEmpty(files)) {
                    files = new MusicRepository().getMusics(dir, ignore_directories) // Refresh the list when it's empty
                }

                let randomValue = pkg.sample(files) as string;

                new FfmpegStream(randomValue, server).stream(url_rtmp + stream_key, () => {
                    console.log("\x1b[35m%s\x1b[0m", `🔚  End file ` + basename(randomValue));
                    files = without(files, randomValue); // Remove the played music from the list

                    playNext(); // Replay with next music file
                });
            };

            playNext(); // Start the first song

        }

    }
}
