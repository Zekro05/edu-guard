import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// -------------------- Nodemailer transporter --------------------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App password if 2FA enabled
    },
});

// -------------------- HELPER FUNCTION --------------------
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"EduGuard" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(`Error sending email: ${error}`);
    }
};

// -------------------- VERIFICATION EMAIL --------------------
export const sendVerificationEmail = async (email, verificationCode) => {
    const subject = "Verify your Email";
    const html = `
        <h2>Welcome to EduGuard!</h2>
        <p>Your verification code is:</p>
        <h3>${verificationCode}</h3>
        <p>This code will expire in 24 hours.</p>
    `;
    await sendEmail(email, subject, html);
};

// -------------------- WELCOME EMAIL --------------------
export const sendWelcomeEmail = async (email, name) => {
    const subject = "Welcome to EduGuard!";
    const html = `
        <h2>Hello ${name},</h2>
        <p>Welcome to EduGuard! Your email has been verified successfully.</p>
        <p>We’re excited to have you on board.</p>
    `;
    await sendEmail(email, subject, html);
};

// -------------------- PASSWORD RESET REQUEST --------------------
export const sendPasswordResetEmail = async (email, resetURL) => {
    const subject = "Reset your Password";
    const html = `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}" target="_blank">${resetURL}</a>
        <p>This link will expire in 1 hour.</p>
    `;
    await sendEmail(email, subject, html);
};

// -------------------- PASSWORD RESET SUCCESS --------------------
export const sendResetSuccessEmail = async (email) => {
    const subject = "Password Reset Successful";
    const html = `
        <h2>Password Reset Successful</h2>
        <p>Your password has been updated successfully. You can now log in with your new password.</p>
    `;
    await sendEmail(email, subject, html);
};
