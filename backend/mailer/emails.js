import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// =========================================================
// BREVO CLIENT SETUP
// =========================================================

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey =
  process.env.BREVO_API_KEY;

const emailApi =
  new SibApiV3Sdk.TransactionalEmailsApi();

// =========================================================
// GUIDED BRANDING
// =========================================================

const BRAND = {
  primary: "#198754",
  primaryDark: "#146c43",
  background: "#f5f7f6",
  card: "#ffffff",
  text: "#212529",
  muted: "#6c757d",
  border: "#e9ecef",
  softGreen: "#eaf6ef",
  softGray: "#f8f9fa",
  warning: "#fff8e1",
  warningBorder: "#f0c36d",
};

const SCHOOL_NAME =
  "Our Lady of the Holy Rosary School - General Trias Campus";

const SYSTEM_NAME =
  "GuidEd Student Guidance";

const SYSTEM_DESCRIPTION =
  "Student Discipline Management System";

// =========================================================
// HTML ESCAPE HELPER
// =========================================================
// Prevents unexpected characters in dynamic values from
// breaking the email HTML.

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// =========================================================
// SHARED EMAIL TEMPLATE
// =========================================================

const createEmailTemplate = ({
  preheader = "",
  title,
  subtitle = "",
  content,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${escapeHtml(title)}</title>

  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }

      .email-card {
        border-radius: 0 !important;
      }

      .email-padding {
        padding: 28px 20px !important;
      }

      .credential-value {
        font-size: 14px !important;
      }
    }
  </style>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background: ${BRAND.background};
    font-family: Arial, Helvetica, sans-serif;
    color: ${BRAND.text};
  "
>

  <!-- Preheader -->
  <div
    style="
      display: none;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      color: transparent;
    "
  >
    ${escapeHtml(preheader)}
  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background: ${BRAND.background};
      margin: 0;
      padding: 0;
    "
  >
    <tr>
      <td align="center" style="padding: 36px 16px;">

        <table
          class="email-container"
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width: 100%;
            max-width: 600px;
          "
        >

          <!-- =================================================
               HEADER
          ================================================== -->

          <tr>
            <td
              align="center"
              style="
                padding-bottom: 20px;
              "
            >

              <div
                style="
                  display: inline-block;
                  font-size: 26px;
                  font-weight: 700;
                  letter-spacing: -0.5px;
                  color: ${BRAND.primary};
                "
              >
                Guid<span style="color: ${BRAND.text};">Ed</span>
              </div>

              <div
                style="
                  margin-top: 5px;
                  font-size: 12px;
                  color: ${BRAND.muted};
                  letter-spacing: 0.3px;
                "
              >
                ${SYSTEM_NAME}
              </div>

            </td>
          </tr>

          <!-- =================================================
               MAIN CARD
          ================================================== -->

          <tr>
            <td
              class="email-card"
              style="
                background: ${BRAND.card};
                border: 1px solid ${BRAND.border};
                border-radius: 14px;
                overflow: hidden;
                box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
              "
            >

              <!-- Green top border -->
              <div
                style="
                  height: 5px;
                  background: ${BRAND.primary};
                  font-size: 0;
                  line-height: 0;
                "
              >
                &nbsp;
              </div>

              <div class="email-padding" style="padding: 36px 40px;">

                <!-- TITLE -->

                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                    line-height: 1.3;
                    font-weight: 700;
                    color: ${BRAND.text};
                  "
                >
                  ${escapeHtml(title)}
                </h1>

                ${
                  subtitle
                    ? `
                <p
                  style="
                    margin: 10px 0 28px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: ${BRAND.muted};
                  "
                >
                  ${escapeHtml(subtitle)}
                </p>
                `
                    : `
                <div style="height: 28px;"></div>
                `
                }

                ${content}

              </div>

            </td>
          </tr>

          <!-- =================================================
               FOOTER
          ================================================== -->

          <tr>
            <td align="center" style="padding: 24px 20px 0;">

              <p
                style="
                  margin: 0 0 7px;
                  font-size: 12px;
                  line-height: 1.5;
                  color: ${BRAND.muted};
                "
              >
                ${SYSTEM_NAME}
              </p>

              <p
                style="
                  margin: 0 0 7px;
                  font-size: 11px;
                  line-height: 1.5;
                  color: ${BRAND.muted};
                "
              >
                ${SCHOOL_NAME}
              </p>

              <p
                style="
                  margin: 12px 0 0;
                  font-size: 10px;
                  line-height: 1.5;
                  color: #9aa0a6;
                "
              >
                This is an automated message from the GuidEd system.
                Please do not reply directly to this email.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

// =========================================================
// SEND EMAIL
// =========================================================

export const sendEmail = async (
  to,
  subject,
  html
) => {
  try {
    await emailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "GuidEd Student Guidance",
      },

      to: [
        {
          email: to,
        },
      ],

      subject,

      htmlContent: html,
    });

    console.log(
      `✅ Email sent successfully to ${to}`
    );
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error?.response?.body ||
        error?.message ||
        error
    );

    throw new Error(
      "Email sending failed"
    );
  }
};

// =========================================================
// VERIFICATION / LOGIN OTP EMAIL
// =========================================================

export const sendVerificationEmail = async (
  email,
  otp
) => {
  const safeOtp = escapeHtml(otp);

  const subject =
    "GuidEd Verification Code";

  const html = createEmailTemplate({
    preheader:
      "Your GuidEd verification code is ready.",
    title:
      "Verify Your Account",
    subtitle:
      "Use the verification code below to continue signing in to your GuidEd account.",

    content: `

      <p
        style="
          margin: 0 0 18px;
          font-size: 15px;
          line-height: 1.7;
          color: ${BRAND.text};
        "
      >
        Please enter the following verification code
        in the GuidEd application:
      </p>

      <!-- OTP -->

      <div
        style="
          text-align: center;
          margin: 26px 0;
        "
      >

        <div
          style="
            display: inline-block;
            padding: 18px 26px;
            background: ${BRAND.softGreen};
            border: 1px solid #cce8d7;
            border-radius: 10px;
          "
        >

          <div
            style="
              font-size: 30px;
              line-height: 1.2;
              font-weight: 700;
              letter-spacing: 7px;
              color: ${BRAND.primaryDark};
            "
          >
            ${safeOtp}
          </div>

        </div>

      </div>

      <div
        style="
          margin: 24px 0;
          padding: 15px 17px;
          background: ${BRAND.warning};
          border-left: 4px solid ${BRAND.warningBorder};
          border-radius: 6px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: #6b5b2a;
          "
        >
          <strong>Security notice:</strong>
          This verification code is time-sensitive.
          Do not share it with anyone.
        </p>

      </div>

      <p
        style="
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${BRAND.muted};
        "
      >
        If you did not request this verification code,
        you may safely disregard this message.
      </p>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};

// =========================================================
// PASSWORD RESET OTP EMAIL
// =========================================================

export const sendPasswordResetEmail = async (
  email,
  otp
) => {
  const safeOtp = escapeHtml(otp);

  const subject =
    "GuidEd Password Reset Code";

  const html = createEmailTemplate({
    preheader:
      "Use this code to reset your GuidEd password.",
    title:
      "Password Reset Request",
    subtitle:
      "A password reset request was initiated for your GuidEd account.",

    content: `

      <p
        style="
          margin: 0 0 18px;
          font-size: 15px;
          line-height: 1.7;
          color: ${BRAND.text};
        "
      >
        Enter the verification code below in GuidEd
        to continue with your password reset.
      </p>

      <!-- OTP -->

      <div
        style="
          text-align: center;
          margin: 26px 0;
        "
      >

        <div
          style="
            display: inline-block;
            padding: 18px 26px;
            background: ${BRAND.softGreen};
            border: 1px solid #cce8d7;
            border-radius: 10px;
          "
        >

          <div
            style="
              font-size: 30px;
              line-height: 1.2;
              font-weight: 700;
              letter-spacing: 7px;
              color: ${BRAND.primaryDark};
            "
          >
            ${safeOtp}
          </div>

        </div>

      </div>

      <div
        style="
          margin: 24px 0;
          padding: 16px 18px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: ${BRAND.text};
          "
        >
          <strong>Code validity:</strong>
          This verification code expires after
          <strong>10 minutes</strong>.
        </p>

      </div>

      <p
        style="
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${BRAND.muted};
        "
      >
        If you did not request a password reset,
        no further action is required.
        For your security, do not share this code
        with anyone.
      </p>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};

// =========================================================
// PASSWORD RESET SUCCESS
// =========================================================

export const sendResetSuccessEmail = async (
  email
) => {
  const subject =
    "GuidEd Password Updated Successfully";

  const html = createEmailTemplate({
    preheader:
      "Your GuidEd password has been successfully updated.",
    title:
      "Password Updated",
    subtitle:
      "Your GuidEd account password has been changed successfully.",

    content: `

      <div
        style="
          text-align: center;
          margin: 4px 0 28px;
        "
      >

        <div
          style="
            display: inline-block;
            width: 54px;
            height: 54px;
            line-height: 54px;
            border-radius: 50%;
            background: ${BRAND.softGreen};
            color: ${BRAND.primaryDark};
            font-size: 26px;
            font-weight: bold;
          "
        >
          ✓
        </div>

      </div>

      <p
        style="
          margin: 0 0 16px;
          font-size: 15px;
          line-height: 1.7;
          color: ${BRAND.text};
        "
      >
        Your password has been updated successfully.
        You can now sign in to GuidEd using your new
        password.
      </p>

      <div
        style="
          margin-top: 24px;
          padding: 15px 17px;
          background: ${BRAND.warning};
          border-left: 4px solid ${BRAND.warningBorder};
          border-radius: 6px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: #6b5b2a;
          "
        >
          <strong>Didn't make this change?</strong>
          Please contact your school administrator
          or guidance office immediately.
        </p>

      </div>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};

// =========================================================
// ADMIN / GUIDANCE NOTIFICATION EMAIL
// =========================================================

export const sendNotificationEmail = async ({
  to,
  subject,
  html,
}) => {
  await sendEmail(
    to,
    subject,
    html
  );
};

// =========================================================
// STUDENT ACCOUNT WELCOME EMAIL
// =========================================================

export const sendStudentWelcomeEmail = async ({
  email,
  firstName,
  studentId,
  password,
}) => {
  const safeFirstName =
    escapeHtml(firstName || "Student");

  const safeEmail =
    escapeHtml(email);

  const safeStudentId =
    escapeHtml(studentId);

  const safePassword =
    escapeHtml(password);

  const guidedUrl =
    process.env.GUIDED_URL;

  const subject =
    "Your GuidEd Student Account Has Been Created";

  const html = createEmailTemplate({
    preheader:
      "Your GuidEd student account has been created.",

    title:
      "Student Account Created",

    subtitle:
      `Your GuidEd account has been successfully created for ${SCHOOL_NAME}.`,

    content: `

      <p
        style="
          margin: 0 0 16px;
          font-size: 15px;
          line-height: 1.7;
          color: ${BRAND.text};
        "
      >
        Dear
        <strong>${safeFirstName}</strong>,
      </p>

      <p
        style="
          margin: 0 0 22px;
          font-size: 15px;
          line-height: 1.7;
          color: ${BRAND.text};
        "
      >
        Your student account for the
        <strong>${SYSTEM_DESCRIPTION}</strong>
        has been created by
        <strong>${SCHOOL_NAME}</strong>.
      </p>

      <!-- ACCOUNT DETAILS -->

      <div
        style="
          margin: 26px 0;
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            line-height: 1.4;
            color: ${BRAND.text};
          "
        >
          Account Information
        </h2>

        <!-- Student ID -->

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            margin-bottom: 12px;
          "
        >
          <tr>
            <td
              style="
                width: 42%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
                vertical-align: top;
              "
            >
              Student ID
            </td>

            <td
              class="credential-value"
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
                word-break: break-word;
              "
            >
              ${safeStudentId}
            </td>
          </tr>
        </table>

        <!-- Email -->

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            margin-bottom: 12px;
          "
        >
          <tr>
            <td
              style="
                width: 42%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
                vertical-align: top;
              "
            >
              Email Address
            </td>

            <td
              class="credential-value"
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
                word-break: break-word;
              "
            >
              ${safeEmail}
            </td>
          </tr>
        </table>

        <!-- Temporary Password -->

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >
          <tr>
            <td
              style="
                width: 42%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
                vertical-align: top;
              "
            >
              Temporary Password
            </td>

            <td
              class="credential-value"
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 700;
                color: ${BRAND.primaryDark};
                text-align: right;
                word-break: break-word;
              "
            >
              ${safePassword}
            </td>
          </tr>
        </table>

      </div>

      <!-- SECURITY NOTICE -->

      <div
        style="
          margin: 24px 0;
          padding: 16px 18px;
          background: ${BRAND.warning};
          border-left: 4px solid ${BRAND.warningBorder};
          border-radius: 6px;
        "
      >

        <p
          style="
            margin: 0 0 7px;
            font-size: 13px;
            font-weight: 700;
            color: #5f5124;
          "
        >
          Important Security Notice
        </p>

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: #6b5b2a;
          "
        >
          The password provided above is a temporary
          credential. For your account's security,
          please change your password after your
          first successful login.
        </p>

      </div>

      <!-- LOGIN BUTTON -->

      ${
        guidedUrl
          ? `
      <div
        style="
          text-align: center;
          margin: 30px 0 26px;
        "
      >

        <a
          href="${escapeHtml(guidedUrl)}"
          style="
            display: inline-block;
            padding: 13px 28px;
            background: ${BRAND.primary};
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
          "
        >
          Access GuidEd
        </a>

      </div>
      `
          : ""
      }

      <p
        style="
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${BRAND.muted};
        "
      >
        If you experience any difficulty accessing your
        account, please contact the appropriate school
        administrator or guidance personnel.
      </p>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};
// =========================================================
// INCIDENT NOTIFICATION EMAIL
// =========================================================

export const sendIncidentNotificationEmail = async ({
  email,
  studentName,
  incidentCategory,
  incidentDate,
  incidentLocation,
  incidentDescription,
  status = "Received",
}) => {
  const safeStudentName =
    escapeHtml(studentName || "Student");

  const safeCategory =
    escapeHtml(incidentCategory || "Disciplinary Incident");

  const safeDate =
    escapeHtml(incidentDate || "Not specified");

  const safeLocation =
    escapeHtml(incidentLocation || "Not specified");

  const safeDescription =
    escapeHtml(
      incidentDescription ||
        "An incident report has been recorded in the GuidEd system."
    );

  const safeStatus =
    escapeHtml(status);

  const subject =
    "GuidEd Incident Notification";

  const html = createEmailTemplate({
    preheader:
      "A student incident has been recorded in the GuidEd system.",

    title:
      "Incident Notification",

    subtitle:
      "A student incident has been recorded and is currently being processed through the GuidEd guidance workflow.",

    content: `

      <!-- STATUS -->

      <div
        style="
          margin-bottom: 24px;
          padding: 13px 16px;
          background: ${BRAND.softGreen};
          border: 1px solid #cce8d7;
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            color: ${BRAND.primaryDark};
          "
        >
          <strong>Current Status:</strong>
          ${safeStatus}
        </p>

      </div>

      <!-- INCIDENT INFORMATION -->

      <div
        style="
          margin: 0 0 24px;
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            color: ${BRAND.text};
          "
        >
          Incident Information
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >

          <tr>
            <td
              style="
                width: 40%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Student
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeStudentName}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Incident Category
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeCategory}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Date
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeDate}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Location
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeLocation}
            </td>
          </tr>

        </table>

      </div>

      <!-- DESCRIPTION -->

      <div
        style="
          margin-bottom: 24px;
          padding: 18px;
          background: #ffffff;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Incident Description
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeDescription}
        </p>

      </div>

      <!-- NOTICE -->

      <div
        style="
          padding: 16px 18px;
          background: ${BRAND.warning};
          border-left: 4px solid ${BRAND.warningBorder};
          border-radius: 6px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: #6b5b2a;
          "
        >
          <strong>Guidance Notice:</strong>
          This notification is part of the school's
          student guidance and discipline monitoring
          process. Further action may be taken based
          on the school's established procedures.
        </p>

      </div>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};


// =========================================================
// REPORT ACCEPTED EMAIL
// =========================================================

export const sendReportAcceptedEmail = async ({
  email,
  studentName,
  reportCategory,
  reportDate,
  reportId,
  remarks,
}) => {
  const safeStudentName =
    escapeHtml(studentName || "Student");

  const safeCategory =
    escapeHtml(reportCategory || "Incident Report");

  const safeDate =
    escapeHtml(reportDate || "Not specified");

  const safeReportId =
    escapeHtml(reportId || "Not available");

  const safeRemarks =
    escapeHtml(
      remarks ||
        "The submitted report has been accepted for further review."
    );

  const subject =
    "GuidEd Report Accepted";

  const html = createEmailTemplate({
    preheader:
      "Your submitted incident report has been accepted for review.",

    title:
      "Report Accepted",

    subtitle:
      "Your submitted report has been reviewed and accepted for further processing.",

    content: `

      <!-- SUCCESS STATUS -->

      <div
        style="
          text-align: center;
          margin: 4px 0 28px;
        "
      >

        <div
          style="
            display: inline-block;
            width: 56px;
            height: 56px;
            line-height: 56px;
            border-radius: 50%;
            background: ${BRAND.softGreen};
            color: ${BRAND.primaryDark};
            font-size: 27px;
            font-weight: 700;
          "
        >
          ✓
        </div>

      </div>

      <div
        style="
          margin-bottom: 24px;
          padding: 15px 17px;
          background: ${BRAND.softGreen};
          border: 1px solid #cce8d7;
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: ${BRAND.primaryDark};
          "
        >
          <strong>Status:</strong>
          Accepted for Review
        </p>

      </div>

      <!-- REPORT INFORMATION -->

      <div
        style="
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            color: ${BRAND.text};
          "
        >
          Report Information
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >

          <tr>
            <td
              style="
                width: 40%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Report ID
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
                word-break: break-word;
              "
            >
              ${safeReportId}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Student
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeStudentName}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Category
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeCategory}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Date Submitted
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeDate}
            </td>
          </tr>

        </table>

      </div>

      <!-- REMARKS -->

      <div
        style="
          margin-top: 24px;
          padding: 18px;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Guidance Remarks
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeRemarks}
        </p>

      </div>

      <p
        style="
          margin: 24px 0 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${BRAND.muted};
        "
      >
        The report will proceed through the appropriate
        review and guidance process. You may receive
        additional notifications as its status changes.
      </p>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};


// =========================================================
// REPORT REJECTED EMAIL
// =========================================================

export const sendReportRejectedEmail = async ({
  email,
  studentName,
  reportCategory,
  reportDate,
  reportId,
  reason,
}) => {
  const safeStudentName =
    escapeHtml(studentName || "Student");

  const safeCategory =
    escapeHtml(reportCategory || "Incident Report");

  const safeDate =
    escapeHtml(reportDate || "Not specified");

  const safeReportId =
    escapeHtml(reportId || "Not available");

  const safeReason =
    escapeHtml(
      reason ||
        "The submitted report was not accepted for further processing."
    );

  const subject =
    "GuidEd Report Update";

  const html = createEmailTemplate({
    preheader:
      "There has been an update regarding your submitted report.",

    title:
      "Report Update",

    subtitle:
      "Your submitted report has been reviewed by the appropriate personnel.",

    content: `

      <!-- STATUS -->

      <div
        style="
          margin-bottom: 24px;
          padding: 15px 17px;
          background: #f8f9fa;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: ${BRAND.text};
          "
        >
          <strong>Status:</strong>
          Not Accepted
        </p>

      </div>

      <!-- REPORT INFORMATION -->

      <div
        style="
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            color: ${BRAND.text};
          "
        >
          Report Information
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >

          <tr>
            <td
              style="
                width: 40%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Report ID
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeReportId}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Student
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeStudentName}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Category
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeCategory}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Date Submitted
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeDate}
            </td>
          </tr>

        </table>

      </div>

      <!-- REASON -->

      <div
        style="
          margin-top: 24px;
          padding: 18px;
          background: #ffffff;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Review Remarks
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeReason}
        </p>

      </div>

      <p
        style="
          margin: 24px 0 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${BRAND.muted};
        "
      >
        If you believe this decision requires clarification,
        please contact the appropriate school guidance
        personnel.
      </p>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};


// =========================================================
// INTERVENTION CREATED / ASSIGNED EMAIL
// =========================================================

export const sendInterventionEmail = async ({
  email,
  studentName,
  interventionType,
  scheduledDate,
  assignedPersonnel,
  description,
  status = "Ready for Intervention",
}) => {
  const safeStudentName =
    escapeHtml(studentName || "Student");

  const safeType =
    escapeHtml(
      interventionType || "Guidance Intervention"
    );

  const safeDate =
    escapeHtml(
      scheduledDate || "To be scheduled"
    );

  const safePersonnel =
    escapeHtml(
      assignedPersonnel || "Guidance Personnel"
    );

  const safeDescription =
    escapeHtml(
      description ||
        "A guidance intervention has been prepared for the student."
    );

  const safeStatus =
    escapeHtml(status);

  const subject =
    "GuidEd Guidance Intervention Notice";

  const html = createEmailTemplate({
    preheader:
      "A guidance intervention has been prepared through GuidEd.",

    title:
      "Guidance Intervention",

    subtitle:
      "A guidance intervention has been recorded as part of the student support process.",

    content: `

      <!-- STATUS -->

      <div
        style="
          margin-bottom: 24px;
          padding: 15px 17px;
          background: ${BRAND.softGreen};
          border: 1px solid #cce8d7;
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            color: ${BRAND.primaryDark};
          "
        >
          <strong>Current Status:</strong>
          ${safeStatus}
        </p>

      </div>

      <!-- INTERVENTION DETAILS -->

      <div
        style="
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            color: ${BRAND.text};
          "
        >
          Intervention Details
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >

          <tr>
            <td
              style="
                width: 42%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Student
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeStudentName}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Intervention Type
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeType}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Scheduled Date
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeDate}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Assigned Personnel
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safePersonnel}
            </td>
          </tr>

        </table>

      </div>

      <!-- DESCRIPTION -->

      <div
        style="
          margin-top: 24px;
          padding: 18px;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Intervention Details
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeDescription}
        </p>

      </div>

      <!-- GUIDANCE NOTICE -->

      <div
        style="
          margin-top: 24px;
          padding: 16px 18px;
          background: ${BRAND.warning};
          border-left: 4px solid ${BRAND.warningBorder};
          border-radius: 6px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: #6b5b2a;
          "
        >
          <strong>Guidance Notice:</strong>
          This intervention is part of the school's
          student support and guidance process.
          Please follow the instructions provided by
          the assigned guidance personnel.
        </p>

      </div>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};


// =========================================================
// INTERVENTION COMPLETED EMAIL
// =========================================================

export const sendInterventionCompletedEmail = async ({
  email,
  studentName,
  interventionType,
  completedDate,
  outcome,
  remarks,
}) => {
  const safeStudentName =
    escapeHtml(studentName || "Student");

  const safeType =
    escapeHtml(
      interventionType || "Guidance Intervention"
    );

  const safeDate =
    escapeHtml(
      completedDate || "Not specified"
    );

  const safeOutcome =
    escapeHtml(
      outcome || "Intervention completed."
    );

  const safeRemarks =
    escapeHtml(
      remarks ||
        "The intervention has been completed and recorded in GuidEd."
    );

  const subject =
    "GuidEd Intervention Completed";

  const html = createEmailTemplate({
    preheader:
      "A GuidEd guidance intervention has been completed.",

    title:
      "Intervention Completed",

    subtitle:
      "The assigned guidance intervention has been completed and recorded in the GuidEd system.",

    content: `

      <!-- COMPLETED ICON -->

      <div
        style="
          text-align: center;
          margin: 4px 0 28px;
        "
      >

        <div
          style="
            display: inline-block;
            width: 56px;
            height: 56px;
            line-height: 56px;
            border-radius: 50%;
            background: ${BRAND.softGreen};
            color: ${BRAND.primaryDark};
            font-size: 27px;
            font-weight: 700;
          "
        >
          ✓
        </div>

      </div>

      <!-- STATUS -->

      <div
        style="
          margin-bottom: 24px;
          padding: 15px 17px;
          background: ${BRAND.softGreen};
          border: 1px solid #cce8d7;
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 13px;
            color: ${BRAND.primaryDark};
          "
        >
          <strong>Status:</strong>
          Completed
        </p>

      </div>

      <!-- DETAILS -->

      <div
        style="
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <h2
          style="
            margin: 0 0 18px;
            font-size: 16px;
            color: ${BRAND.text};
          "
        >
          Intervention Summary
        </h2>

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >

          <tr>
            <td
              style="
                width: 42%;
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Student
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeStudentName}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Intervention Type
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeType}
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 8px 0;
                font-size: 13px;
                color: ${BRAND.muted};
              "
            >
              Completion Date
            </td>

            <td
              style="
                padding: 8px 0;
                font-size: 14px;
                font-weight: 600;
                color: ${BRAND.text};
                text-align: right;
              "
            >
              ${safeDate}
            </td>
          </tr>

        </table>

      </div>

      <!-- OUTCOME -->

      <div
        style="
          margin-top: 24px;
          padding: 18px;
          border: 1px solid ${BRAND.border};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Outcome
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeOutcome}
        </p>

      </div>

      <!-- REMARKS -->

      <div
        style="
          margin-top: 16px;
          padding: 18px;
          background: ${BRAND.softGray};
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 700;
            color: ${BRAND.text};
          "
        >
          Guidance Remarks
        </p>

        <p
          style="
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: ${BRAND.muted};
          "
        >
          ${safeRemarks}
        </p>

      </div>

    `,
  });

  await sendEmail(
    email,
    subject,
    html
  );
};


// =========================================================
// ADMIN / GUIDANCE GENERAL NOTIFICATION
// =========================================================

export const sendAdminNotificationEmail = async ({
  email,
  subject,
  title,
  subtitle,
  message,
  notificationType,
  actionUrl,
  actionLabel = "Open GuidEd",
}) => {
  const safeTitle =
    escapeHtml(
      title || "GuidEd System Notification"
    );

  const safeSubtitle =
    escapeHtml(
      subtitle ||
        "You have received a new notification from the GuidEd system."
    );

  const safeMessage =
    escapeHtml(
      message ||
        "Please sign in to GuidEd to review this notification."
    );

  const safeType =
    escapeHtml(
      notificationType || "System Notification"
    );

  const safeActionLabel =
    escapeHtml(actionLabel);

  const safeActionUrl =
    actionUrl
      ? escapeHtml(actionUrl)
      : null;

  const finalSubject =
    subject ||
    "GuidEd System Notification";

  const html = createEmailTemplate({
    preheader:
      safeSubtitle,

    title:
      safeTitle,

    subtitle:
      safeSubtitle,

    content: `

      <!-- NOTIFICATION TYPE -->

      <div
        style="
          margin-bottom: 24px;
          padding: 12px 15px;
          background: ${BRAND.softGreen};
          border: 1px solid #cce8d7;
          border-radius: 8px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 12px;
            font-weight: 700;
            color: ${BRAND.primaryDark};
            text-transform: uppercase;
            letter-spacing: 0.4px;
          "
        >
          ${safeType}
        </p>

      </div>

      <!-- MESSAGE -->

      <div
        style="
          padding: 22px;
          background: ${BRAND.softGray};
          border: 1px solid ${BRAND.border};
          border-radius: 10px;
        "
      >

        <p
          style="
            margin: 0;
            font-size: 15px;
            line-height: 1.8;
            color: ${BRAND.text};
          "
        >
          ${safeMessage}
        </p>

      </div>

      ${
        safeActionUrl
          ? `
      <!-- ACTION -->

      <div
        style="
          text-align: center;
          margin: 30px 0 10px;
        "
      >

        <a
          href="${safeActionUrl}"
          style="
            display: inline-block;
            padding: 13px 28px;
            background: ${BRAND.primary};
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
          "
        >
          ${safeActionLabel}
        </a>

      </div>
      `
          : ""
      }

    `,
  });

  await sendEmail(
    email,
    finalSubject,
    html
  );
};