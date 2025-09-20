import path from "path";
import fs from "fs";
import {Express} from "express";

function resolveViewDirectories(): string[] {
    const distViews = path.resolve(__dirname, "..", "views");
    const srcViews = path.resolve(process.cwd(), "src", "modules", "stream", "views");

    const locations = [distViews, srcViews].filter((candidate) => fs.existsSync(candidate));

    return locations.length > 0 ? locations : [distViews];
}

export default function StreamViewConfig(app: Express): void {
    const viewDirectories = resolveViewDirectories();
    app.set("views", viewDirectories);
    app.set("view engine", "ejs");
}
