import fs from "fs";
import path from "path";
import cron from "node-cron";
import CronDefinitionInterface from "../contracts/CronDefinitionInterface";

// Loads cron definitions from modules and registers them with node-cron
export default class CronManager {
    private readonly modulesPath: string;

    constructor() {
        // Determine modules directory relative to compiled files
        this.modulesPath = path.join(__dirname, "..", "modules");
    }

    // Scan modules for cron kernels and schedule their jobs
    public register(): void {
        const moduleDirectories = fs.readdirSync(this.modulesPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        moduleDirectories.forEach((moduleName) => {
            const kernelPath = path.join(this.modulesPath, moduleName, "crons", "Kernel");

            // Load kernel file if it exists (.ts or .js)
            const kernelFile = this.resolveFile(kernelPath);
            if (!kernelFile) {
                return;
            }

            const tasks: CronDefinitionInterface[] = require(kernelFile).default;

            // Register each task with node-cron
            tasks.forEach(({ schedule, job }) => {
                cron.schedule(schedule, () => job.execute());
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
