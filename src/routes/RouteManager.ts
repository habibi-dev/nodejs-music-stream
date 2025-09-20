import { Express } from "express";
import fs from "fs";
import path from "path";
import RouteInterface from "../contracts/RouteInterface";

// Loads and registers routes for all modules dynamically
export default class RouteManager {
    private readonly modulesPath: string;

    constructor(private readonly app: Express) {
        // Determine modules directory relative to compiled files
        this.modulesPath = path.join(__dirname, "..", "modules");
    }

    // Scan modules and mount their routes
    public register(): void {
        // Read all items in modulesPath and filter only directories (modules)
        const moduleDirectories = fs.readdirSync(this.modulesPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        // Iterate over each module folder
        moduleDirectories.forEach((moduleName) => {
            const routesPath = path.join(this.modulesPath, moduleName, "routes");

            // Skip if routes folder does not exist
            if (!fs.existsSync(routesPath)) {
                return;
            }

            // Get all route files inside routes folder (.ts or .js)
            const routeFiles = fs.readdirSync(routesPath)
                .filter((fileName) => fileName.endsWith(".ts") || fileName.endsWith(".js"));

            // Iterate over each route file
            routeFiles.forEach((fileName) => {
                const filePath = path.join(routesPath, fileName);

                // Import route file
                const routeModule: RouteInterface = require(filePath).default;

                // Check if routeModule has required properties
                if (routeModule && routeModule.basePath && routeModule.router) {
                    // Register route in Express app
                    this.app.use(routeModule.basePath, routeModule.router);
                }
            });
        });
    }
}
