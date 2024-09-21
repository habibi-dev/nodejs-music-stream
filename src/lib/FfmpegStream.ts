import Ffmpeg from "fluent-ffmpeg";
import {basename, resolve} from 'path';
import pkg from "lodash";

export default class FfmpegStream {
    private ffmpeg: Ffmpeg.FfmpegCommand;
    private readonly file: string;

    constructor(file: string, cover: string) {
        this.file = resolve(file);
        this.ffmpeg = Ffmpeg();

        this.setupFfmpeg(cover);
    }

    private setupFfmpeg(cover: string): void {
        const audioCodec = pkg.get(process, "env.AUDIO_CODEC", "aac") as string;
        const mediaType = pkg.get(process, "env.MEDIA_TYPE", "video") as string;
        const audioSampleRate = pkg.get(process, "env.AUDIO_SAMPLE_RATE", "48000") as string;
        const audioChannels = pkg.get(process, "env.AUDIO_CHANNELS", "2") as string;
        const audioBitrate = pkg.get(process, "env.AUDIO_BITRATE", "128k") as string;

        if (mediaType === "video") {
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
            .audioCodec(audioCodec)
            .audioBitrate(audioBitrate)
            .outputOption(`-ar ${audioSampleRate}`)
            .outputOption(`-ac ${audioChannels}`);
    }

    async stream(output: string, callback: () => void): Promise<void> {
        try {
            const metaData = await this.getMetadata(this.file);
            const mediaType = pkg.get(process, "env.MEDIA_TYPE", "video") as string;
            const scale = pkg.get(process, "env.SCALE", "1280:720") as string;
            const cleanedTitle = this.cleanMetadata(pkg.get(metaData, "title", "Unknown Title"));
            const cleanedArtist = this.cleanMetadata(pkg.get(metaData, "artist", "Unknown Artist"));
            const cleanedAlbum = this.cleanMetadata(pkg.get(metaData, "album", "Unknown Album"));
            const cleanedYear = this.cleanMetadata(pkg.get(metaData, "year", "Unknown Year"));

            if (mediaType === "video") {
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
                    console.log(command);
                    console.log("\x1b[32m%s\x1b[0m", `🔃  Starting Stream ${basename(this.file)}`);
                })
                .on('end', callback)
                .on('error', (err) => {
                    console.error(`Error during stream: ${err.message}`);
                })
                .run();
        } catch (err: any) {
            console.error(`Error fetching metadata: ${err.message}`);
        }
    }

    private getMetadata(file: string): Promise<any> {
        return new Promise((resolve, reject) => {
            Ffmpeg.ffprobe(file, (err, metadata) => {
                if (err) {
                    console.error(`Error reading metadata: ${err.message}`);
                    return reject(err);
                }

                const tags = pkg.get(metadata, "format.tags", {});
                resolve({
                    title: pkg.get(tags, "title", "Unknown Title"),
                    artist: pkg.get(tags, "artist", "Unknown Artist"),
                    album: pkg.get(tags, "album", "Unknown Album"),
                    year: pkg.get(tags, "date", "Unknown Year")
                });
            });
        });
    }

    private cleanMetadata(value: string): string {
        const cleanedValue = value.replace(/[^a-zA-Z0-9\u0600-\u06FF \.\-\_]/g, '').substring(0, 30);

        return `"${cleanedValue}"`;
    }

}
