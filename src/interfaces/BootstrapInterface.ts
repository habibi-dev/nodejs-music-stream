export interface BootstrapInterface {
    name: string;
    priority: number; // Lower = higher priority
    init(): Promise<void>;
    destroy?(): Promise<void>;
}