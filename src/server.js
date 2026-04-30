import express from "express";
import { CONFIG } from "./config.js";
import { stripeWebhookHandler, stripeRawBody } from "./stripeWebhook.js";
import { handleDownload } from "./downloadRoute.js";

const app = express();

// Stripe webhook must use raw body
app.post("/stripe/webhook", stripeRawBody, stripeWebhookHandler);

// Other routes use JSON
app.use(express.json());

app.get("/dl/:token", handleDownload);

app.get("/", (req, res) => {
  res.send("Harmony Lab backend is running.");
});

app.listen(CONFIG.PORT, () => {
  console.log(`Server running on port ${CONFIG.PORT}`);
});
