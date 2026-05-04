import { findDownloadByToken, updateDownloadRow } from "./sheets.js";
import { getDriveFileStream } from "./drive.js";

export async function downloadHandler(req, res) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  const record = await findDownloadByToken(token);
  if (!record) {
    return res.status(404).send("Download not found");
  }

  const now = new Date();
  const expiresAt = new Date(record.expiresAt);

  if (now > expiresAt) {
    return res.status(403).send("Download link expired");
  }

  // Mise à jour du tracking
  await updateDownloadRow(record.rowIndex, {
    downloadedAt: now.toISOString(),
    downloadCount: Number(record.downloadCount || 0) + 1,
  });

  try {
    const stream = await getDriveFileStream(record.fileId);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${record.productName.replace(/[^a-z0-9]/gi, "_")}.zip"`
    );

    stream.pipe(res);
  } catch (err) {
    console.error("Drive download error:", err);
    res.status(500).send("Error downloading file");
  }
}
