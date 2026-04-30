export const CONFIG = {
  PORT: process.env.PORT || 3000,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  SHEET_ID: "1Cq9mknFJUfpi9pBNGocJgph3og6d4JD6QXNgNi1lMTs",
  PRODUCTS_SHEET_NAME: "Products",
  DOWNLOADS_SHEET_NAME: "Downloads",

  DRIVE_FOLDER_ID: "18StJGw3AcfcJEM_n1SM6cWaRaKxwHmAz",

  EMAIL_FROM: process.env.EMAIL_FROM,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  DOWNLOAD_BASE_URL: "https://harmonya-download.onrender.com/dl"
};
