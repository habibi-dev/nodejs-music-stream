import fs from 'fs';
import path from 'path';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';

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
        const now = new Date();
        const tehranDate = toZonedTime(now, 'America/New_York');
        return format(tehranDate, 'yyyy-MM-dd HH:mm:ss');
    }

    // Get the log file path based on log type and current date
    private static getLogFilePath(logType: string): string {
        const currentDate = format(toZonedTime(new Date(), 'America/New_York'), 'yyyy-MM-dd'); // Date in YYYY-MM-DD format
        const logDir = path.join(Logger.baseLogDir, logType); // Directory structure: baseLogDir/logType

        // Create log type directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, {recursive: true});
        }

        // Return the file path where the log will be saved (logDir/YYYY-MM-DD.log)
        return path.join(logDir, `${currentDate}.log`);
    }

    // Write a log entry to the appropriate log file
    private static writeLog(logType: string, message: string): void {
        if (!Logger.baseLogDir) {
            throw new Error('Logger has not been initialized. Please call Logger.initialize() first.');
        }

        const timestamp = Logger.getTehranTime(); // Get current time in Tehran timezone
        const logMessage = `[${timestamp}] [${logType.toUpperCase()}] ${message}\n`;

        // Write the log message to the corresponding log file
        const logFilePath = Logger.getLogFilePath(logType);
        fs.appendFileSync(logFilePath, logMessage, 'utf8');
    }

    // Static Info log method
    public static info(message: string): void {
        Logger.writeLog('info', message);
    }

    // Static Warn log method
    public static warn(message: string): void {
        Logger.writeLog('warn', message);
    }

    // Static Error log method
    public static error(message: string): void {
        Logger.writeLog('error', message);
    }

    // Static Debug log method
    public static debug(message: string): void {
        Logger.writeLog('debug', message);
    }
}

export default Logger;
