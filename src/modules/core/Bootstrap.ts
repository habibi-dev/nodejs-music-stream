import {BootstrapInterface} from "../../interfaces/BootstrapInterface";
import Logger from "../../services/Logger";
import dotenv from "dotenv";

export class LoggerBootstrap implements BootstrapInterface {
    name = "Logger";
    priority = 0; // Highest priority

    async init() {
        Logger.initialize();
        dotenv.config();
    }
}