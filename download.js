const path = require("path");
const fs = require("fs");
const { validateAndConsumeToken } = require("./tokens");

function registerDownload(app) {
  app.get("/dl/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const validation = await validateAndConsumeToken(token);

      if (!validation.valid) {
        return res
          .status(400)
          .send("This download link has expired or is invalid.");
      }

      const products = JSON.parse(
        fs.readFileSync(path.join(__dirname, "products.json"), "utf8")
      );
      const product = products[validation.productSlug];

      if (!product) {
        return res.status(404).send("Product not found.");
      }

      const filePath = path.join(__dirname, "files", product.file);
      res.download(filePath);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error.");
    }
  });
}

module.exports = { registerDownload };
