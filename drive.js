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

  // On récupère d'abord les métadonnées pour savoir si c'est un PDF
  const meta = await drive.files.get({
    fileId,
    fields: "mimeType",
  });

  const mime = meta.data.mimeType;

  // Si c'est un PDF → utiliser export
  if (mime === "application/pdf") {
    const res = await drive.files.export(
      {
        fileId,
        mimeType: "application/pdf",
      },
      { responseType: "stream" }
    );
    return res.data;
  }

  // Sinon → téléchargement normal
  const res = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return res.data;
}
