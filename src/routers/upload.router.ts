import { Router } from 'express';
import { deleteUploadedFile, handleUpload } from '../controllers/upload.controller';

const router = Router();

router.post("/", handleUpload);
router.delete("/:fileId", deleteUploadedFile);

export default router