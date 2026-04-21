import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Vault 1 - Reset your password",
    html: `
        <p>You requested a password reset for your Vault 1 account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
        `,
  });
}
