import {AudioConfigInterface, VideoConfigInterface} from "../interfaces/PresetsInterface";

export class FFmpegArgsBuilder {
    static buildVideoArgs(video: VideoConfigInterface): string[] {
        return [
            '-c:v', video.codec,
            '-b:v', video.bitrate,
            '-maxrate', video.maxrate,
            '-bufsize', video.bufsize,
            '-vf', `scale=${video.scale}`,
            '-r', video.fps.toString(),
            '-g', video.gop.toString(),
            '-profile:v', video.profile,
            '-level', video.level
        ];
    }

    static buildAudioArgs(audio: AudioConfigInterface): string[] {
        const args = [
            '-c:a', audio.codec,
            '-b:a', audio.bitrate,
            '-ac', audio.channels.toString(),
            '-ar', audio.samplerate.toString()
        ];

        if (audio.loudnorm) {
            args.push('-af', 'loudnorm');
        }

        return args;
    }

    static buildCompleteArgs(video: VideoConfigInterface, audio: AudioConfigInterface): string[] {
        return [
            ...this.buildVideoArgs(video),
            ...this.buildAudioArgs(audio)
        ];
    }
}