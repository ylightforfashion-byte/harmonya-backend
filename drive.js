import { google } from "googleapis";
import { CONFIG } from "./config.js";

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(CONFIG.GOOGLE_SERVICE_ACCOUNT),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export async function getDriveFileStream(fileId) {
  const drive = getDriveClient();

  const res = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return res.data; // Stream du fichier
}
