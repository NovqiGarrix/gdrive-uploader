import { Router } from 'express';
import { deleteUploadedFile, getAllFiles, handleUpload } from '../controllers/upload.controller';

const router = Router();

router.post("/", handleUpload);

router.get("/files", getAllFiles);

router.delete("/:fileId", deleteUploadedFile);

export default router