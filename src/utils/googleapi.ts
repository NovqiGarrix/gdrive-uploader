import { createReadStream } from "fs";
import { drive_v3, google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv';

import { RedisClient } from "./redis-client";
import logger from "./logger";

dotenv.config();

export type UploadFileReturn = {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
}

export type DriveUserType = 'user' | 'group' | 'domain' | 'anyone'
export type DriveUserRole = 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader'

export class GoogleApis {

    public static googleClient: OAuth2Client;
    public static drive: drive_v3.Drive;

    private clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    private clientId = process.env.GOOGLE_CLIENT_ID;

    private static credentials: Credentials;

    public async getClient() {
        if (GoogleApis.googleClient) return GoogleApis.googleClient;

        try {

            const BASE_URL = process.env.BASE_URL;
            const redirectUrl = `${BASE_URL}/api/v1/callback`;

            if (!this.clientSecret || !this.clientId || !redirectUrl) {
                throw new Error("Google API credentials are not configured");
            }

            const credentials = await this.getCredentials();
            GoogleApis.googleClient = new google.auth.OAuth2(this.clientId, this.clientSecret, redirectUrl);
            if (credentials) GoogleApis.googleClient.setCredentials(credentials);

            return GoogleApis.googleClient;

        } catch (error: any) {
            logger.error(`[GetClient]: ${error.message}`);
            throw new Error(error.message);
        }
    }

    public async getCredentials(): Promise<Credentials | undefined> {

        if (GoogleApis.credentials) return GoogleApis.credentials;

        const redisClient = RedisClient.getClient();
        try {

            const tokens = await redisClient.get("nvdrive-uploader");
            if (!tokens) return undefined

            const credentials = JSON.parse(tokens) as Credentials;
            GoogleApis.credentials = credentials;

            return credentials;

        } catch (error: any) {
            logger.error(`[GetCredentials]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    public static async setCredentials(credentials: Credentials): Promise<void> {

        const redisClient = RedisClient.getClient();

        try {

            GoogleApis.credentials = credentials;
            await redisClient.set("nvdrive-uploader", JSON.stringify(credentials));

            const googleClient = GoogleApis.googleClient;
            if (googleClient) googleClient.setCredentials(credentials);
            GoogleApis.googleClient = googleClient;

        } catch (error: any) {
            logger.error(`[SetCredentials]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    public async getDrive() {
        if (GoogleApis.drive) return GoogleApis.drive;

        try {

            GoogleApis.drive = google.drive({ version: "v3", auth: GoogleApis.googleClient });
            return GoogleApis.drive

        } catch (error: any) {
            logger.error(`[GetDrive]: ${error.message}`);
        }
    }

    async updateAccessToken(): Promise<void> {

        try {

            const credentials = await this.getCredentials();
            if (!credentials) throw new Error("Credentials are not found");

            GoogleApis.googleClient.setCredentials(credentials);
            const { credentials: newCredentials } = await GoogleApis.googleClient.refreshAccessToken();

            await GoogleApis.setCredentials(newCredentials);

        } catch (error: any) {
            logger.error(`[UpdateAccessToken]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    async getDriveFile(fileId: string): Promise<drive_v3.Schema$File> {

        try {

            const drive = GoogleApis.drive;
            const { data } = await drive.files.get({ fileId });

            return data

        } catch (error: any) {
            logger.error(`[GetDriveFile]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    async uploadDriveFile(fileName: string, mimeType: string, saveTo: string, folderId: string, isPublic: boolean = true) {

        try {

            const { data } = await GoogleApis.drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType,
                    parents: [folderId]
                },

                media: {
                    mimeType, body: createReadStream(saveTo)
                }
            });

            if (isPublic) await this.updateDriveFilePrivacy(data.id!, "reader", "anyone")
            return data

        } catch (error: any) {
            logger.error(`[UploadFile]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    async updateDriveFilePrivacy(fileId: string, role: DriveUserRole, type: DriveUserType): Promise<drive_v3.Schema$Permission> {

        try {

            const { data } = await GoogleApis.drive.permissions.create({
                fileId, requestBody: {
                    role, type
                }
            })

            return data

        } catch (error: any) {
            logger.error(`[UpdateFilePrivacy]: ${error.message}`);
            throw new Error(error.message);
        }
    }

    async deleteDriveFile(fileId: string): Promise<boolean> {

        const drive = GoogleApis.drive;

        try {

            await drive.files.delete({ fileId });
            return true

        } catch (error: any) {
            logger.error(`[DeleteDriveFile]: ${error.message}`);
            throw new Error(error.message);
        }

    }

    async getDriveFiles(folderId: string): Promise<drive_v3.Schema$File[]> {

        const drive = GoogleApis.drive;

        try {

            const { data } = await drive.files.list({
                q: `'${folderId}' in parents`,
                pageSize: 1000,
                fields: "files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, webContentLink)"
            });

            if (!data.files) throw new Error("No files found or Invalid Folder Id");
            return data.files;

        } catch (error: any) {
            logger.error(`[GetDriveFiles]: ${error.message}`);
            throw new Error(error.message);
        }

    }

}