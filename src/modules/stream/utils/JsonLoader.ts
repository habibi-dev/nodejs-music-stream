import {readFileSync} from "node:fs";
import Logger from "../../../services/Logger";

export class JsonLoader {
    static loadFromFile<T>(filePath: string, validator?: (data: any) => void, logChannel: string | undefined = undefined): T {
        try {
            const fileContent = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);

            if (validator) {
                validator(data);
            }

            return data;
        } catch (error) {
            Logger.error(`Failed to load file ${filePath}: ${error}`, logChannel);
            process.exit(66); // 66 = standard exit code for "cannot open input"
        }
    }
}
