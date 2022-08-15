import express from 'express';
import cors from 'cors';

import requestLogger from './middleware/requestLogger';

import { MainRouter, UploadRouter } from './routers';

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

export default function server() {
    const app = express();

    app.use(express.urlencoded({ extended: false }))
    app.use(express.json());

    app.use(cors({ origin: [CORS_ORIGIN] }));

    app.use(requestLogger);
    app.use(`/api/v1/`, MainRouter);
    app.use(`/api/v1/upload`, UploadRouter);

    app.get("/", (_, res) => res.sendStatus(200));
    app.get("/health", (_, res) => res.sendStatus(200));

    return app;
}
