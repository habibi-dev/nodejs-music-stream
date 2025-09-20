import path from "path";

const channelsDir = process.env.CHANNELS_DIR
    ? path.resolve(process.env.CHANNELS_DIR)
    : path.join(process.cwd(), "channels");

const hlsBaseUrl = (() => {
    const raw = process.env.HLS_BASE_URL ?? "/hls";
    if (!raw.length) return "/hls";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
})();

const hlsRootDir = process.env.HLS_ROOT_DIR
    ? path.resolve(process.env.HLS_ROOT_DIR)
    : path.join(process.cwd(), "public", "hls");

export const StreamPathsConfig = {
    getChannelsDir(): string {
        return channelsDir;
    },
    getChannelConfigPath(channelId: string): string {
        return path.join(channelsDir, `${channelId}.json`);
    },
    getChannelStorageDir(channelId: string): string {
        return path.join(channelsDir, channelId);
    },
    getHlsPlaylistUrl(channelId: string): string {
        return `${hlsBaseUrl}/${channelId}/index.m3u8`;
    },
    getHlsOutputDir(channelId: string): string {
        return path.join(hlsRootDir, channelId);
    }
};
