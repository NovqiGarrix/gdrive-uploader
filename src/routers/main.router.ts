import { Router } from 'express';
import { handleGoogleRedirect, handleUpdateAccessToken } from '../controllers/main.controller';

const router = Router();

router.get("/callback", handleGoogleRedirect);

router.post("/access_token", handleUpdateAccessToken);

export default router