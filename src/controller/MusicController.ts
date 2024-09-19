import MusicRepository from "../repository/MusicRepository";
import pkg from "lodash";
import FfmpegStream from "../lib/FfmpegStream";

export default class MusicController {

    start(): void {
        let musicList = new MusicRepository().getMusics();
        const key = pkg.get(process, "env.STREAM_KEY", "") as string;
        const server = pkg.get(process, "env.SERVER_URL", "") as string;
        const cover = pkg.get(process, "env.COVER", "./src/assets/cover.jpg") as string;

        if (pkg.isEmpty(musicList)) return;

        // Function to handle streaming and replay logic
        const playNextMusic = () => {
            if (pkg.isEmpty(musicList)) {
                musicList = new MusicRepository().getMusics(); // Refresh the list when it's empty
            }

            let randomValue = pkg.sample(musicList) as string;

            new FfmpegStream(randomValue, cover).stream(server + key, () => {
                musicList = pkg.without(musicList, randomValue); // Remove the played music from the list

                playNextMusic(); // Replay with next music file
            });
        };

        playNextMusic(); // Start the first song
    }
}
