import {MediaInfo} from "../StreamFFmpegArgsBuilder";
import {FFprobeService} from "../../ffmpeg/FFprobeService";
import Logger from "../../../../../services/Logger";

export class StreamFFmpegMediaAnalyzer {
    analyze(filePath?: string): MediaInfo | null {
        if (!filePath) return null;

        try {
            const raw = FFprobeService.probe(filePath);
            if (!raw) return null;

            const parsed = this.parseProbeResult(raw);
            const nowPlayingTitle = parsed.isAudioOnly ? `${parsed.artist} - ${parsed.title}` : undefined;

            Logger.debug(
                `Media info: audioOnly=${parsed.isAudioOnly} duration=${parsed.durationSec ?? "?"} title="${nowPlayingTitle}"`,
                "stream"
            );

            return {...parsed, nowPlayingTitle};
        } catch (e: any) {
            Logger.warn(`Failed to get media info for "${filePath}": ${e?.message ?? e}`, "stream");
            return null;
        }
    }

    private parseProbeResult(json: any): Omit<MediaInfo, 'nowPlayingTitle'> {
        const streams = Array.isArray(json?.streams) ? json.streams : [];
        const hasRealVideo = streams.some((s: any) =>
            s?.codec_type === "video" &&
            !(s?.disposition?.attached_pic === 1) &&
            (Number(s?.width) > 0 || Number(s?.height) > 0)
        );

        const format = json?.format ?? {};
        const formatTags = format.tags ?? {};
        const streamTags = (streams.find((s: any) => s?.tags) || {}).tags || {};

        const getTag = (key: string, defaultValue: string): string => {
            const streamValue = streamTags[key];
            const formatValue = formatTags[key];
            const value = streamValue || formatValue;
            return (typeof value === "string" && value.trim()) ? value : defaultValue;
        };

        return {
            isAudioOnly: !hasRealVideo,
            durationSec: format.duration ? Number(format.duration) : undefined,
            title: getTag("title", "Unknown Title"),
            artist: getTag("artist", "Unknown Artist"),
            album: getTag("album", "Unknown Album"),
            year: getTag("date", "Unknown Year")
        };
    }
}
