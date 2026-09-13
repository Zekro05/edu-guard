import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
dotenv.config();

// -------------------- BREVO CLIENT SETUP --------------------
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// -------------------- HELPER FUNCTION --------------------
export const sendEmail = async (to, subject, html) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "GuidEd Student Guidance",
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
      <h2>GuidEd Verification</h2>
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

// -------------------- ADMIN/GUIDANCE NOTIFICATION EMAIL --------------------
export const sendNotificationEmail = async ({
  to,
  subject,
  html,
}) => {
  await sendEmail(to, subject, html);
};

// -------------------- STUDENT ACCOUNT WELCOME EMAIL --------------------
export const sendStudentWelcomeEmail = async ({
  email,
  firstName,
  studentId,
  password,
}) => {
  const subject = "Your GuidEd Student Account Has Been Created";

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      background-color: #f7f9f8;
      padding: 40px 20px;
    ">

      <div style="
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      ">

        <h2 style="
          margin-top: 0;
          color: #222;
        ">
          Welcome to GuidEd!
        </h2>

        <p style="font-size: 15px; color: #444;">
          Hello <strong>${firstName || "Student"}</strong>,
        </p>

        <p style="font-size: 15px; color: #444; line-height: 1.6;">
          Your student account for the
          <strong>GuidEd Student Discipline Management System</strong>
          has been created by
          <strong>Our Lady of the Holy Rosary School - General Trias Campus</strong>.
        </p>

        <div style="
          background: #f3f4f6;
          border-radius: 10px;
          padding: 20px;
          margin: 24px 0;
        ">

          <h3 style="
            margin-top: 0;
            color: #222;
          ">
            Your Login Credentials
          </h3>

          <p style="margin: 8px 0;">
            <strong>Student ID:</strong>
            ${studentId}
          </p>

          <p style="margin: 8px 0;">
            <strong>Email:</strong>
            ${email}
          </p>

          <p style="margin: 8px 0;">
            <strong>Temporary Password:</strong>
            ${password}
          </p>

        </div>

        <p style="
          font-size: 14px;
          color: #555;
          line-height: 1.6;
        ">
          You can use these credentials to log in to your GuidEd
          student account.
        </p>

        <p style="
          font-size: 14px;
          color: #555;
          line-height: 1.6;
        ">
          For your security, please change your password after
          your first login.
        </p>

        <div style="
          margin: 28px 0;
          text-align: center;
        ">

          <a
            href="${process.env.GUIDED_URL}"
            style="
              display: inline-block;
              background: #198754;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Login to GuidEd
          </a>

        </div>

        <hr style="
          border: none;
          border-top: 1px solid #eeeeee;
          margin: 28px 0;
        ">

        <p style="
          font-size: 12px;
          color: #888;
          line-height: 1.5;
        ">
          This is an automated message from GuidEd.
          Please do not reply to this email.
        </p>

        <p style="
          font-size: 12px;
          color: #888;
        ">
          GuidEd<br>
          Student Guidance<br>
          Our Lady of the Holy Rosary School - General Trias Campus
        </p>

      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
};