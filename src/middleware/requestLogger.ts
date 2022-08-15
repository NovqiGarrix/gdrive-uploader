import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    if (req.originalUrl === "/favicon.ico") return next();

    logger.info(`[TYPE]: Request [METHOD]: ${req.method} [URL]: ${req.originalUrl}`);
    res.on("finish", () => logger.warn(`[TYPE]: Response [METHOD]: ${req.method} [STATUS]: ${res.statusCode} [URL]: ${req.originalUrl}`));
    next();
}
export default requestLogger;