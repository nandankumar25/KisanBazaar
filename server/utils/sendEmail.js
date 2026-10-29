const { Resend } = require('resend');

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return null;
  }
  return new Resend(apiKey);
};

const defaultFrom = process.env.EMAIL_FROM || 'KisanBazaar <onboarding@resend.dev>';

/**
 * Send branded email verification message via Resend
 */
const sendVerificationEmail = async ({ email, name, verificationUrl, token }) => {
  const resend = getResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #a7f3d0; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .btn { display: inline-block; background-color: #059669; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; margin: 24px 0; text-align: center; }
        .footer { padding: 20px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; background: #f8fafc; }
        .token-box { background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; word-break: break-all; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KisanBazaar</h1>
          <p>Farmer Market-Linkage & Produce Trading Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name || 'Farmer & Trader'},</div>
          <p>Welcome to KisanBazaar! Please verify your email address to activate all platform features, create crop lots, make offers, and book transport services.</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or paste this link into your browser:</p>
          <div class="token-box">${verificationUrl}</div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This verification link will expire in 24 hours. If you did not create a KisanBazaar account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} KisanBazaar Marketplace. Transparent Agricultural Trading.
        </div>
      </div>
    </body>
    </html>
  `;

  // Always log verification link in development for smooth local testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n================ [KISANBAZAAR EMAIL VERIFICATION] ================`);
    console.log(`To: ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log(`==================================================================\n`);
  }

  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY is not configured. Email logged to console above.');
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: defaultFrom,
      to: [email],
      subject: 'Verify your KisanBazaar account',
      html: htmlContent,
    });

    if (error) {
      console.warn(`[Resend Error]: ${error.message}. Note: In Resend sandbox mode, emails can only be delivered to your registered Resend account email unless a custom domain is verified.`);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.warn(`[Resend Exception]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Send branded password reset email via Resend
 */
const sendPasswordResetEmail = async ({ email, name, resetUrl, token }) => {
  const resend = getResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #a7f3d0; }
        .content { padding: 32px 24px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .btn { display: inline-block; background-color: #059669; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; margin: 24px 0; text-align: center; }
        .footer { padding: 20px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; background: #f8fafc; }
        .token-box { background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; word-break: break-all; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KisanBazaar</h1>
          <p>Farmer Market-Linkage & Produce Trading Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name || 'KisanBazaar Member'},</div>
          <p>You requested a password reset for your KisanBazaar account. Click the button below to choose a new secure password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or copy this link into your browser:</p>
          <div class="token-box">${resetUrl}</div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This password reset link will expire in 1 hour. If you did not request a password reset, please ignore this email or review your account security.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} KisanBazaar Marketplace.
        </div>
      </div>
    </body>
    </html>
  `;

  // Always log reset link in development for smooth local testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n================ [KISANBAZAAR PASSWORD RESET] ================`);
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`==============================================================\n`);
  }

  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY is not configured. Email logged to console above.');
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: defaultFrom,
      to: [email],
      subject: 'Reset your KisanBazaar password',
      html: htmlContent,
    });

    if (error) {
      console.warn(`[Resend Error]: ${error.message}. Note: In Resend sandbox mode, emails can only be delivered to your registered Resend account email unless a custom domain is verified.`);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.warn(`[Resend Exception]: ${err.message}`);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
