import { findDownloadByToken, updateDownloadRow, findProductByPriceId } from "./sheets.js";

export async function handleDownload(req, res) {
  const token = req.params.token;

  const dl = await findDownloadByToken(token);
  if (!dl) return res.status(404).send("Invalid link");

  const now = new Date();
  if (now > new Date(dl.expiresAt)) {
    return res.status(410).send("This download link has expired.");
  }

  const newCount = (dl.downloadCount || 0) + 1;
  await updateDownloadRow(token, {
    downloadedAt: dl.downloadedAt ? new Date(dl.downloadedAt) : now,
    downloadCount: newCount
  });

  const product = await findProductByPriceId(dl.priceId);
  if (!product || !product.driveFileId) {
    return res.status(500).send("File not found.");
  }

  const fileUrl = `https://drive.google.com/uc?export=download&id=${product.driveFileId}`;
  return res.redirect(fileUrl);
}
