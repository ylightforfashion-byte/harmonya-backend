// download.js
import { findDownloadByToken, updateDownloadRow } from "./sheets.js";
import { downloadDriveFile } from "./drive.js";

export async function downloadHandler(req, res) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).send("Missing token");

    // 1. Récupérer l’entrée de téléchargement
    const dl = await findDownloadByToken(token);
    if (!dl) return res.status(404).send("Download not found");

    const now = new Date();
    const expiresAt = new Date(dl.expiresAt);

    // 2. Vérifier expiration
    if (now > expiresAt) {
      return res.status(410).send("Download link has expired");
    }

    // 3. Télécharger le fichier HD depuis Drive
    const { buffer, mimeType, fileName } = await downloadDriveFile(dl.fileId);

    // 4. Mettre à jour le tracking
    await updateDownloadRow(dl.rowIndex, {
      downloadedAt: now,
      downloadCount: (dl.downloadCount || 0) + 1
    });

    // 5. Envoyer le fichier
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName || "harmonya-download"}"`
    );
    res.send(buffer);
  } catch (err) {
    console.error("Error in /dl/:token:", err);
    res.status(500).send("Internal server error");
  }
}
