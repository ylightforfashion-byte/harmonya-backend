import express from "express";
import cors from "cors";
import Stripe from "stripe";

const app = express();

// ⚠️ À REMPLACER PAR TES CLÉS STRIPE
const STRIPE_TEST_KEY = "sk_test_xxxxxxxxxxxxxxxxxxxxx";
const STRIPE_LIVE_KEY = "sk_live_xxxxxxxxxxxxxxxxxxxxx";

// MODE : "test" ou "live"
const MODE = "test";

const stripe = new Stripe(MODE === "test" ? STRIPE_TEST_KEY : STRIPE_LIVE_KEY);

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items,
      success_url: "https://ton-site-google-sites.com/merci",
      cancel_url: "https://ton-site-google-sites.com/annule"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de la session" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Harmonya backend running on port ${PORT}`);
});
