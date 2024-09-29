import fs from 'fs';
import path from 'path';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import config from "../../config.json";
import {get} from "lodash";
import {ServerInterface} from "../interfaces/ServerInterface";

class Logger {
    private static baseLogDir: string;

    // Initialize the logger with the base directory for logs
    public static initialize(baseLogDir: string): void {
        Logger.baseLogDir = baseLogDir;

        // Create base directory if it doesn't exist
        if (!fs.existsSync(Logger.baseLogDir)) {
            fs.mkdirSync(Logger.baseLogDir, {recursive: true});
        }
    }

    // Get the current date and time in America/New_York timezone (America/New_York)
    private static getTehranTime(): string {
        const timeZone = get(config, "timeZone", 'America/New_York');
        const now = new Date();
        const tehranDate = toZonedTime(now, timeZone);
        return format(tehranDate, 'yyyy-MM-dd HH:mm:ss');
    }

    // Get the log file path based on log type, optional subDir and current date
    private static getLogFilePath(logType: string, subDir?: string): string {
        const timeZone = get(config, "timeZone", 'America/New_York');

        const currentDate = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd'); // Date in YYYY-MM-DD format

        // If subDir is provided, add it to the path
        const logDir = subDir
            ? path.join(Logger.baseLogDir, subDir, logType) // baseLogDir/subDir/logType
            : path.join(Logger.baseLogDir, logType);       // baseLogDir/logType

        // Create log directory (and subDir if applicable) if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, {recursive: true});
        }

        // Return the file path where the log will be saved (logDir/YYYY-MM-DD.log)
        return path.join(logDir, `${currentDate}.log`);
    }

    // Write a log entry to the appropriate log file
    private static writeLog(logType: string, message: string, subDir?: string): void {
        if (!Logger.baseLogDir) {
            throw new Error('Logger has not been initialized. Please call Logger.initialize() first.');
        }

        const timestamp = Logger.getTehranTime(); // Get current time in Tehran timezone
        const logMessage = `[${timestamp}] [${logType.toUpperCase()}] ${message}\n`;

        // Write the log message to the corresponding log file
        const logFilePath = Logger.getLogFilePath(logType, subDir);
        fs.appendFileSync(logFilePath, logMessage, 'utf8');
    }

    // Static Info log method with optional subDir
    public static info(message: string, subDir?: string): void {
        Logger.writeLog('info', message, subDir);
    }

    // Static Warn log method with optional subDir
    public static warn(message: string, subDir?: string): void {
        Logger.writeLog('warn', message, subDir);
    }

    // Static Error log method with optional subDir
    public static error(message: string, subDir?: string): void {
        Logger.writeLog('error', message, subDir);
    }

    // Static Debug log method with optional subDir
    public static debug(message: string, subDir?: string): void {
        Logger.writeLog('debug', message, subDir);
    }
}

export default Logger;
