import Logger from "./Logger";
import serverConfig from "../serverConfig";

export class WebService {

    private static getServerConfig() {
        const port = Number(process.env.PORT) || 3000;
        const domain = process.env.DOMAIN || "localhost";
        const env = process.env.NODE_ENV || "development";

        return {port, domain, env};
    }

    public static startServer() {
        const {server, app} = serverConfig();
        const config = WebService.getServerConfig();
        const {port, domain, env} = config;
        const isDev = domain === "localhost" || env === "development";

        if (isDev) {
            app.listen(port, () => WebService.printServerInfo(true, port));
        } else {
            server.listen(port, domain, () => WebService.printServerInfo(false, port, domain));
        }
    }

    private static printServerInfo(isDev: boolean, port?: number, domain?: string) {
        if (isDev) {
            Logger.debug("Is Running Developer Mod! 🤓🛠️");
            Logger.debug(`Visit: http://localhost:${port}/api/status`);
        } else {
            const protocol = port === 443 ? "https" : "http";
            Logger.info("Is Running! 🙂😍😋😈");
            Logger.info(`Visit: ${protocol}://${domain}${port === 443 ? "" : `:${port}`}/status`);
        }
    }
}