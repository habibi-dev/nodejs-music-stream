import { ChannelInterface } from "../../interfaces/ChannelInterface";
import { PlaylistItemInterface } from "../../interfaces/PlaylistItemInterface";
import ChannelPlaylistFile from "./ChannelPlaylistFile";
import Logger from "../../../../services/Logger";

class ChannelPlaylist {
    private static instance: ChannelPlaylist;
    private playlists: Map<string, PlaylistItemInterface[]> = new Map();

    private constructor(private readonly files = ChannelPlaylistFile) {}

    static getInstance(): ChannelPlaylist {
        if (!ChannelPlaylist.instance) ChannelPlaylist.instance = new ChannelPlaylist();
        return ChannelPlaylist.instance;
    }

    // Build per-channel merged playlist for given date, then build file cache
    load(channels: Map<string, ChannelInterface>, date: Date = new Date()): void {
        Logger.info(`ChannelPlaylist.load start: channels=${channels.size} date=${date.toISOString()}`, "channel-playlist");
        this.playlists.clear();

        for (const [channelId, channel] of channels) {
            if (!channel.enabled) {
                Logger.warn(`Skip disabled channel: ${channelId}`, "channel-playlist");
                continue;
            }
            if (!channel.schedule?.length) {
                Logger.warn(`Channel has no schedule: ${channelId}`, "channel-playlist");
                continue;
            }

            // 1) Normalize raw items
            const raw: PlaylistItemInterface[] = channel.schedule
                .map((s) => {
                    const startUtc = this.toDateTime(s.start, date);
                    const endUtc = this.toDateTime(s.end, date);
                    if (endUtc <= startUtc) {
                        Logger.warn(`Skip invalid slot (end<=start) channel=${channelId} start=${s.start} end=${s.end}`, "channel-playlist");
                        return null;
                    }
                    return {
                        id: this.makeId(channelId, startUtc, endUtc),
                        startUtc,
                        endUtc,
                        content_type: s.content_type,
                        start: s.start,
                        end: s.end,
                        paths: s.paths,
                        ignore_directories: s.ignore_directories,
                        extensions: s.extensions,
                        presets: s.presets,
                        sorting: s.sorting,
                        overlay: s.overlay,
                        source_live: s.source_live,
                    } as PlaylistItemInterface;
                })
                .filter((x): x is PlaylistItemInterface => x !== null);

            if (!raw.length) {
                Logger.warn(`No valid schedule items after normalization: ${channelId}`, "channel-playlist");
                continue;
            }

            // 2) Order by duration (longest first); treat longest as base, others as overrides
            const withDur = raw
                .map((it) => ({ it, dur: it.endUtc.getTime() - it.startUtc.getTime() }))
                .sort((a, b) => b.dur - a.dur);

            const base = withDur[0].it;
            Logger.info(
                `Channel=${channelId} raw_slots=${raw.length} base_slot=${base.startUtc.toISOString()}→${base.endUtc.toISOString()}`,
                "channel-playlist"
            );

            let merged: PlaylistItemInterface[] = [base];

            // 3) Apply remaining slots as overrides (shorter first)
            const overrides = withDur.slice(1).sort((a, b) => a.dur - b.dur).map(x => x.it);
            for (const o of overrides) {
                merged = this.applyOverride(merged, o);
                Logger.warn(
                    `Applied override channel=${channelId} slot=${o.startUtc.toISOString()}→${o.endUtc.toISOString()} merged_count=${merged.length}`,
                    "channel-playlist"
                );
            }

            merged.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
            this.playlists.set(channelId, merged);

            Logger.info(
                `Channel=${channelId} merged_slots=${merged.length}`,
                "channel-playlist"
            );

            // 4) Build file cache for this channel's merged items
            try {
                this.files.buildForItems(merged);
                Logger.info(
                    `Channel=${channelId} file-cache built for ${merged.length} slots`,
                    "channel-playlist"
                );
            } catch (err: any) {
                Logger.error(
                    `File-cache build failed channel=${channelId} error=${err?.message ?? err}`,
                    "channel-playlist"
                );
            }
        }

        Logger.info(`ChannelPlaylist.load done. built=${this.playlists.size}`, "channel-playlist");
    }

    // O(log n) fetch current item
    getCurrent(channelId: string, now: Date = new Date()): PlaylistItemInterface | null {
        const items = this.playlists.get(channelId);
        if (!items || items.length === 0) {
            Logger.warn(`getCurrent: no playlist for channel=${channelId}`, "channel-playlist");
            return null;
        }

        let lo = 0, hi = items.length - 1;
        const t = now.getTime();

        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const s = items[mid].startUtc.getTime();
            const e = items[mid].endUtc.getTime();
            if (t < s) hi = mid - 1;
            else if (t >= e) lo = mid + 1;
            else {
                // hit
                return items[mid];
            }
        }

        Logger.warn(
            `getCurrent: no active slot channel=${channelId} now=${now.toISOString()}`,
            "channel-playlist"
        );
        return null;
    }

    getPlaylist(channelId: string): PlaylistItemInterface[] {
        return this.playlists.get(channelId) ?? [];
    }

    private applyOverride(base: PlaylistItemInterface[], o: PlaylistItemInterface): PlaylistItemInterface[] {
        const out: PlaylistItemInterface[] = [];
        const os = o.startUtc.getTime();
        const oe = o.endUtc.getTime();
        const chIdFrom = (id: string) => this.extractChannelId(id);

        for (const b of base) {
            const bs = b.startUtc.getTime();
            const be = b.endUtc.getTime();

            if (oe <= bs || os >= be) { out.push(b); continue; }

            if (bs < os) {
                out.push({ ...b, endUtc: new Date(os), id: this.makeId(chIdFrom(b.id), b.startUtc, new Date(os)) });
            }
            out.push(o);
            if (be > oe) {
                out.push({ ...b, startUtc: new Date(oe), id: this.makeId(chIdFrom(b.id), new Date(oe), b.endUtc) });
            }
        }
        return out;
    }

    private toDateTime(hhmm: string, date: Date): Date {
        const [h, m] = hhmm.split(":").map(Number);
        const d = new Date(date);
        d.setUTCHours(h, m, 0, 0);
        return d;
    }

    private makeId(channelId: string, start: Date, end: Date): string {
        return `${channelId}_${start.getTime()}_${end.getTime()}`;
    }

    private extractChannelId(id: string): string {
        const idx = id.lastIndexOf("_");
        if (idx === -1) return id;
        const idx2 = id.lastIndexOf("_", idx - 1);
        return idx2 === -1 ? id : id.slice(0, idx2);
    }
}

export default ChannelPlaylist.getInstance();
