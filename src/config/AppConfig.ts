import bodyParser from "body-parser";
import express, {Express, Response} from "express";
import path from "path";

const VIDEO_EXTS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];
const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
const HLS_MANIFEST_EXTS = ['.m3u8', '.m3u'];
const HLS_SEGMENT_EXTS = ['.ts', '.m4s'];

function applyNoCacheHeaders(res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}

export default function AppConfig(app: Express) {
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    app.use(express.static('public', {
        setHeaders: (res: Response, filePath) => {
            const ext = path.extname(filePath).toLowerCase();

            if (HLS_MANIFEST_EXTS.includes(ext)) {
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                applyNoCacheHeaders(res);
                return;
            }

            if (HLS_SEGMENT_EXTS.includes(ext)) {
                res.setHeader('Content-Type', 'video/mp2t');
                res.setHeader('Accept-Ranges', 'bytes');
                applyNoCacheHeaders(res);
                return;
            }

            if (VIDEO_EXTS.includes(ext)) {
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Type', 'video/mp4');
                return;
            }

            if (AUDIO_EXTS.includes(ext)) {
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Content-Type', 'audio/mpeg');
                return;
            }

            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                res.setHeader('Content-Type', 'image/' + ext.slice(1));
            }
        },
        maxAge: '1d'
    }));
}
