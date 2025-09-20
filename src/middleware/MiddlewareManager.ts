import { Express } from "express";
import fs from "fs";
import path from "path";
import MiddlewareDefinitionInterface from "../contracts/MiddlewareDefinitionInterface";

// Dynamically loads and registers middleware from all modules
export default class MiddlewareManager {
    private readonly modulesPath: string;

    constructor(private readonly app: Express) {
        // Determine modules directory relative to compiled files
        this.modulesPath = path.join(__dirname, "..", "modules");
    }

    // Scan modules for middleware kernels and mount their definitions
    public register(): void {
        const moduleDirectories = fs.readdirSync(this.modulesPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        moduleDirectories.forEach((moduleName) => {
            const kernelPath = path.join(this.modulesPath, moduleName, "middleware", "Kernel");
            const kernelFile = this.resolveFile(kernelPath);
            if (!kernelFile) {
                return;
            }

            const middlewares: MiddlewareDefinitionInterface[] = require(kernelFile).default;

            middlewares.forEach(({ path: basePath, handler }) => {
                this.app.use(basePath, handler);
            });
        });
    }

    // Resolve the actual file path for a kernel file (TS or JS)
    private resolveFile(basePath: string): string | null {
        const tsPath = `${basePath}.ts`;
        const jsPath = `${basePath}.js`;

        if (fs.existsSync(tsPath)) {
            return tsPath;
        }
        if (fs.existsSync(jsPath)) {
            return jsPath;
        }
        return null;
    }
}
