import fs from "fs";
import path from "path";
import { PlaylistItemInterface } from "../../interfaces/PlaylistItemInterface";
import { FileItem, FileScanner } from "../../utils/FileScanner";
import Logger from "../../../../services/Logger";

class ChannelPlaylistFile {
    private static instance: ChannelPlaylistFile;
    private store = new Map<string, FileItem[]>();

    private constructor() {}

    static getInstance(): ChannelPlaylistFile {
        if (!ChannelPlaylistFile.instance) {
            ChannelPlaylistFile.instance = new ChannelPlaylistFile();
        }
        return ChannelPlaylistFile.instance;
    }

    // Build cache for a single playlist item
    buildForItem(item: PlaylistItemInterface): FileItem[] {
        if (!item) {
            Logger.warn(`buildForItem called with null item`, "channel-playlist-file");
            return [];
        }
        if (item.content_type === "live") {
            Logger.warn(`Skip live item: ${item.id}`, "channel-playlist-file");
            this.store.set(item.id, []);
            return [];
        }

        Logger.info(`Building file cache for item=${item.id}`, "channel-playlist-file");

        const exts = (item.extensions ?? []).map((e) => e.toLowerCase());
        const ignores = item.ignore_directories ?? [];
        const method = item.sorting?.method ?? "date";
        const order = item.sorting?.order ?? "asc";

        const collected: FileItem[] = [];
        for (const p of item.paths ?? []) {
            if (!p) continue;
            if (!this.safeExists(p)) {
                Logger.warn(`Path does not exist, skipped: ${p}`, "channel-playlist-file");
                continue;
            }

            const stat = fs.statSync(p);
            if (stat.isDirectory()) {
                const found = FileScanner.scan(p, exts, ignores);
                Logger.warn(`Scanned dir=${p} found=${found.length}`, "channel-playlist-file");
                collected.push(...found);
            } else {
                const ext = path.extname(p).toLowerCase();
                if (exts.length === 0 || exts.includes(ext)) {
                    collected.push({
                        path: p,
                        name: path.basename(p),
                        ext,
                        size: stat.size,
                        mtime: stat.mtime,
                        ctime: stat.ctime,
                    });
                    Logger.warn(`Added single file=${p}`, "channel-playlist-file");
                } else {
                    Logger.warn(`Skipped file=${p} (ext not allowed)`, "channel-playlist-file");
                }
            }
        }

        const unique = this.dedupByPath(collected);
        if (unique.length !== collected.length) {
            Logger.warn(
                `Deduplicated ${collected.length - unique.length} files for item=${item.id}`,
                "channel-playlist-file"
            );
        }

        const sorted = FileScanner.sort(unique, method as any, order as any);

        this.store.set(item.id, sorted);
        Logger.info(
            `File cache built for item=${item.id}, files=${sorted.length}`,
            "channel-playlist-file"
        );

        return sorted;
    }

    buildForItems(items: PlaylistItemInterface[]): void {
        Logger.info(`Building file cache for ${items.length} items`, "channel-playlist-file");
        for (const it of items) this.buildForItem(it);
    }

    getFiles(itemId: string): FileItem[] {
        const files = this.store.get(itemId) ?? [];
        Logger.warn(`getFiles item=${itemId} count=${files.length}`, "channel-playlist-file");
        return files;
    }

    has(itemId: string): boolean {
        const res = this.store.has(itemId);
        Logger.warn(`has item=${itemId} => ${res}`, "channel-playlist-file");
        return res;
    }

    delete(itemId: string): boolean {
        const res = this.store.delete(itemId);
        Logger.info(`delete item=${itemId} => ${res}`, "channel-playlist-file");
        return res;
    }

    clear(): void {
        this.store.clear();
        Logger.info(`Cleared entire file cache`, "channel-playlist-file");
    }

    private safeExists(p: string): boolean {
        try {
            return fs.existsSync(p);
        } catch (err: any) {
            Logger.error(`safeExists error path=${p} err=${err?.message ?? err}`, "channel-playlist-file");
            return false;
        }
    }

    private dedupByPath(items: FileItem[]): FileItem[] {
        const seen = new Set<string>();
        const out: FileItem[] = [];
        for (const f of items) {
            if (seen.has(f.path)) continue;
            seen.add(f.path);
            out.push(f);
        }
        return out;
    }
}

export default ChannelPlaylistFile.getInstance();
