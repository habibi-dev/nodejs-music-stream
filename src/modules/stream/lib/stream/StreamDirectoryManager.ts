import Logger from "../../../../services/Logger";
import path from "path";
import fs from "fs";

export class StreamDirectoryManager {
    private hlsRoot = path.join(process.cwd(), "public", "hls");

    ensureHlsDirectories(): void {
        this.ensureDirectory(this.hlsRoot);
        Logger.info(`HLS root directory ensured: ${this.hlsRoot}`, "stream");
    }

    ensureChannelDirectory(channelId: string): void {
        const channelDir = path.join(this.hlsRoot, channelId);
        this.ensureDirectory(channelDir);
        Logger.debug(`HLS channel directory ensured: ${channelDir}`, "stream");
    }

    private ensureDirectory(dirPath: string): void {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, {recursive: true});
            }
        } catch (e: any) {
            Logger.error(`Failed to create directory ${dirPath}: ${e?.message ?? e}`, "stream");
            throw e;
        }
    }

    clearOldHlsDirectories() {
        try {
            const entries = fs.readdirSync(this.hlsRoot, {withFileTypes: true});
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const dirPath = path.join(this.hlsRoot, entry.name);
                    fs.rmSync(dirPath, {recursive: true, force: true});
                    Logger.info(`Removed old HLS directory: ${dirPath}`, "stream");
                }
            }
        } catch (e: any) {
            Logger.error(`Failed to clear old HLS directories: ${e?.message ?? e}`, "stream");
        }
    }
}