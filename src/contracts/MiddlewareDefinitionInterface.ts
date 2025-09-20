import { RequestHandler } from "express";

// Defines a contract for module-level middleware
export default interface MiddlewareDefinitionInterface {
    path: string; // Base path where middleware applies
    handler: RequestHandler; // Middleware function to execute
}
