import dotenv from 'dotenv';

import logger from './utils/logger';
import { GoogleApis } from './utils/googleapi';

import updateAccessTokenJob from './jobs/updateAccessToken.job';
import server from './server';

dotenv.config();

const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
    process.on(signal, () => {
        logger.warn(`Received ${signal}, exiting...`);
        process.exit(0);
    })
}

const PORT = process.env.PORT || 3003;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';

const app = server();
app.listen(PORT, async () => {

    try {

        const googleapis = new GoogleApis();
        logger.warn(`🤟 Connecting to Redis Server`);

        logger.info(`🚀 Redis Server Connected 🚀`);
        updateAccessTokenJob();

        logger.info(`☔ [URL]: ${BASE_URL}`);

        // Initialize googleClient, and the drive
        logger.info(`🤟 Initializing Google Client`);
        const googleClient = await googleapis.getClient();

        logger.info(`🤟 Initializing Drive Client`);
        await googleapis.getDrive();

        const SCOPE = ["profile", "email", "https://www.googleapis.com/auth/drive"];
        const authURL = googleClient.generateAuthUrl({
            access_type: "offline",
            scope: SCOPE
        });

        logger.info(`📑 [Google Auth URL]: ${authURL}`);

    } catch (error: any) {
        logger.error(`🤟 Hell yeah..... An error occurred: "${error.message ?? error}"`);
        process.exit(1);
    }

});