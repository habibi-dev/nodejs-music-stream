import path from "path";
import {Express} from "express";

export default function StreamViewConfig(app: Express): void {
    const viewsPath = path.resolve(__dirname, "..", "views");
    app.set("views", viewsPath);
    app.set("view engine", "ejs");
}
