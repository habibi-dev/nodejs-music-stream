import path from "path";
import {ChannelInterface} from "../../../interfaces/ChannelInterface";
import Logger from "../../../../../services/Logger";
import {StreamChannelState} from "../StreamChannelStateManager";

const HLS_FLAGS = ["append_list", "program_date_time", "delete_segments", "omit_endlist"].join("+");
const HLS_TIME_SECONDS = "15";
const HLS_LIST_SIZE = "6";

export class StreamFFmpegOutputConfigBuilder {
    buildOutputArgs(
        channelId: string,
        channel: ChannelInterface,
        state?: StreamChannelState
    ): string[] {
        const localEnabled = channel.output.local?.enabled === true;
        const remoteEnabled = channel.output.remote?.enabled === true;
        const rtmpUrl = this.buildRtmpUrl(channel);

        if (localEnabled && remoteEnabled && rtmpUrl) {
            return this.buildTeeOutput(channelId, rtmpUrl, state);
        }

        if (localEnabled) {
            return this.buildHlsOutput(channelId, state);
        }

        if (remoteEnabled && rtmpUrl) {
            return ["-f", "flv", rtmpUrl];
        }

        Logger.warn(`No output enabled for channel=${channelId}; using null output`, "stream");
        return ["-f", "null", "-"];
    }

    private buildRtmpUrl(channel: ChannelInterface): string {
        const {url, stream_key} = channel.output.remote || {};
        return (url && stream_key) ? `${url}/${stream_key}` : "";
    }

    private buildTeeOutput(channelId: string, rtmpUrl: string, state?: StreamChannelState): string[] {
        const hlsPath = this.getHlsPath(channelId);
        const startNumber = state?.segmentIndex ?? 0;
        const targets = [
            `[f=hls:hls_time=${HLS_TIME_SECONDS}:hls_list_size=${HLS_LIST_SIZE}:hls_flags=${HLS_FLAGS}:start_number=${startNumber}]${hlsPath}`,
            `[f=flv]${rtmpUrl}`
        ].join("|");

        return ["-f", "tee", targets];
    }

    private buildHlsOutput(channelId: string, state?: StreamChannelState): string[] {
        const hlsPath = this.getHlsPath(channelId);
        const startNumber = state?.segmentIndex ?? 0;

        return [
            "-f", "hls",
            "-hls_time", HLS_TIME_SECONDS,
            "-hls_list_size", HLS_LIST_SIZE,
            "-hls_flags", HLS_FLAGS,
            "-start_number", startNumber.toString(),
            hlsPath
        ];
    }

    private getHlsPath(channelId: string): string {
        const hlsPath = path.join(process.cwd(), "public", "hls", channelId, "index.m3u8");
        return hlsPath.replace(/\\/g, "/");
    }
}
