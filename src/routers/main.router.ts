import { Router } from 'express';
import { handleGoogleRedirect } from '../controllers/main.controller';

const router = Router();

router.get("/callback", handleGoogleRedirect);

export default router