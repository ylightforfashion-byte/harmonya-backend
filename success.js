import crypto from "crypto";
import Stripe from "stripe";
import { CONFIG } from "./config.js";
import {
  findProductByPriceId,
  appendDownloadRow,
} from "./sheets.js";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY);

/**
 * GET /success?session_id=cs_test_...
 * Redirigé depuis Stripe Checkout après paiement.
 */
export async function successHandler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).send("Missing session_id");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price"],
    });
  } catch (err) {
    console.error("Error retrieving session:", err);
    return res.status(400).send("Invalid session");
  }

  if (session.payment_status !== "paid") {
    return res.status(400).send("Payment not completed");
  }

  const lineItem = session.line_items?.data?.[0];
  const priceId = lineItem?.price?.id;

  if (!priceId) {
    return res.status(400).send("No priceId found on session");
  }

  const product = await findProductByPriceId(priceId);
  if (!product) {
    return res.status(404).send("Product not found");
  }

  const email = session.customer_details?.email || "";
  const token = crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

  // Enregistrement dans l’onglet Downloads
  await appendDownloadRow({
    timestamp: now.toISOString(),
    email,
    priceId,
    ref: product.ref,
    productName: product.name,
    token,
    expiresAt: expiresAt.toISOString(),
    downloadedAt: "",
    downloadCount: 0,
    fileId: product.fileId,
  });

  // URL de téléchargement sécurisée (backend lui-même)
  const downloadUrl = `${req.protocol}://${req.get("host")}/dl/${token}`;

  // Page HTML premium + minimaliste
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Merci pour votre achat – Harmonya Lab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --beige-clair: #f5eee6;
      --beige-profond: #d2b48c;
      --gris-chaud: #5f5a55;
      --blanc: #ffffff;
      --noir-profond: #111111;
      --bleu-canard: #006d77;
      --or-tres-clair: #f4d58d;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--beige-clair);
      color: var(--noir-profond);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      padding: 32px 16px;
    }
    .card {
      background: var(--blanc);
      max-width: 640px;
      width: 100%;
      border-radius: 18px;
      padding: 32px 24px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }
    .brand {
      font-size: 14px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gris-chaud);
      margin-bottom: 12px;
    }
    .title {
      font-size: 26px;
      line-height: 1.3;
      margin-bottom: 12px;
      color: var(--noir-profond);
    }
    .subtitle {
      font-size: 15px;
      line-height: 1.6;
      color: var(--gris-chaud);
      margin-bottom: 24px;
    }
    .product-block {
      background: var(--beige-clair);
      border-radius: 14px;
      padding: 16px 18px;
      margin-bottom: 24px;
      border: 1px solid rgba(0, 0, 0, 0.04);
    }
    .product-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: var(--gris-chaud);
      margin-bottom: 6px;
    }
    .product-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--noir-profond);
    }
    .download-section {
      margin-bottom: 24px;
    }
    .download-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--gris-chaud);
      margin-bottom: 10px;
    }
    .download-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      border-radius: 999px;
      border: none;
      background: var(--bleu-canard);
      color: var(--blanc);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
      box-shadow: 0 10px 25px rgba(0, 109, 119, 0.25);
    }
    .download-button:hover {
      background: #00535a;
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(0, 109, 119, 0.3);
    }
    .download-button span.icon {
      margin-left: 8px;
      font-size: 16px;
    }
    .meta {
      font-size: 12px;
      color: var(--gris-chaud);
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .meta strong {
      font-weight: 600;
      color: var(--noir-profond);
    }
    .footer-note {
      font-size: 12px;
      color: var(--gris-chaud);
      margin-top: 18px;
      line-height: 1.6;
    }
    @media (max-width: 600px) {
      .card {
        padding: 24px 18px;
        border-radius: 16px;
      }
      .title {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">HARMONYA LAB</div>
    <h1 class="title">Merci pour votre achat.</h1>
    <p class="subtitle">
      Votre commande est confirmée. Vous pouvez télécharger votre contenu numérique dès maintenant via le lien sécurisé ci‑dessous.
    </p>

    <section class="product-block">
      <div class="product-label">Produit</div>
      <div class="product-name">${escapeHtml(product.name)}</div>
    </section>

    <section class="download-section">
      <div class="download-label">Téléchargement</div>
      <a class="download-button" href="${downloadUrl}">
        Télécharger vos fichiers
        <span class="icon">↓</span>
      </a>
    </section>

    <p class="meta">
      <strong>Email :</strong> ${escapeHtml(email || "—")}<br />
      <strong>Validité du lien :</strong> jusqu’au ${expiresAt.toLocaleString("fr-FR")}
    </p>

    <p class="footer-note">
      Si le lien a expiré ou si vous rencontrez un problème de téléchargement, vous pouvez nous contacter en indiquant votre email et le nom du produit.
    </p>
  </main>
</body>
</html>
  `;

  res.status(200).send(html);
}

// Petite fonction pour éviter l’injection HTML
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
