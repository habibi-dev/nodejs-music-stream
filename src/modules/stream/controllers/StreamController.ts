import {Request, Response} from "express";
import {existsSync, readFileSync, statSync} from "node:fs";
import {StreamPathsConfig} from "../config/StreamPathsConfig";
import {ChannelValidator} from "../validators/ChannelValidator";
import {ChannelInterface} from "../interfaces/ChannelInterface";
import ResponseHandler from "../../../utils/ResponseHandler";

export class StreamController {
    static channel = (req: Request, res: Response) => {
        try {
            const rawId = req.params?.channelId ?? req.params?.id ?? "";
            const channelId = StreamController.filterSafeString(rawId);

            if (!channelId || channelId !== rawId) {
                return StreamController.notFound(req, res);
            }

            const channelConfigPath = StreamPathsConfig.getChannelConfigPath(channelId);
            if (!existsSync(channelConfigPath)) {
                return StreamController.notFound(req, res);
            }

            const channelConfig = StreamController.loadChannelConfig(channelConfigPath);
            ChannelValidator.validateChannel(channelConfig);

            const title = channelConfig.name?.trim() || `Channel ${channelId}`;
            const hlsDir = StreamPathsConfig.getHlsOutputDir(channelId);
            const channelDirExists = existsSync(hlsDir);
            if (channelDirExists) {
                try {
                    // Touch stat to ensure access; ignore result
                    statSync(hlsDir);
                } catch {
                    // ignore failures; directory presence already checked
                }
            }

            const streamM3u8Url = StreamPathsConfig.getHlsPlaylistUrl(channelId);

            res.set("Cache-Control", "no-store, no-cache, must-revalidate");
            res.type("html");

            return res.render("stream/player", {
                title,
                channelId,
                streamM3u8Url,
                autoplayMuted: true,
                cacheBust: Date.now()
            });
        } catch (error) {
            return ResponseHandler.Error(req, res, 500, "Failed to load channel");
        }
    };

    private static loadChannelConfig(path: string): ChannelInterface {
        const raw = readFileSync(path, "utf-8");
        return JSON.parse(raw) as ChannelInterface;
    }

    private static notFound(req: Request, res: Response) {
        return ResponseHandler.Error(req, res, 404, "Channel not found");
    }

    private static filterSafeString(input: string): string {
        return input.replace(/[^a-zA-Z0-9_-]/g, "");
    }
}
