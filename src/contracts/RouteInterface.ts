import { Router } from "express";

// Defines the contract for module routes
export default interface RouteInterface {
    basePath: string; // Base path for the route
    router: Router; // Express router instance
}
