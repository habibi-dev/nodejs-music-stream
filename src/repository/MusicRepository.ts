import pkg from "lodash";
import fs from "fs";

export default class MusicRepository {
    private musicFolder = '/musik/';
    private files: string[] = [];

    getMusics() {
        const baseDir = pkg.get(process, "env.DIR", "./files") as string
        const directory = baseDir + this.musicFolder

        this.files = fs.readdirSync(directory).map(string => directory + string);

        return this.files;
    }
}