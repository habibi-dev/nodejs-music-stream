import {BootstrapInterface} from "../interfaces/BootstrapInterface";
import Logger from "./Logger";
import {readdirSync, statSync} from 'fs';
import {join} from 'path';

class BootstrapManager {
    private modules: BootstrapInterface[] = [];

    register(module: BootstrapInterface) {
        this.modules.push(module);
        this.modules.sort((a, b) => a.priority - b.priority);
    }

    async initialize() {
        // Auto-discover and register modules
        await BootstrapManager.discovery(__dirname + "/../modules");

        for (const module of this.modules) {
            Logger.debug(`Initializing ${module.name}...`);
            await module.init();
        }
    }

    async shutdown() {
        // Reverse order for cleanup
        for (const module of [...this.modules].reverse()) {
            if (module.destroy) {
                Logger.debug(`Shutting down ${module.name}...`);
                await module.destroy();
            }
        }
    }

    private static async discovery(baseDir: string) {
        const modules = readdirSync(baseDir);


        for (const moduleName of modules) {
            const moduleDir = join(baseDir, moduleName);

            // Check if it's a directory
            if (!statSync(moduleDir).isDirectory()) continue;

            // Check for Bootstrap.ts or Bootstrap.js inside this directory
            for (const ext of ["ts", "js"]) {
                const bootstrapFile = join(moduleDir, `Bootstrap.${ext}`);
                try {
                    // Use require.resolve to check existence before import
                    require.resolve(bootstrapFile);

                    const module = await import(bootstrapFile);
                    for (const exportName of Object.keys(module)) {
                        const ExportedClass = module[exportName];
                        if (
                            ExportedClass.prototype &&
                            typeof ExportedClass.prototype.init === "function"
                        ) {
                            bootstrapManager.register(new ExportedClass());
                        }
                    }
                } catch {
                    // File not found → skip
                }
            }
        }
    }
}

export const bootstrapManager = new BootstrapManager();
