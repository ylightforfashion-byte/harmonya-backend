import nodemailer from "nodemailer";
import { CONFIG } from "./config.js";

const transporter = nodemailer.createTransport({
  host: CONFIG.SMTP_HOST,
  port: Number(CONFIG.SMTP_PORT),
  secure: false,
  auth: {
    user: CONFIG.SMTP_USER,
    pass: CONFIG.SMTP_PASS
  }
});

export async function sendEmail({ to, subject, body }) {
  await transporter.sendMail({
    from: CONFIG.EMAIL_FROM,
    to,
    subject,
    text: body
  });
}
