import nodemailer, { type Transporter } from "nodemailer";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// Renders a super-admin-managed template and sends it. Silently no-ops if
// SMTP isn't configured yet (SMTP_HOST/USER/PASS in .env.local) or the
// template doesn't exist — callers treat email as best-effort, never
// blocking the underlying action (an order, a withdrawal update, etc).
export async function sendTemplatedEmail(
  templateKey: string,
  to: string,
  vars: Record<string, string>
): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) return false;

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT subject, html_body FROM email_templates WHERE template_key = ? LIMIT 1",
    [templateKey]
  );
  const template = rows[0];
  if (!template) return false;

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: interpolate(template.subject, vars),
      html: interpolate(template.html_body, vars),
    });
    return true;
  } catch (err) {
    console.error(`[mailer] failed to send "${templateKey}" to ${to}:`, (err as Error).message);
    return false;
  }
}
