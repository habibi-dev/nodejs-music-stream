import CronJobInterface from "./CronJobInterface";

export default interface CronDefinitionInterface {
    schedule: string;
    job: CronJobInterface;
}
