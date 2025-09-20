import { Express } from "express";
import MiddlewareManager from "../middleware/MiddlewareManager";

export default function ModuleMiddlewareConfig(app: Express): void {
    // Register middleware defined in modules
    new MiddlewareManager(app).register();
}
