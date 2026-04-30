// src/checkoutRoute.js
import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, currency } = req.body;

    const lineItems = items.map(item => ({
      price: item.priceId,
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      currency: currency || "usd",
      success_url: "https://harmonya-cart-panel.onrender.com/success",
      cancel_url: "https://harmonya-cart-panel.onrender.com/cancel"
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Error Stripe :", error);
    res.status(500).json({ error: "Unable to create Stripe Checkout session." });
  }
});

export default router;
