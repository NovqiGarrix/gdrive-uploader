import { Request, Response } from 'express';

import { GoogleApis } from '../utils/googleapi';
import logger from '../utils/logger';

export const handleGoogleRedirect = async (req: Request, res: Response) => {

    const { code } = req.query;

    const googleClient = GoogleApis.googleClient;

    try {

        const { tokens } = await googleClient.getToken(code as string);
        logger.info(`[GetToken]: ${JSON.stringify(tokens)}`);

        const { access_token, refresh_token } = tokens
        if (!access_token || !refresh_token) throw new Error("Access Token, and Refresh Token is undefined");

        await GoogleApis.setCredentials(tokens);
        return res.send({ data: "OK", error: null });

    } catch (error: any) {
        logger.error(error.message);
        return res.status(500).send({ error: error.message, data: null });
    }

}