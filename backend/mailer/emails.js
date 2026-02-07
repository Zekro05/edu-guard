import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

// -------------------- BREVO CLIENT SETUP --------------------
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// -------------------- HELPER FUNCTION --------------------
const sendEmail = async (to, subject, html) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "EduGuard",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error?.response?.body || error.message
    );
    throw new Error("Email sending failed");
  }
};

// -------------------- VERIFICATION EMAIL --------------------
export const sendVerificationEmail = async (email, verificationCode) => {
  const subject = "Verify your Email";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to EduGuard!</h2>
      <p>Your verification code is:</p>
      <h3 style="letter-spacing: 2px;">${verificationCode}</h3>
      <p>This code will expire in 24 hours.</p>
    </div>
  `;

  await sendEmail(email, subject, html);
};

// -------------------- WELCOME EMAIL --------------------
export const sendWelcomeEmail = async (email, name) => {
  const subject = "Welcome to EduGuard!";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Hello ${name},</h2>
      <p>Your email has been verified successfully.</p>
      <p>Welcome to <strong>EduGuard</strong> 🎉</p>
    </div>
  `;

  await sendEmail(email, subject, html);
};

// -------------------- PASSWORD RESET REQUEST --------------------
export const sendPasswordResetEmail = async (email, resetURL) => {
  const subject = "Reset your Password";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password:</p>
      <a 
        href="${resetURL}" 
        target="_blank"
        style="
          display:inline-block;
          padding:10px 16px;
          background:#2563eb;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
          margin-top:10px;
        "
      >
        Reset Password
      </a>
      <p style="margin-top:16px;">This link will expire in 1 hour.</p>
    </div>
  `;

  await sendEmail(email, subject, html);
};

// -------------------- PASSWORD RESET SUCCESS --------------------
export const sendResetSuccessEmail = async (email) => {
  const subject = "Password Reset Successful";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset Successful</h2>
      <p>Your password has been updated successfully.</p>
      <p>You can now log in using your new password.</p>
    </div>
  `;

  await sendEmail(email, subject, html);
};