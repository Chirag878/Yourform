import nodemailer from "nodemailer";

import { env } from "../env";

const hasSmtpConfig =
  !!env.SMTP_HOST &&
  !!env.SMTP_PORT &&
  !!env.SMTP_USER &&
  !!env.SMTP_PASS &&
  !!env.SMTP_FROM;

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!hasSmtpConfig) {
    return null;
  }
  if (transporter) {
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  return transporter;
};

export const sendMailOrLog = async (params: { to: string; subject: string; text: string; html: string; fallbackLabel: string }) => {
  const tx = getTransporter();
  if (!tx) {
    console.log(`\n[MAILER FALLBACK] ${params.fallbackLabel} for ${params.to}:\n${params.text}\n`);
    return;
  }

  await tx.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
};
