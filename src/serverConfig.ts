import express, { Express } from "express";
import type { ServerOptions } from "https";
import https from "https";
import fs from "fs";
import RequestTimerConfig from "./config/RequestTimerConfig";
import securityConfig from "./config/SecurityConfig";
import AppConfig from "./config/AppConfig";
import CorsConfig from "./config/CorsConfig";
import CronConfig from "./config/CronConfig";
import ModuleMiddlewareConfig from "./config/ModuleMiddlewareConfig";
import RouteManager from "./routes/RouteManager";

type AppConfigurator = (app: Express) => void;

class ServerConfigurator {
    private readonly app: Express;
    private readonly configurators: AppConfigurator[] = [
        RequestTimerConfig,
        securityConfig,
        AppConfig,
        CorsConfig,
        ModuleMiddlewareConfig,
        CronConfig,
    ];

    constructor() {
        this.app = express();
    }

    private applyConfigurators(): void {
        this.configurators.forEach((configure) => configure(this.app));
    }

    private getHttpsOptions(): ServerOptions {
        const { PRIVKEY, FULLCHAIN, DOMAIN = "localhost" } = process.env;
        if (DOMAIN !== "localhost" && PRIVKEY && FULLCHAIN) {
            return {
                key: fs.readFileSync(PRIVKEY),
                cert: fs.readFileSync(FULLCHAIN),
            };
        }
        return {};
    }

    private setupRoutes(): void {
        new RouteManager(this.app).register();
    }

    public build() {
        this.applyConfigurators();
        this.setupRoutes();

        this.app.set("trust proxy", 1);

        const server = https.createServer(this.getHttpsOptions(), this.app);
        return { app: this.app, server };
    }
}

export default function serverConfig() {
    return new ServerConfigurator().build();
}
