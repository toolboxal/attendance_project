import { Resend } from "resend";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function buildOtpEmailHtml(otp: string, siteOrigin: string): string {
	const safeOtp = escapeHtml(otp);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Asistir verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="background-color:#09090b;padding:24px 32px;text-align:center;font-size:20px;font-weight:600;color:#fafafa;letter-spacing:-0.02em;">Asistir</td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#18181b;letter-spacing:-0.02em;">Your verification code</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#71717a;">Enter this code to sign in to your account. It expires in <strong style="color:#52525b;">5 minutes</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:10px;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#a1a1aa;">One-time code</p>
                    <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.28em;color:#18181b;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${safeOtp}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#a1a1aa;">If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;text-align:center;">
                <a href="${siteOrigin}" style="color:#71717a;text-decoration:none;font-weight:500;">asistir.online</a>
                &nbsp;&middot;&nbsp; Live event coordination
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendResendEmail(to: string, subject: string, html: string) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		console.error(
			"[Better Auth Error] Missing RESEND_API_KEY environment variable!",
		);
		throw new Error("Missing RESEND_API_KEY environment variable");
	}

	const resend = new Resend(apiKey);
	return await resend.emails.send({
		// from: "Asistir <onboarding@resend.dev>",
		from: "Asistir <contact@asistir.online>",
		to,
		subject,
		html,
	});
}
