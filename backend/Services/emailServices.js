const nodemailer = require("nodemailer");

/**
 * Creates and caches the Nodemailer transporter
 */
let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // Custom SMTP if host provided, otherwise default to Gmail
  if (process.env.EMAIL_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user, pass },
    });
  } else {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return cachedTransporter;
};

/**
 * Sends a password reset email with a secure token link
 * @param {string} email - Recipient email
 * @param {string} token - Password reset JWT
 */
const sendResetEmail = async (email, token) => {
  const clientUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${clientUrl}/reset-password/${token}`;

  const transporter = getTransporter();

  // Fallback if email credentials are not yet configured (e.g. local dev without env)
  if (!transporter) {
    console.warn("\n=======================================================");
    console.warn("⚠️  [EMAIL SERVICE] EMAIL_USER / EMAIL_PASS not configured!");
    console.warn(`📩  Password reset requested for: ${email}`);
    console.warn(`🔗  Reset Link: ${resetUrl}`);
    console.warn("=======================================================\n");
    return {
      success: true,
      simulated: true,
      message: "Email credentials not configured. Reset link logged to server console.",
      resetUrl,
    };
  }

  const senderName = process.env.EMAIL_FROM_NAME || "Parkin'son";
  const senderEmail = process.env.EMAIL_USER;
  const from = `"${senderName}" <${senderEmail}>`;

  const mailOptions = {
    from,
    to: email,
    subject: "Reset your Parkin'son password",
    text: `You requested a password reset for your Parkin'son account.\n\nClick the link below to reset your password (valid for 10 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— The Parkin'son Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E4E4E7;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050507; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0E0E12; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF;">
                PARKIN'SON
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #71717A; text-transform: uppercase; letter-spacing: 0.1em;">
                Focus &amp; Productivity Suite
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #F4F4F5;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #A1A1AA;">
                We received a request to reset the password associated with <strong style="color: #E4E4E7;">${email}</strong>. Click the button below to choose a new password:
              </p>

              <!-- Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #5278E8; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(82, 120, 232, 0.4);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px 0; font-size: 12px; color: #71717A; line-height: 1.5;">
                This link will expire in <strong style="color: #A1A1AA;">10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
              </p>
              
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #52525B;">
                  Button not working? Copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #5278E8;">
                  <a href="${resetUrl}" style="color: #819BE8; text-decoration: underline;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; background-color: #070709; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #52525B;">
                &copy; ${new Date().getFullYear()} Parkin'son. Built for deep work and extreme focus.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] Password reset email sent to ${email} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[emailService] Failed to send email to ${email}:`, error);
    throw error;
  }
};

module.exports = sendResetEmail;