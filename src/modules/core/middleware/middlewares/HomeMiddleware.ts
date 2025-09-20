import { Request, Response, NextFunction } from "express";

// Demonstrates a module-specific middleware
export default function homeMiddleware(_req: Request, _res: Response, next: NextFunction): void {
    next();
}
