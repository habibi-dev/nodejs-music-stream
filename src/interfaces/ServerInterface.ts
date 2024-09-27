export interface ServerInterface {
    "main": string,
    "stream_key": string,
    "url_rtmp": string,
    "dir": string,
    "media_type": "video" | "audio",
    "cover": string,
    "audio_codec": string,
    "audio_sample_rate": number,
    "audio_channels": 1 | 2,
    "audio_bitrate": string,
    "scale": string,
    "ignore_directories": string[]
}