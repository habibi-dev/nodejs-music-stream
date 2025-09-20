import {PlaylistItemInterface} from "../../interfaces/PlaylistItemInterface";
import StreamPresets from "../../config/StreamPresets";
import StreamOverlay from "../../config/StreamOverlay";
import {ChannelInterface} from "../../interfaces/ChannelInterface";
import {StreamChannelState} from "./StreamChannelStateManager";
import Logger from "../../../../services/Logger";
import path from "path";
import {StreamFFmpegOutputConfigBuilder} from "./ffmpeg/StreamFFmpegOutputConfigBuilder";
import {StreamFFmpegFilterComplexBuilder} from "./ffmpeg/StreamFFmpegFilterComplexBuilder";
import {StreamFFmpegMediaAnalyzer} from "./ffmpeg/StreamFFmpegMediaAnalyzer";
import {StreamFFmpegInputConfigBuilder} from "./ffmpeg/StreamFFmpegInputConfigBuilder";
import {StreamFFmpegPresetUtils} from "./ffmpeg/StreamFFmpegPresetUtils";

export type FFmpegConfig = {
    args: string[];
    pickedPath?: string;
};

export type MediaInfo = {
    isAudioOnly: boolean;
    durationSec?: number;
    title: string;
    artist: string;
    album: string;
    year: string;
    nowPlayingTitle?: string;
};

export class StreamFFmpegArgsBuilder {
    private inputBuilder = new StreamFFmpegInputConfigBuilder();
    private mediaAnalyzer = new StreamFFmpegMediaAnalyzer();
    private filterBuilder = new StreamFFmpegFilterComplexBuilder();
    private outputBuilder = new StreamFFmpegOutputConfigBuilder();

    buildArgs(
        channelId: string,
        channel: ChannelInterface,
        playlist: PlaylistItemInterface,
        state: StreamChannelState
    ): string[] {
        const inputConfig = this.inputBuilder.build(playlist, channelId, state);
        const mediaInfo = this.mediaAnalyzer.analyze(inputConfig.pickedPath);
        const isAudioOnly = mediaInfo?.isAudioOnly ?? false;

        return this.assembleStreamArgs(channelId, channel, playlist, inputConfig, mediaInfo, isAudioOnly);
    }

    private assembleStreamArgs(
        channelId: string,
        channel: ChannelInterface,
        playlist: PlaylistItemInterface,
        inputConfig: FFmpegConfig,
        mediaInfo: MediaInfo | null,
        isAudioOnly: boolean
    ): string[] {
        const args = ["-hide_banner", "-y"];

        // Add inputs
        this.addInputs(args, inputConfig, isAudioOnly, playlist);

        // Add filter complex
        this.addFilterComplex(args, playlist, mediaInfo, isAudioOnly);

        // Add preset args and output
        args.push(...StreamFFmpegPresetUtils.getCleanPresetArgs(playlist));
        args.push(...this.outputBuilder.buildOutputArgs(channelId, channel));
        return args;
    }

    private addInputs(args: string[], inputConfig: FFmpegConfig, isAudioOnly: boolean, playlist: PlaylistItemInterface) {
        // Add main input (audio/video file or stream)
        args.push(...inputConfig.args);

        // Add cover input for audio-only content
        if (isAudioOnly) {
            const coverInput = this.getCoverInput(playlist);
            args.push(...coverInput);
        }

        // Add logo input if enabled (for both audio and video)
        if (StreamOverlay.isLogoEnabled()) {
            const logoConfig = StreamOverlay.getLogoConfig();
            const logoPath = path.isAbsolute(logoConfig.path)
                ? logoConfig.path
                : path.join(process.cwd(), logoConfig.path);

            if (require('fs').existsSync(logoPath)) {
                args.push("-i", logoPath);
            } else {
                Logger.warn(`Logo file not found: ${logoPath}`, "stream");
            }
        }
    }

    private addFilterComplex(args: string[], playlist: PlaylistItemInterface, mediaInfo: MediaInfo | null, isAudioOnly: boolean) {
        const filterComplex = this.filterBuilder.build(playlist, mediaInfo, isAudioOnly);

        if (filterComplex) {
            args.push("-filter_complex", filterComplex);
            args.push("-map", "[out]");

            if (isAudioOnly) {
                args.push("-map", "0:a", "-shortest");
            } else {
                args.push("-map", "0:a?");
            }
        } else {
            // No filter complex needed, map inputs directly
            if (isAudioOnly) {
                args.push("-map", "1:v", "-map", "0:a", "-shortest");
            } else {
                args.push("-map", "0");
            }
        }
    }

    private getCoverInput(playlist: PlaylistItemInterface): string[] {
        const coverInput = StreamOverlay.getCoverInputArgs?.();
        if (coverInput?.length > 0) {
            return coverInput;
        }

        const presetKey = playlist.presets?.[0] ?? "hd_720p";
        const vcfg = StreamPresets.getVideoConfig(presetKey);
        const targetScale = (vcfg?.scale?.trim()) ? vcfg.scale : "1280:720";

        return ["-f", "lavfi", "-i", `color=c=black:s=${targetScale}:r=25`];
    }
}