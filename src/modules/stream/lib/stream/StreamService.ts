import Logger from "../../../../services/Logger";
import {ChannelInterface} from "../../interfaces/ChannelInterface";
import Channel from "../channel/Channel";
import ChannelPlaylist from "../channel/ChannelPlaylist";
import {StreamChannelStateManager} from "./StreamChannelStateManager";
import {StreamFFmpegArgsBuilder} from "./StreamFFmpegArgsBuilder";
import {StreamFFmpegProcessManager} from "./StreamFFmpegProcessManager";
import {StreamDirectoryManager} from "./StreamDirectoryManager";
import StreamPresets from "../../config/StreamPresets";
import StreamOverlay from "../../config/StreamOverlay";
import {StreamChannelRuntime} from "./StreamChannelRuntime";

class StreamService {
    private static instance: StreamService;
    private channels = new Map<string, ChannelInterface>();
    private channelRuntimes = new Map<string, StreamChannelRuntime>();
    private timer: NodeJS.Timeout | null = null;
    private currentPlaylistDateKey: string | null = null;
    private isReloading = false;

    constructor(
        private readonly stateManager = new StreamChannelStateManager(),
        private readonly argsBuilder = new StreamFFmpegArgsBuilder(),
        private readonly processManager = new StreamFFmpegProcessManager(),
        private readonly directoryManager = new StreamDirectoryManager(),
        private readonly channelReader = Channel,
        private readonly playlist = ChannelPlaylist,
        private readonly pollMs = 2000
    ) {}

    static getInstance(): StreamService {
        if (!StreamService.instance) {
            StreamService.instance = new StreamService();
        }
        return StreamService.instance;
    }

    // Lifecycle methods
    async init(date: Date = new Date()): Promise<void> {
        Logger.info("StreamService initialization started", "stream");

        this.directoryManager.clearOldHlsDirectories();
        this.directoryManager.ensureHlsDirectories();
        this.channels = this.channelReader.load(date);
        this.currentPlaylistDateKey = this.toDateKey(date);

        this.stateManager.clearAll();
        this.channelRuntimes.clear();

        for (const [channelId, channel] of this.channels) {
            this.stateManager.initChannel(channelId);
            this.directoryManager.ensureChannelDirectory(channelId);

            this.channelRuntimes.set(
                channelId,
                new StreamChannelRuntime(
                    channelId,
                    channel,
                    this.stateManager,
                    this.argsBuilder,
                    this.processManager,
                    this.playlist
                )
            );
        }

        // Preload configurations
        void StreamPresets.getPresetNames();
        void StreamOverlay.getConfig();

        Logger.info(`StreamService initialized with ${this.channels.size} channels`, "stream");
    }

    start(): void {
        if (this.timer) return;

        Logger.info("StreamService main loop started", "stream");
        this.timer = setInterval(() => this.tick(), this.pollMs);
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.stopAllChannels();
        Logger.info("StreamService stopped", "stream");
    }

    private tick(): void {
        const now = new Date();
        const dateKey = this.toDateKey(now);

        if (this.currentPlaylistDateKey !== dateKey) {
            this.reloadForDate(now);
        }

        for (const [channelId, runtime] of this.channelRuntimes) {
            const channel = this.channels.get(channelId);
            if (!channel) continue;

            runtime.updateChannel(channel);
            runtime.tick(now);
        }
    }

    private stopAllChannels(): void {
        for (const runtime of this.channelRuntimes.values()) {
            runtime.shutdown();
        }
    }

    private reloadForDate(date: Date): void {
        if (this.isReloading) {
            return;
        }

        this.isReloading = true;
        const targetKey = this.toDateKey(date);

        try {
            Logger.info(`Rolling playlist date forward to ${targetKey}`, "stream");

            this.stopAllChannels();
            this.stateManager.clearAll();
            this.channelRuntimes.clear();

            this.channels = this.channelReader.load(date);
            this.currentPlaylistDateKey = targetKey;

            for (const [channelId, channel] of this.channels) {
                this.stateManager.initChannel(channelId);
                this.directoryManager.ensureChannelDirectory(channelId);

                this.channelRuntimes.set(
                    channelId,
                    new StreamChannelRuntime(
                        channelId,
                        channel,
                        this.stateManager,
                        this.argsBuilder,
                        this.processManager,
                        this.playlist
                    )
                );
            }

            Logger.info(`Reloaded channels for new day count=${this.channels.size}`, "stream");
        } catch (error: any) {
            Logger.error(`Failed to reload channels for ${targetKey}: ${error?.message ?? error}`, "stream");
        } finally {
            this.isReloading = false;
        }
    }

    private toDateKey(date: Date): string {
        return date.toISOString().slice(0, 10);
    }
}

export default StreamService.getInstance();
