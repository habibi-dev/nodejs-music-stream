import fs from "fs";
import path from "path";

export type SortingMethod = "date" | "name" | "size" | "random";
export type SortingOrder = "asc" | "desc";

export interface FileItem {
    path: string;
    name: string;
    ext: string;
    size: number;
    mtime: Date;
    ctime: Date;
}

export class FileScanner {
    static scan(dir: string, extensions: string[] = [], ignoreDirs: string[] = []): FileItem[] {
        const result: FileItem[] = [];
        this.walk(dir, extensions.map(e => e.toLowerCase()), ignoreDirs, result);
        return result;
    }

    static sort(files: FileItem[], method: SortingMethod, order: SortingOrder = "asc"): FileItem[] {
        const sorted = [...files];

        switch (method) {
            case "date":
                sorted.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
                break;
            case "name":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "size":
                sorted.sort((a, b) => a.size - b.size);
                break;
            case "random":
                for (let i = sorted.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
                }
                break;
        }

        return order === "desc" ? sorted.reverse() : sorted;
    }

    private static walk(current: string, extensions: string[], ignoreDirs: string[], result: FileItem[]) {
        if (this.shouldIgnore(current, ignoreDirs)) return;

        const entries = fs.readdirSync(current, {withFileTypes: true});
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);

            if (entry.isDirectory()) {
                if (!this.shouldIgnore(fullPath, ignoreDirs)) {
                    this.walk(fullPath, extensions, ignoreDirs, result);
                }
            } else {
                if (this.isAllowed(fullPath, extensions)) {
                    const stat = fs.statSync(fullPath);
                    result.push({
                        path: fullPath,
                        name: entry.name,
                        ext: path.extname(entry.name).toLowerCase(),
                        size: stat.size,
                        mtime: stat.mtime,
                        ctime: stat.ctime
                    });
                }
            }
        }
    }

    private static isAllowed(filePath: string, extensions: string[]): boolean {
        if (extensions.length === 0) return true;
        return extensions.includes(path.extname(filePath).toLowerCase());
    }

    private static shouldIgnore(dirPath: string, ignoreDirs: string[]): boolean {
        return ignoreDirs.some(d => dirPath.includes(d));
    }
}
