// success.js
import Stripe from "stripe";
import { CONFIG } from "./config.js";
import { findProductByPriceId, appendDownloadRow } from "./sheets.js";
import { v4 as uuidv4 } from "uuid";
import { generatePDF } from "./pdf.js";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY);

export async function successHandler(req, res) {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.status(400).send("Missing session_id");

    // 1. Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"]
    });

    const email = session.customer_details?.email;
    const items = session.line_items?.data || [];

    if (!email || items.length === 0) {
      return res.status(400).send("Invalid session");
    }

    // 2. Générer les blocs produits
    const products = [];

    for (const item of items) {
      const priceId = item.price.id;
      const product = await findProductByPriceId(priceId);

      if (!product) continue;

      const token = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1h

      // URL sécurisée
      const downloadUrl = `${CONFIG.FRONT_BASE_URL}/dl/${token}`;

      // Enregistrer dans Google Sheets
      await appendDownloadRow({
        timestamp: now,
        email,
        priceId,
        ref: product.ref,
        productName: product.name,
        token,
        expiresAt,
        downloadedAt: "",
        downloadCount: 0,
        fileId: product.fileId
      });

      products.push({
        name: product.name,
        ref: product.ref,
        downloadUrl
      });
    }

    // 3. Générer le PDF premium
    const pdfBuffer = await generatePDF({
      logoUrl: CONFIG.LOGO_URL,
      products,
      contactText:
        "Need help? Please contact Harmonya Lab through the support form available on our website."
    });

    // 4. Renvoyer le PDF au navigateur
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=HarmonyaLab-Downloads.pdf"
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error in /success:", err);
    res.status(500).send("Internal server error");
  }
}
