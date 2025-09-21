import fs from "fs";
import Logger from "../../../../services/Logger";
import path from "path";
import {ChannelInterface} from "../../interfaces/ChannelInterface";
import {JsonLoader} from "../../utils/JsonLoader";
import {ChannelValidator} from "../../validators/ChannelValidator";
import ChannelPlaylist from "./ChannelPlaylist";

class Channel {
    private static instance: Channel;
    private channels: Map<string, ChannelInterface> = new Map();

    constructor(private readonly playlist = ChannelPlaylist) {
    }

    static getInstance(): Channel {
        if (!Channel.instance) Channel.instance = new Channel();
        return Channel.instance;
    }

    load(date: Date = new Date()): Map<string, ChannelInterface> {
        this.channels.clear();
        const dirPath = path.join(process.cwd(), "channels");
        const map = new Map<string, ChannelInterface>();

        if (!fs.existsSync(dirPath)) {
            Logger.warn("Channels directory does not exist: " + dirPath, "channel");
            return map;
        }

        fs.readdirSync(dirPath)
            .filter(file => file.endsWith(".json"))
            .forEach(file => {
                const name = file.replace(".json", "");
                const channel = JsonLoader.loadFromFile<ChannelInterface>(
                    path.join(dirPath, file),
                    ChannelValidator.validateChannel,
                    "channel"
                );
                if (channel.enabled) map.set(name, channel);
            });

        this.channels = map;

        Logger.info(`Found ${this.channels.size} channel(s).`, "channel");

        this.playlist.load(this.channels, date);

        return this.channels;
    }
}


export default Channel.getInstance();
