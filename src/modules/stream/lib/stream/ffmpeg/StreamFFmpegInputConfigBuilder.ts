import ChannelPlaylistFile from "../../channel/ChannelPlaylistFile";
import {PlaylistItemInterface} from "../../../interfaces/PlaylistItemInterface";
import {StreamChannelState} from "../StreamChannelStateManager";
import {FFmpegConfig} from "../StreamFFmpegArgsBuilder";
import Logger from "../../../../../services/Logger";

export class StreamFFmpegInputConfigBuilder {
    constructor(private file = ChannelPlaylistFile) {}

    build(
        playlist: PlaylistItemInterface,
        channelId: string,
        state: StreamChannelState
    ): FFmpegConfig {
        if (playlist.content_type === "live" && playlist.source_live?.url) {
            return this.buildLiveConfig(playlist.source_live.url);
        }

        return this.buildFileConfig(playlist, state);
    }

    private buildLiveConfig(url: string): FFmpegConfig {
        return {
            args: [
                "-re", "-reconnect", "1", "-reconnect_streamed", "1",
                "-reconnect_at_eof", "1", "-reconnect_delay_max", "10",
                "-i", url
            ]
        };
    }

    private buildFileConfig(playlist: PlaylistItemInterface, state: StreamChannelState): FFmpegConfig {
        const files = this.file.getFiles(playlist.id);
        const pickedPath = files[state.fileIdx]?.path ?? playlist.paths[0];

        if (!pickedPath) {
            Logger.warn(`No input file for playlist=${playlist.id}; using null sink`, "stream");
            return {args: ["-f", "lavfi", "-i", "anullsrc", "-t", "1"]};
        }

        return {
            args: ["-re", "-i", pickedPath],
            pickedPath
        };
    }
}
