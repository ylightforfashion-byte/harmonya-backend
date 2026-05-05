const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { initDb } = require("./database");
const { createToken } = require("./tokens");
const { registerDownload } = require("./download");

const app = express();
app.use(cors());
app.use(express.json());

initDb().then(() => {
  console.log("Database initialized");
});

app.get("/", (req, res) => {
  res.send("Harmonya backend is running.");
});

// Page de remerciement Stripe : /success?product=pack-minimalist
app.get("/success", async (req, res) => {
  try {
    const slug = req.query.product;
    if (!slug) {
      return res.status(400).send("Missing product parameter.");
    }

    const products = JSON.parse(
      fs.readFileSync(path.join(__dirname, "products.json"), "utf8")
    );
    const product = products[slug];

    if (!product) {
      return res.status(404).send("Product not found.");
    }

    const token = await createToken(slug);

    const template = fs.readFileSync(
      path.join(__dirname, "views", "success.html"),
      "utf8"
    );

    const html = template
      .replace("{{PRODUCT_NAME}}", product.name)
      .replace("{{DOWNLOAD_URL}}", `/dl/${token}`);

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error.");
  }
});

// Route de téléchargement sécurisé
registerDownload(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
