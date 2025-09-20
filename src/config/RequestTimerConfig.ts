import { Express } from "express";
import requestTimer from "../middleware/RequestTimer";

/**
 * Registers middleware to capture request start times.
 * This configuration isolates timing logic from other app concerns.
 */
export default function RequestTimerConfig(app: Express): void {
    app.use(requestTimer);
}
