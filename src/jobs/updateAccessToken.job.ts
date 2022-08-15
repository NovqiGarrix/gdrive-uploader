import { scheduleJob } from "node-schedule";

import { GoogleApis } from "../utils/googleapi";
import logger from "../utils/logger";

export default function updateAccessTokenJob() {

    const googleapis = new GoogleApis();

    // */55 * * * * || Every 55 minutes
    scheduleJob("*/55 * * * *", async () => {

        try {

            logger.info(`🤟 Updating Access Token`);
            await googleapis.updateAccessToken();
            logger.info(`🥽 Access Token Updated`);

        } catch (error: any) {
            logger.error(error.message);
        }

    })

}