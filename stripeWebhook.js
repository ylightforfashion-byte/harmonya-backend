import Stripe from "stripe";
import { CONFIG } from "./config.js";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY);

export async function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      CONFIG.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Tu peux ajouter des événements si tu veux
  switch (event.type) {
    case "checkout.session.completed":
      console.log("Checkout completed:", event.data.object.id);
      break;
  }

  res.json({ received: true });
}
