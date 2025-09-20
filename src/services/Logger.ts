import fs from "fs";
import path from "path";

class Logger {
    private static baseLogDir: string = "./logs";

    public static initialize() {
        if (!fs.existsSync(Logger.baseLogDir)) {
            fs.mkdirSync(Logger.baseLogDir, {recursive: true});
        }
    }

    private static formatDate(date: Date = new Date(), format: string = "yyyy-MM-dd HH:mm:ss"): string {
        const pad = (n: number) => String(n).padStart(2, "0");

        const map: Record<string, string> = {
            yyyy: String(date.getFullYear()),
            MM: pad(date.getMonth() + 1),
            dd: pad(date.getDate()),
            HH: pad(date.getHours()),
            mm: pad(date.getMinutes()),
            ss: pad(date.getSeconds())
        };

        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (token) => map[token]);
    }

    private static getLogFilePath(logType: string, subDir?: string): string {
        const currentDate = Logger.formatDate(new Date(), 'yyyy-MM-dd');

        // If subDir is provided, add it to the path
        const logDir = subDir
            ? path.join(Logger.baseLogDir, subDir, logType) // baseLogDir/subDir/logType
            : path.join(Logger.baseLogDir, logType); // baseLogDir/logType

        // Create log directory (and subDir if applicable) if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, {recursive: true});
        }

        // Return the file path where the log will be saved (logDir/YYYY-MM-DD.log)
        return path.join(logDir, `${currentDate}.log`);
    }

    private static writeLog(logType: string, message: string, subDir?: string): void {
        if (!Logger.baseLogDir) {
            throw new Error('Logger has not been initialized. Please call Logger.initialize() first.');
        }

        const timestamp = Logger.formatDate();
        const logMessage = `[${timestamp}] [${logType.toUpperCase()}] ${message}\n`;

        // print to console as well
        if (logType !== 'debug')
            console.log(logMessage.trim());

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