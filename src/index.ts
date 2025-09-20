import Logger from "./services/Logger";
import {bootstrapManager} from "./services/BootstrapManager";
import {WebService} from "./services/WebService";

async function bootstrap() {
    try {
        // Initialize all modules
        await bootstrapManager.initialize();

        // Start server
        WebService.startServer();

    } catch (error) {
        Logger.error(`Failed to start application: ${error}`);
        await bootstrapManager.shutdown();
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    Logger.warn('SIGTERM signal received: shutting down gracefully');
    await bootstrapManager.shutdown();
    process.exit(0);
});

bootstrap().then();