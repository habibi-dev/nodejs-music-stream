import { Express } from "express";
import CronManager from "../crons/CronManager";

export default function CronConfig(_app: Express): void {
    // Register cron jobs defined in modules
    new CronManager().register();
}
