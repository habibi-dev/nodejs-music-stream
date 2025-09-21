import {PlaylistItemInterface} from "../../interfaces/PlaylistItemInterface";
import {ChannelInterface} from "../../interfaces/ChannelInterface";
import Logger from "../../../../services/Logger";
import ChannelPlaylist from "../channel/ChannelPlaylist";
import ChannelPlaylistFile from "../channel/ChannelPlaylistFile";
import {StreamChannelState, StreamChannelStateManager} from "./StreamChannelStateManager";
import {StreamFFmpegArgsBuilder} from "./StreamFFmpegArgsBuilder";
import {StreamFFmpegProcessManager} from "./StreamFFmpegProcessManager";

const LOOP_PLAYLIST_FILES = true;

export class StreamChannelRuntime {
    private retryTimer: NodeJS.Timeout | null = null;

    constructor(
        private readonly channelId: string,
        private channel: ChannelInterface,
        private readonly stateManager: StreamChannelStateManager,
        private readonly argsBuilder: StreamFFmpegArgsBuilder,
        private readonly processManager: StreamFFmpegProcessManager,
        private readonly playlist = ChannelPlaylist,
        private readonly playlistFiles = ChannelPlaylistFile,
    ) {}

    tick(now: Date): void {
        if (!this.channel.enabled) {
            this.stopIfRunning("Channel disabled");
            return;
        }

        const state = this.getState();
        const currentItem = this.playlist.getCurrent(this.channelId, now);

        if (!currentItem) {
            this.stopIfRunning("No active playlist item");
            return;
        }

        if (state.proc && state.currentItemId === currentItem.id) {
            return; // already streaming the current item
        }

        this.restartWith(currentItem);
    }

    updateChannel(channel: ChannelInterface): void {
        this.channel = channel;
    }

    shutdown(): void {
        this.stopIfRunning("Service shutdown");
        this.clearRetryTimer();
    }

    private restartWith(playlist: PlaylistItemInterface): void {
        this.stopIfRunning();
        this.startProcess(playlist);
    }

    private startProcess(playlist: PlaylistItemInterface): void {
        const state = this.getState();

        try {
            const args = this.argsBuilder.buildArgs(this.channelId, this.channel, playlist, state);

            state.proc = this.processManager.startProcess(
                this.channelId,
                args,
                (code) => this.handleProcessClose(playlist, code),
                (error) => this.handleProcessError(error)
            );
            state.currentItemId = playlist.id;

            this.logChannelStart(playlist, state);
        } catch (err: any) {
            Logger.error(`Failed to start channel=${this.channelId}: ${err?.message ?? err}`, "stream");
            state.proc = null;
        }
    }

    private handleProcessClose(playlist: PlaylistItemInterface, code: number | null): void {
        const state = this.getState();
        state.proc = null;

        const currentItem = this.playlist.getCurrent(this.channelId, new Date());
        const stillSamePlaylist = currentItem?.id === playlist.id;

        if (!stillSamePlaylist) {
            Logger.info(`Process closed; playlist changed for channel=${this.channelId} code=${code}`, "stream");
            this.stateManager.resetState(this.channelId);
            this.queueTick();
            return;
        }

        this.handleFileAdvancement(playlist, code);
    }

    private handleFileAdvancement(playlist: PlaylistItemInterface, code: number | null): void {
        const files = this.playlistFiles.getFiles(playlist.id);

        if (files.length === 0) {
            Logger.warn(`Empty file list for playlist=${playlist.id}; stopping`, "stream");
            this.stateManager.resetState(this.channelId);
            return;
        }

        const completedCycle = this.stateManager.advanceFile(this.channelId, files.length, LOOP_PLAYLIST_FILES);

        if (code !== 0) {
            this.handleError();
        } else {
            this.handleSuccess(files.length, completedCycle, playlist);
        }
    }

    private handleError(): void {
        this.stateManager.setBackoff(this.channelId, true);
        const delay = this.stateManager.getBackoffDelay(this.channelId);

        Logger.warn(`FFmpeg error; retrying after ${delay}ms for channel=${this.channelId}`, "stream");
        this.scheduleRetry(delay);
    }

    private handleSuccess(totalFiles: number, completedCycle: boolean, playlist: PlaylistItemInterface): void {
        const state = this.getState();

        if (completedCycle) {
            try {
                const refreshed = this.playlistFiles.buildForItem(playlist);
                Logger.info(
                    `Completed playlist cycle; refreshed ${refreshed.length} file(s) for channel=${this.channelId}`,
                    "stream"
                );
            } catch (error: any) {
                Logger.error(
                    `Failed to refresh files after playlist cycle for channel=${this.channelId}: ${error?.message ?? error}`,
                    "stream"
                );
            }
        }

        if (!LOOP_PLAYLIST_FILES && state.fileIdx >= totalFiles - 1) {
            Logger.info(`Reached end of playlist (no loop) for channel=${this.channelId}`, "stream");
            state.currentItemId = null;
            return;
        }

        this.stateManager.setBackoff(this.channelId, false);
        this.queueTick();
    }

    private handleProcessError(error: Error): void {
        Logger.error(`FFmpeg spawn error for channel=${this.channelId}: ${error.message}`, "stream");
        const state = this.getState();
        state.proc = null;
        this.scheduleRetry(this.stateManager.getBackoffDelay(this.channelId));
    }

    private stopIfRunning(reason?: string): void {
        const state = this.getState();
        if (!state.proc) {
            return;
        }

        if (reason) {
            Logger.info(`${reason}; stopping channel=${this.channelId}`, "stream");
        } else {
            Logger.info(`Stopping channel=${this.channelId}`, "stream");
        }

        this.processManager.stopProcess(state.proc, this.channelId);
        state.proc = null;
        state.currentItemId = null;
        this.clearRetryTimer();
    }

    private scheduleRetry(delay: number): void {
        this.clearRetryTimer();
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.queueTick();
        }, delay);
    }

    private queueTick(): void {
        setTimeout(() => this.tick(new Date()), 0);
    }

    private clearRetryTimer(): void {
        if (!this.retryTimer) return;
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
    }

    private logChannelStart(playlist: PlaylistItemInterface, state: StreamChannelState): void {
        const files = this.playlistFiles.getFiles(playlist.id);
        const timeRange = ` -> `;

        Logger.info(
            `Started FFmpeg: channel=${this.channelId} playlist=${timeRange} file=${state.fileIdx + 1}/${files.length}`,
            "stream"
        );
    }

    private getState(): StreamChannelState {
        const state = this.stateManager.getState(this.channelId);
        if (!state) {
            throw new Error(`Channel state missing for ${this.channelId}`);
        }
        return state;
    }
}




