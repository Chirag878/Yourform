import nodemailer from "nodemailer";
import { env } from "../env";

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const port = parseInt(env.SMTP_PORT || "587");
      const secure = env.SMTP_SECURE === "true" || port === 465;

      console.log(`[EMAIL SERVICE] Initializing custom SMTP transporter (${env.SMTP_HOST}:${port}, secure=${secure})...`);
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      (this.transporter as any).isTest = false;
    } else {
      console.log("[EMAIL SERVICE] No SMTP credentials provided. Creating a dynamic Ethereal Mail sandbox account...");
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      (this.transporter as any).isTest = true;
      (this.transporter as any).testAccount = testAccount;
    }
    return this.transporter;
  }

  public static async sendMail(options: { to: string; subject: string; html: string; text?: string }) {
    try {
      const transporter = await this.getTransporter();
      const fromEmail = env.SMTP_FROM || '"YourForm" <noreply@yourform.com>';

      const info = await transporter.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
      });

      if ((transporter as any).isTest) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`\n=============================================================`);
        console.log(`[ETHEREAL MAILER SANDBOX] Test email sent successfully!`);
        console.log(`Recipient: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Preview Sandbox URL: ${previewUrl}`);
        console.log(`=============================================================\n`);
      } else {
        console.log(`[SMTP MAILER] Email successfully sent to ${options.to} (MessageID: ${info.messageId})`);
      }
      return info;
    } catch (error) {
      console.error("[EMAIL SERVICE ERROR] Failed to send email:", error);
      throw error;
    }
  }

  // --- Premium HTML Email Templates ---

  public static getVerifyEmailTemplate(fullName: string, verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0f766e, #115e59); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .welcome { font-size: 20px; color: #ffffff; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 40px 0; }
          .btn { display: inline-block; background-color: #14b8a6; color: #0d1117 !important; text-decoration: none; padding: 14px 30px; font-weight: bold; border-radius: 8px; font-size: 16px; transition: background-color 0.2s; }
          .footer { background-color: #090d13; padding: 20px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #30363d; }
          .link-text { word-break: break-all; color: #14b8a6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to YourForm</h1>
          </div>
          <div class="content">
            <div class="welcome">Hi ${fullName},</div>
            <p>Thank you for signing up for YourForm! To complete your registration and unlock your creator dashboard, please verify your email address by clicking the button below:</p>
            <div class="btn-container">
              <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p class="link-text"><a href="${verificationLink}" style="color: #14b8a6;">${verificationLink}</a></p>
            <p style="margin-top: 40px;">Best regards,<br>The YourForm Team</p>
          </div>
          <div class="footer">
            &copy; 2026 YourForm. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public static getResetPasswordTemplate(fullName: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0f766e, #115e59); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .welcome { font-size: 20px; color: #ffffff; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 40px 0; }
          .btn { display: inline-block; background-color: #14b8a6; color: #0d1117 !important; text-decoration: none; padding: 14px 30px; font-weight: bold; border-radius: 8px; font-size: 16px; transition: background-color 0.2s; }
          .footer { background-color: #090d13; padding: 20px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #30363d; }
          .link-text { word-break: break-all; color: #14b8a6; }
          .warning { background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 30px; font-size: 14px; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <div class="welcome">Hi ${fullName},</div>
            <p>We received a request to reset the password for your YourForm account. Click the button below to choose a new password:</p>
            <div class="btn-container">
              <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p>If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
            <div class="warning">
              <strong>Notice:</strong> This password reset link is only valid for <strong>1 hour</strong>. After that, you will need to request a new one.
            </div>
            <p style="margin-top: 40px;">Best regards,<br>The YourForm Team</p>
          </div>
          <div class="footer">
            &copy; 2026 YourForm. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public static getRespondentConfirmationTemplate(formTitle: string, submissionDate: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Response Captured</title>
        <style>
          body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0f766e, #115e59); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .welcome { font-size: 20px; color: #ffffff; margin-bottom: 20px; }
          .card { background-color: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .card-item { margin-bottom: 12px; }
          .card-item strong { color: #ffffff; }
          .footer { background-color: #090d13; padding: 20px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #30363d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Submission Received</h1>
          </div>
          <div class="content">
            <div class="welcome">Hi!</div>
            <p>Your submission for the form <strong>"${formTitle}"</strong> was successfully recorded.</p>
            <div class="card">
              <div class="card-item"><strong>Form Title:</strong> ${formTitle}</div>
              <div class="card-item"><strong>Submission Date:</strong> ${submissionDate}</div>
              <div class="card-item"><strong>Status:</strong> Success (Completed)</div>
            </div>
            <p>Thank you for submitting your response!</p>
            <p style="margin-top: 40px;">Best regards,<br>The YourForm Team</p>
          </div>
          <div class="footer">
            &copy; 2026 YourForm. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public static getCreatorAlertTemplate(creatorName: string, formTitle: string, submissionDate: string, dashboardUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Response Received</title>
        <style>
          body { font-family: 'Outfit', -apple-system, sans-serif; background-color: #0d1117; color: #c9d1d9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0f766e, #115e59); padding: 40px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .welcome { font-size: 20px; color: #ffffff; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 40px 0; }
          .btn { display: inline-block; background-color: #14b8a6; color: #0d1117 !important; text-decoration: none; padding: 14px 30px; font-weight: bold; border-radius: 8px; font-size: 16px; transition: background-color 0.2s; }
          .card { background-color: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 20px; margin: 30px 0; }
          .card-item { margin-bottom: 12px; }
          .card-item strong { color: #ffffff; }
          .footer { background-color: #090d13; padding: 20px; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #30363d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Form Response</h1>
          </div>
          <div class="content">
            <div class="welcome">Hi ${creatorName},</div>
            <p>You have received a new response to your form <strong>"${formTitle}"</strong>.</p>
            <div class="card">
              <div class="card-item"><strong>Form Title:</strong> ${formTitle}</div>
              <div class="card-item"><strong>Date Received:</strong> ${submissionDate}</div>
            </div>
            <div class="btn-container">
              <a href="${dashboardUrl}" class="btn" target="_blank">View Responses Dashboard</a>
            </div>
            <p style="margin-top: 40px;">Best regards,<br>The YourForm Team</p>
          </div>
          <div class="footer">
            &copy; 2026 YourForm. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
