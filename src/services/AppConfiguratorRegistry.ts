import {Express} from "express";

export type AppConfigurator = (app: Express) => void;

class AppConfiguratorRegistry {
    private static configurators: AppConfigurator[] = [];

    static register(configurator: AppConfigurator): void {
        this.configurators.push(configurator);
    }

    static getConfigurators(): AppConfigurator[] {
        return [...this.configurators];
    }
}

export default AppConfiguratorRegistry;
