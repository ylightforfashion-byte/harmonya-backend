import "dotenv/config";
import express from "express";
import cors from "cors";

import { CONFIG } from "./config.js";
import { successHandler } from "./success.js";
import { downloadHandler } from "./download.js";
import { stripeWebhookHandler } from "./stripeWebhook.js";

const app = express();

// Webhook Stripe → doit recevoir le raw body
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

// Pour le reste de l’API
app.use(cors());
app.use(express.json());

// Page de remerciement + liens de téléchargement
app.get("/success", successHandler);

// Téléchargement sécurisé par token
app.get("/dl/:token", downloadHandler);

app.get("/", (req, res) => {
  res.send("Harmonya Lab backend is running.");
});

app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
});
