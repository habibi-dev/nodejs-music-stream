import Ffmpeg from "fluent-ffmpeg";
import {basename, resolve} from 'path';
import MP3Tag from "mp3tag.js";
import fs from "fs";
import pkg from "lodash";

export default class FfmpegStream {
    private ffmpeg: Ffmpeg.FfmpegCommand;
    private readonly file: string

    constructor(file: string, cover: string) {
        this.file = resolve(file);
        this.ffmpeg = Ffmpeg()
            .input(resolve(cover))
            .inputOption('-loop 1')
            .input(resolve(file))
            .inputOption('-re')
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioBitrate('96k')
            .outputOption('-pix_fmt yuv420p')
            .outputOption('-shortest')
            .outputOption('-r 24')
            .outputOption('-probesize 1000000')
            .outputOption('-analyzeduration 1000000')
            .outputOption('-maxrate 1000k')
            .outputOption('-bufsize 2000k')
            .outputOption('-ar 44100')
            .format('flv');
    }

    async stream(output: string, callback: () => void): Promise<void> {
        try {
            const title = await this.getTitleFromMetadata(this.file);
            this.ffmpeg
                .videoFilter([
                    'scale=1280:720',
                    `drawtext=text='${title}':fontcolor=white:fontsize=34:x=35:y=h-th-35`
                ])
                .output(output)
                .on('start', () => {
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

    private async getTitleFromMetadata(file: string): Promise<string> {
        try {
            const buffer = fs.readFileSync(file)
            const mp3tag = new MP3Tag(buffer)
            mp3tag.read()
            if (mp3tag.error !== '') new Error(mp3tag.error)

            return pkg.get(mp3tag, "tags.v1.title", "Unknown Title");
        } catch (error: any) {
            console.error(`Error reading metadata: ${error.message}`);
            return "Unknown Title";
        }
    }
}
