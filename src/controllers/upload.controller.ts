import { randomFillSync } from 'crypto';
import { Request, Response } from 'express';
import busboy from 'busboy';

import { GoogleApis } from '../utils/googleapi';
import logger from '../utils/logger';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';

export const handleUpload = async (req: Request<Record<never, never>, Record<never, never>, Record<never, never>, { isPublic: boolean; folderId: string }>, res: Response) => {

    let { isPublic, folderId } = req.query;
    isPublic = Boolean(isPublic ?? true);

    if (!folderId) return res.status(400).json({ error: "Invalid Request!" });

    const googleapis = new GoogleApis();

    const randomString = (() => {
        const buf = Buffer.alloc(16);
        return randomFillSync(buf).toString('hex');
    })();

    const bb = busboy({ headers: req.headers });

    let filename: string | null = null
    let mimetype: string | null = null
    let filePath: string | null = null;

    bb.on('file', (_, file, info) => {
        const { mimeType, filename: originName } = info;

        const extension = mimeType.split('/')[1];
        const fileName = `${randomString}-${originName}.${extension}`;

        filePath = `./uploads/${fileName}`;
        file.pipe(createWriteStream(filePath));

        filename = originName;
        mimetype = mimeType;
    });

    bb.on("finish", async () => {

        try {

            const uploadedFile = await googleapis.uploadDriveFile(filename!, mimetype!, filePath!, folderId);

            const { id, originalFilename, mimeType, name } = uploadedFile;
            const src = `https://drive.google.com/uc?id=${id}&export=download`;

            return res.send({
                data: { src, extension: mimeType, filename: originalFilename ?? name, id },
                error: null
            })

        } catch (error: any) {
            logger.error(`[HandleUpload]: ${error.message}`);
            return res.status(500).send({ error: error.message, data: null });
        }

    })

    bb.on("close", async () => {
        try {
            logger.info(`Deleting "${filename}"...`);
            await unlink(filePath as string);
            logger.warn(`File "${filename}" is deleted`);
        } catch (error: any) {
            return res.status(500).send({ data: null, error: error.message });
        };
    })

    req.pipe(bb);
    return;

}

export const deleteUploadedFile = async (req: Request, res: Response): Promise<Response> => {

    const { fileId } = req.params;

    const googleapi = new GoogleApis();

    try {

        const deletedStatus = await googleapi.deleteDriveFile(fileId);

        return res.send({ data: deletedStatus, error: null });

    } catch (error: any) {
        logger.error(`[DeleteUploadedFile]: ${error.message}`);
        return res.status(500).send({ error: error.message, data: null });
    }

}

export const getAllFiles = async (req: Request<{}, {}, {}, { folderId: string }>, res: Response): Promise<Response> => {

    const { folderId } = req.query;
    if (!folderId) return res.status(400).send({ error: "Invalid Request!", data: null });

    try {

        const googleapi = new GoogleApis();

        const files = await googleapi.getDriveFiles(folderId);
        return res.status(200).send({ data: files, error: null });

    } catch (error: any) {
        logger.error(`[GetAllFiles]: ${error.message}`);
        return res.status(500).send(error.message);
    }

}