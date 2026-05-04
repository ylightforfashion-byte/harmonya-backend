// pdf.js
import puppeteer from "puppeteer";
import fs from "fs";

export async function generatePDF({ logoUrl, products, contactText }) {
  // 1. Construire le bloc produits
  const productsBlock = products
    .map(
      (p) => `
      <div class="product">
        <h2 class="product-name">${p.name}</h2>
        <p class="product-ref">REF · ${p.ref}</p>
        <p class="product-note">Download link (valid for 1 hour):</p>
        <a class="download-link" href="${p.downloadUrl}">
          ${p.downloadUrl}
        </a>
      </div>
    `
    )
    .join("");

  // 2. Charger le template HTML
  let html = fs.readFileSync("./templates/pdf.html", "utf8");

  // 3. Remplacer les variables
  html = html
    .replace("{{LOGO_URL}}", logoUrl)
    .replace("{{PRODUCTS_BLOCK}}", productsBlock)
    .replace("{{CONTACT_TEXT}}", contactText)
    .replace("{{YEAR}}", new Date().getFullYear());

  // 4. Générer le PDF via Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
  });

  await browser.close();
  return pdfBuffer;
}
