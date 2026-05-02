import Stripe from "stripe";
import bodyParser from "body-parser";
import { CONFIG } from "./config.js";
import { findProductByPriceId, appendDownloadRow } from "./sheets.js";
import { sendEmail } from "./email.js";
import { v4 as uuidv4 } from "uuid";
import { logSaleToGoogleSheet } from "./sheets.js";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY);

export const stripeRawBody = bodyParser.raw({ type: "application/json" });

export function stripeWebhookHandler(req, res) {
  let event;
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      CONFIG.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    handleCheckoutSessionCompleted(event.data.object)
      .then(() => res.status(200).send("ok"))
      .catch(err => {
        console.error("Error handling session:", err);
        res.status(500).send("Internal error");
      });
  } else {
    res.status(200).send("ignored");
  }
}

async function handleCheckoutSessionCompleted(session) {
  const email = session.customer_details?.email;
  const priceId = session.metadata?.price_id;

  if (!email || !priceId) {
    console.warn("Missing email or price_id in session");
    return;
  }

  const product = await findProductByPriceId(priceId);
  if (!product) {
    console.warn("Product not found for priceId:", priceId);
    return;
  }

  const token = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1h

  await appendDownloadRow({
    timestamp: now,
    email,
    priceId,
    ref: product.ref,
    productName: product.name,
    token,
    expiresAt,
    downloadedAt: "",
    downloadCount: 0
  });

  const downloadLink = `${CONFIG.DOWNLOAD_BASE_URL}/${token}`;

  const body = `
Thank you for your purchase!

Product: ${product.name}
Reference: ${product.ref}

Your download link (valid for 1 hour):
${downloadLink}

If the link expires, reply to this email and we’ll help you.
  `;

  await sendEmail({
    to: email,
    subject: `Your Harmony Lab download – ${product.name}`,
    body
  });
}
