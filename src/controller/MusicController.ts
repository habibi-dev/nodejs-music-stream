import MusicRepository from "../repository/MusicRepository";
import pkg from "lodash";
import {basename} from "path";
import FfmpegStream from "../lib/FfmpegStream";

export default class MusicController {

    start(): void {
        let musicList = new MusicRepository().getMusics();
        const key = pkg.get(process, "env.STREAM_KEY", "") as string;
        const server = pkg.get(process, "env.SERVER_URL", "") as string;
        const cover = pkg.get(process, "env.COVER", "./src/assets/cover.jpg") as string;

        if (pkg.isEmpty(musicList)) return;

        // Function to handle streaming and replay logic
        const playNext = () => {
            if (pkg.isEmpty(musicList)) {
                musicList = new MusicRepository().getMusics(); // Refresh the list when it's empty
            }

            let randomValue = pkg.sample(musicList) as string;

            new FfmpegStream(randomValue, cover).stream(server + key, () => {
                console.log("\x1b[35m%s\x1b[0m", `🔚  End file ` + basename(randomValue));
                musicList = pkg.without(musicList, randomValue); // Remove the played music from the list

                playNext(); // Replay with next music file
            });
        };

        playNext(); // Start the first song
    }
}
