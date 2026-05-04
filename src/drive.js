// drive.js
import { google } from "googleapis";
import fs from "fs";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"]
});

const drive = google.drive({ version: "v3", auth });

export async function downloadDriveFile(fileId) {
  try {
    const response = await drive.files.get(
      {
        fileId,
        alt: "media"
      },
      { responseType: "arraybuffer" }
    );

    const fileMeta = await drive.files.get({
      fileId,
      fields: "name, mimeType"
    });

    return {
      buffer: Buffer.from(response.data),
      mimeType: fileMeta.data.mimeType,
      fileName: fileMeta.data.name
    };
  } catch (err) {
    console.error("Error downloading file from Drive:", err);
    throw new Error("Drive download failed");
  }
}
