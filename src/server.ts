import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import requestLogger from './middleware/requestLogger';

import logger from './utils/logger';
import { MainRouter, UploadRouter } from './routers';

dotenv.config();

const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
    process.on(signal, () => {
        logger.warn(`Received ${signal}, exiting...`);
        process.exit(0);
    })
}

export default function server() {
    const app = express();

    app.use(express.urlencoded({ extended: false }))
    app.use(express.json());

    app.use(cors({ origin: "*" }));

    app.use(requestLogger);
    app.use(`/api/v1/`, MainRouter);
    app.use(`/api/v1/upload`, UploadRouter);

    app.get("/", (_, res) => res.sendStatus(200));
    app.get("/health", (_, res) => res.sendStatus(200));

    return app;
}
