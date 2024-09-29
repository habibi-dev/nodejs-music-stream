import fs from "fs";
import * as path from "node:path";
import Logger from "../lib/Logger";

export default class MusicRepository {
    private files: string[] = [];

    // Recursive function to get all files from a specified directory
    private getAllFiles(dirPath: string, ignoredDirs: string[], arrayOfFiles: string[] = []): string[] {
        // Check if directory exists before trying to read it
        if (!fs.existsSync(dirPath)) {
            Logger.error(`Directory does not exist: ${dirPath}`);
            return arrayOfFiles;
        }

        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file);

            // Check if it's a directory and should be ignored
            if (fs.statSync(filePath).isDirectory()) {
                const isIgnored = ignoredDirs.some(ignoredDir => {
                    const relativePath = path.relative(dirPath, filePath);
                    return relativePath.startsWith(ignoredDir);
                });

                if (!isIgnored) {
                    // Recurse into the directory if it's not ignored
                    this.getAllFiles(filePath, ignoredDirs, arrayOfFiles);
                }
            } else {
                // If it's a file, add it to the array
                arrayOfFiles.push(filePath);
            }
        });

        return arrayOfFiles;
    }

    getMusics(dir: string, ign_dir: string[] = []): string[] {
        // Retrieve ignored directories from parameters, filter out empty strings
        const ignoredDirs = ign_dir.filter(dir => dir.trim() !== "");

        // Get all files considering ignored directories
        this.files = this.getAllFiles(dir, ignoredDirs);
        return this.files;
    }
}
