import {ChildProcessWithoutNullStreams} from "child_process";

export type StreamChannelState = {
    proc: ChildProcessWithoutNullStreams | null;
    currentItemId: string | null;
    fileIdx: number;
    backoffMs?: number;
    segmentIndex: number;
};

export class StreamChannelStateManager {
    private states = new Map<string, StreamChannelState>();

    initChannel(channelId: string): void {
        this.states.set(channelId, {
            proc: null,
            currentItemId: null,
            fileIdx: 0,
            backoffMs: 2000,
            segmentIndex: 0
        });
    }

    getState(channelId: string): StreamChannelState | undefined {
        return this.states.get(channelId);
    }

    resetState(channelId: string): void {
        const state = this.states.get(channelId);
        if (state) {
            state.currentItemId = null;
            state.fileIdx = 0;
            state.backoffMs = 2000;
            state.segmentIndex = 0;
        }
    }

    advanceFile(channelId: string, totalFiles: number, loop = true, producedSegments = 0): void {
        const state = this.states.get(channelId);
        if (!state) return;

        if (loop) {
            state.fileIdx = (state.fileIdx + 1) % totalFiles;
        } else {
            state.fileIdx = Math.min(state.fileIdx + 1, totalFiles - 1);
        }

        state.segmentIndex += producedSegments;
    }

    setBackoff(channelId: string, error = false): void {
        const state = this.states.get(channelId);
        if (!state) return;

        if (error) {
            const delay = state.backoffMs ?? 2000;
            state.backoffMs = Math.min(delay * 2, 15000);
        } else {
            state.backoffMs = 2000;
        }
    }

    getBackoffDelay(channelId: string): number {
        return this.states.get(channelId)?.backoffMs ?? 2000;
    }

    clearAll(): void {
        this.states.clear();
    }

    getAllChannelIds(): string[] {
        return Array.from(this.states.keys());
    }
}
