import {execSync} from "child_process";
import {FFbinariesResolver} from "./FFbinariesResolver";
import {FFChecker} from "./FFChecker";
import Logger from "../../../../services/Logger";

export class FFprobeService {
    static probe(file: string): object | null {
        if (FFChecker.hasFFprobe()) {
            const bin = FFbinariesResolver.ffprobe();
            const out = execSync(`${bin} -v quiet -print_format json -show_format -show_streams "${file}"`);
            return JSON.parse(out.toString());
        } else {
            Logger.error('FFprobe is not available');
            return null;
        }
    }
}
