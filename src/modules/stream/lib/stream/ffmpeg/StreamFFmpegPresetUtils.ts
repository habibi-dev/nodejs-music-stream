import {PlaylistItemInterface} from "../../../interfaces/PlaylistItemInterface";
import StreamPresets from "../../../config/StreamPresets";

export class StreamFFmpegPresetUtils {
    static getCleanPresetArgs(playlist: PlaylistItemInterface): string[] {
        const presetKey = playlist.presets?.[0] ?? "hd_720p";
        const rawArgs = StreamPresets.getCompleteFFmpegArgs(presetKey);
        return this.stripVideoFilters(rawArgs);
    }

    private static stripVideoFilters(args: string[]): string[] {
        const result: string[] = [];

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (arg === "-vf" || arg === "-filter:v") {
                i++; // skip next argument
                continue;
            }

            if (arg.startsWith("-vf=") || arg.startsWith("-filter:v=")) {
                continue;
            }

            result.push(arg);
        }

        return result;
    }
}