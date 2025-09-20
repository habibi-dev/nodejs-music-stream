export default interface CronJobInterface {
    execute(): Promise<void> | void;
}
