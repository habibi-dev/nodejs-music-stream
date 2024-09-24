import pkg from "lodash";
import fs from "fs";
import * as path from "node:path";

export default class MusicRepository {
    private files: string[] = [];

    getMusics() {
        const baseDir = pkg.get(process, "env.DIR", "files") as string + "/";

        const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
            const files = fs.readdirSync(dirPath);

            files.forEach((file) => {
                const filePath = path.join(dirPath, file);
                if (fs.statSync(filePath).isDirectory()) {
                    arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
                } else {
                    arrayOfFiles.push(filePath);
                }
            });

            return arrayOfFiles;
        }

        this.files = getAllFiles(baseDir);
        return this.files;
    }
}