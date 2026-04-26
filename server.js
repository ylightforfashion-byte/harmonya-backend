// --- IMPORTS ---
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// --- APP SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

// --- ROUTE CHECKOUT ---
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, currency } = req.body;

    // Stripe line_items format
    const lineItems = items.map(item => ({
      price: item.priceId,
      quantity: item.quantity
    }));

    // Create Stripe Checkout session
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
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: "Impossible de créer la session Stripe." });
  }
});

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend Stripe actif sur le port " + PORT);
});
