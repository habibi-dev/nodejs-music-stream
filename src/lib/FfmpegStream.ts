import Ffmpeg from "fluent-ffmpeg";
import {basename, resolve} from 'path';
import {get} from "lodash";
import {ServerInterface} from "../interfaces/ServerInterface";

export default class FfmpegStream {
    private ffmpeg: Ffmpeg.FfmpegCommand;
    private readonly file: string;
    private readonly server: ServerInterface;

    constructor(file: string, server: ServerInterface) {
        this.file = resolve(file);
        this.ffmpeg = Ffmpeg();
        this.server = server;

        this.setupFfmpeg();
    }

    private setupFfmpeg(): void {
        const {cover, audio_bitrate, audio_codec, media_type, audio_sample_rate, audio_channels} = this.server;

        if (media_type === "video") {
            this.ffmpeg = this.ffmpeg
                .input(resolve(cover))
                .inputOption('-loop 1')
                .input(resolve(this.file))
                .inputOption('-re')
                .videoCodec('libx264')
                .outputOption('-pix_fmt yuv420p')
                .outputOption('-shortest')
                .outputOption('-r 24')
                .outputOption('-probesize 1000000')
                .outputOption('-analyzeduration 1000000')
                .outputOption('-maxrate 1000k')
                .outputOption('-bufsize 2000k');
        } else {
            this.ffmpeg = this.ffmpeg
                .input(resolve(this.file))
                .inputOption('-re');
        }

        this.ffmpeg = this.ffmpeg
            .audioCodec(audio_codec)
            .audioBitrate(audio_bitrate)
            .outputOption(`-ar ${audio_sample_rate}`)
            .outputOption(`-ac ${audio_channels}`);
    }

    async stream(output: string, callback: () => void, callbackError: (err: Error) => void): Promise<void> {
        const {media_type, scale, label} = this.server;

        try {
            const metaData = await this.getMetadata(this.file);
            const cleanedTitle = this.cleanMetadata(get(metaData, "title", "Unknown Title"));
            const cleanedArtist = this.cleanMetadata(get(metaData, "artist", "Unknown Artist"));
            const cleanedAlbum = this.cleanMetadata(get(metaData, "album", "Unknown Album"));
            const cleanedYear = this.cleanMetadata(get(metaData, "year", "Unknown Year"));

            if (media_type === "video") {
                this.ffmpeg.videoFilter([
                    `scale=${scale}`,
                    `drawtext=text='${cleanedTitle}':fontcolor=white:fontsize=34:x=35:y=h-th-35`
                ]);
            } else {
                this.ffmpeg = this.ffmpeg
                    .outputOption('-metadata', `title=${cleanedTitle}`)
                    .outputOption('-metadata', `artist=${cleanedArtist}`)
                    .outputOption('-metadata', `album=${cleanedAlbum}`)
                    .outputOption('-metadata', `year=${cleanedYear}`);
            }

            this.ffmpeg.format('flv').output(output)
                .on('start', (command) => {
                    // console.log(command);
                    console.log("\x1b[32m%s\x1b[0m", `🔃 ${label} - Starting Stream ${basename(this.file)}`);
                })
                .on('end', callback)
                .on('error', (err) => {
                    console.error(`⚠️ ${label} - Error during stream: ${err.message}`);
                    callbackError(err);
                })
                .run();
        } catch (err: any) {
            console.error(`⚠️ ${label} - Error fetching metadata: ${err.message}`);
            callbackError(err);
        }
    }

    private getMetadata(file: string): Promise<any> {
        const {label} = this.server;

        return new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(file, (err, metadata) => {
                if (err) {
                    console.error(`⚠️ ${label} - Error reading metadata: ${err.message}`);
                    return reject(err);
                }

                const tags = get(metadata, "format.tags", {});
                resolve({
                    title: get(tags, "title", "Unknown Title"),
                    artist: get(tags, "artist", "Unknown Artist"),
                    album: get(tags, "album", "Unknown Album"),
                    year: get(tags, "date", "Unknown Year")
                });
            });
        });
    }

    private cleanMetadata(value: string): string {
        const cleanedValue = value.replace(/[^a-zA-Z0-9\u0600-\u06FF \.\-\_]/g, '').substring(0, 30);

        return `"${cleanedValue}"`;
    }

}
