import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

function getTemplate(title: string, body: string, buttonText?: string, buttonUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F0F4FF;">
      <div style="max-width:560px;margin:0 auto;padding:24px;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1E3A5F,#3B82F6);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <span style="font-size:24px;">📍</span>
          </div>
          <h1 style="color:#fff;font-size:22px;margin:0;">RWATRACK</h1>
          <p style="color:#CADCFC;font-size:12px;margin:4px 0 0;">AI-Driven Workforce Management</p>
        </div>

        <!-- Body -->
        <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h2 style="color:#1E293B;font-size:18px;margin:0 0 16px;">${title}</h2>
          <div style="color:#475569;font-size:14px;line-height:1.7;">${body}</div>
          ${buttonText && buttonUrl ? `
            <div style="text-align:center;margin-top:24px;">
              <a href="${buttonUrl}" style="display:inline-block;background:#3B82F6;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${buttonText}</a>
            </div>
          ` : ""}
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:24px;color:#94A3B8;font-size:11px;">
          <p>RWATRACK — University of Rwanda • School of ICT</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendEmail(to: string, subject: string, title: string, body: string, buttonText?: string, buttonUrl?: string) {
  // Skip if email credentials not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL SKIP] No credentials. Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"RWATRACK" <${process.env.EMAIL_USER}>`,
      to,
      subject: `RWATRACK — ${subject}`,
      html: getTemplate(title, body, buttonText, buttonUrl),
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] To: ${to}`, error);
    return false;
  }
}

// Pre-built email templates
export async function sendApprovalEmail(to: string, name: string, role: string) {
  return sendEmail(
    to,
    "Account Approved",
    "Your Account Has Been Approved! ✅",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Great news! Your <strong>${role}</strong> account on RWATRACK has been approved. You can now log in and start using the platform.</p>
     <p>If you're a worker, download the mobile app to start sharing your GPS location. If you're an HR manager, log in to the web dashboard to manage your team.</p>`,
    "Login to RWATRACK",
    process.env.NEXT_PUBLIC_APP_URL || "https://rwatrack.vercel.app"
  );
}

export async function sendRejectionEmail(to: string, name: string) {
  return sendEmail(
    to,
    "Account Not Approved",
    "Account Registration Update",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We regret to inform you that your RWATRACK account registration was not approved at this time.</p>
     <p>If you believe this was a mistake, please contact your HR manager or system administrator for more information.</p>`
  );
}

export async function sendRegistrationEmail(to: string, name: string, role: string) {
  return sendEmail(
    to,
    "Registration Successful",
    "Welcome to RWATRACK! 🎉",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Thank you for registering as a <strong>${role}</strong> on RWATRACK.</p>
     <p>Your account is currently <strong>pending approval</strong>. ${role === "WORKER" ? "Your HR manager" : "An administrator"} will review your registration and approve it shortly.</p>
     <p>You will receive another email once your account has been approved.</p>`,
    "Visit RWATRACK",
    process.env.NEXT_PUBLIC_APP_URL || "https://rwatrack.vercel.app"
  );
}

export async function sendProfileChangeEmail(to: string, supervisorName: string, workerName: string, changes: string) {
  return sendEmail(
    to,
    "Profile Change Notification",
    "Worker Profile Updated",
    `<p>Hi <strong>${supervisorName}</strong>,</p>
     <p>Worker <strong>${workerName}</strong> has made the following changes to their profile:</p>
     <div style="background:#F0F4FF;padding:12px;border-radius:8px;margin:12px 0;border-left:4px solid #3B82F6;">
       <p style="margin:0;font-size:13px;">${changes.replace(/\|/g, "<br/>")}</p>
     </div>
     <p>Please review these changes in your dashboard.</p>`,
    "Open Dashboard",
    process.env.NEXT_PUBLIC_APP_URL || "https://rwatrack.vercel.app"
  );
}

export async function sendSupportResponseEmail(to: string, name: string, subject: string, response: string) {
  return sendEmail(
    to,
    "Support Response",
    `Response to: ${subject}`,
    `<p>Hi <strong>${name}</strong>,</p>
     <p>An administrator has responded to your support request:</p>
     <div style="background:#F0FDF4;padding:12px;border-radius:8px;margin:12px 0;border-left:4px solid #22C55E;">
       <p style="margin:0;font-size:13px;">${response}</p>
     </div>`,
    "View Full Response",
    process.env.NEXT_PUBLIC_APP_URL || "https://rwatrack.vercel.app/support"
  );
}
