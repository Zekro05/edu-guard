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

// -------------------- VERIFICATION / LOGIN OTP EMAIL --------------------
export const sendVerificationEmail = async (email, otp) => {
  const subject = "Your Verification Code";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>EduGuard Verification</h2>
      <p>Your verification code is:</p>

      <h1 style="
        letter-spacing: 4px;
        background: #f3f4f6;
        padding: 12px;
        display: inline-block;
        border-radius: 8px;
      ">
        ${otp}
      </h1>

      <p>This code will expire soon.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail(email, subject, html);
};

// -------------------- PASSWORD RESET OTP EMAIL --------------------
export const sendPasswordResetEmail = async (email, otp) => {
  const subject = "Reset Your Password";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Password Reset Request</h2>
      <p>Use the OTP below to reset your password:</p>

      <h1 style="
        letter-spacing: 4px;
        background: #f3f4f6;
        padding: 12px;
        display: inline-block;
        border-radius: 8px;
      ">
        ${otp}
      </h1>

      <p style="margin-top: 16px;">
        This OTP will expire in <strong>10 minutes</strong>.
      </p>

      <p>If you did not request a password reset, you can safely ignore this email.</p>
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