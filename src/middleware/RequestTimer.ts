/**
 * Middleware that records the start time of each request.
 * Capturing this value enables later calculation of request duration.
 */
import {Request, Response, NextFunction} from "express";
import pkg from "lodash";

export default function requestTimer(req: Request, res: Response, next: NextFunction): void {
    pkg.set(req, "startTime",  process.hrtime());
    next();
}
