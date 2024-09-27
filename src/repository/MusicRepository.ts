import pkg from "lodash";
import fs from "fs";
import * as path from "node:path";

export default class MusicRepository {
    private files: string[] = [];

    // Recursive function to get all files from a specified directory
    private getAllFiles(dirPath: string, ignoredDirs: string[], arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);

            // Check if the directory should be ignored
            if (fs.statSync(filePath).isDirectory()) {
                if (!ignoredDirs.some(ignoredDir => filePath.includes(ignoredDir))) {
                    this.getAllFiles(filePath, ignoredDirs, arrayOfFiles);
                }
            } else {
                arrayOfFiles.push(filePath);
            }
        });

        return arrayOfFiles;
    }

    getMusics(dir: string, ign_dir: string[] = []): string[] {
        // Retrieve ignored directories from environment variable
        const ignoredDirs = ign_dir.filter(dir => dir !== "");

        // Get all files considering ignored directories
        this.files = this.getAllFiles(dir, ignoredDirs);
        return this.files;
    }
}
