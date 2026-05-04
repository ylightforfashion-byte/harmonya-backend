import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import checkoutRoute from "./checkoutRoute.js";
import { stripeWebhookHandler, stripeRawBody } from "./stripeWebhook.js";
import { handleDownload } from "./downloadRoute.js";
import { successHandler } from "./success.js";
import { downloadHandler } from "./download.js";

const app = express();

// Route Stripe → PDF
app.get("/success", successHandler);

// Route téléchargement sécurisé
app.get("/dl/:token", downloadHandler);

// Stripe webhook must use raw body
app.post("/stripe/webhook", stripeRawBody, stripeWebhookHandler);

// Other routes use JSON
app.use(cors());
app.use(express.json());

// Checkout route
app.use("/", checkoutRoute);

// Download route
app.get("/dl/:token", handleDownload);

app.get("/", (req, res) => {
  res.send("Harmony Lab backend is running.");
});

app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
});
