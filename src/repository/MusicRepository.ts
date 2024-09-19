import pkg from "lodash";
import fs from "fs";

export default class MusicRepository {
    private files: string[] = [];

    getMusics() {
        const baseDir = pkg.get(process, "env.DIR", "files") as string + "/"

        this.files = fs.readdirSync(baseDir).map(string => baseDir + string);

        return this.files;
    }
}