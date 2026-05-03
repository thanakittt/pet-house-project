import nodemailer from "nodemailer";

const gmailUser = process.env.GOOGLE_APP_USER;
const gmailPassword = process.env.GOOGLE_APP_PASSWORD;

const createTransporter = () => {
  if (!gmailUser || !gmailPassword) {
    throw new Error("Email service is not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
};

type VerificationEmailOptions = {
  to: string;
  url: string;
  type?: "email-verification" | "change-email";
};

export const sendVerificationEmail = async ({
  to,
  url,
  type = "email-verification",
}: VerificationEmailOptions) => {
  const transporter = createTransporter();
  const isEmailChange = type === "change-email";
  const subject = isEmailChange
    ? "Confirm your new email"
    : "Verify your email";
  const text = isEmailChange
    ? `Click this link to confirm your new email: ${url}`
    : `Click this link to verify your email: ${url}`;
  const html = isEmailChange
    ? `<p>Click this link to confirm your new email: <a href="${url}">Confirm Email</a></p>`
    : `<p>Click this link to verify your email: <a href="${url}">Verify Email</a></p>`;

  try {
    await transporter.sendMail({
      from: gmailUser,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw new Error("Failed to send verification email");
  }
};
