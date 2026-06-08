import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = "ReplyPilot <onboarding@resend.dev>";

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function ratingColor(rating: number) {
  if (rating >= 4) return "#16a34a";
  if (rating === 3) return "#d97706";
  return "#dc2626";
}

export async function sendNewReviewEmail({
  toEmail,
  reviewerName,
  rating,
  reviewText,
  suggestedReply,
  businessName,
  reviewDocId,
}: {
  toEmail: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  suggestedReply: string;
  businessName: string;
  reviewDocId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sentiment = rating >= 4 ? "5-star" : rating === 3 ? "3-star" : "negative";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#7c3aed;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                <span style="color:white;font-size:18px;font-weight:bold;line-height:36px;">⚡</span>
              </td>
              <td style="padding-left:10px;">
                <span style="font-size:17px;font-weight:800;color:#0f0a1e;letter-spacing:-0.3px;">ReplyPilot</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;border:1px solid #e5e7eb;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:500;">New review for <strong style="color:#111827;">${businessName}</strong></p>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#111827;">
            ${sentiment === "5-star" ? "🎉 New 5-star review!" : sentiment === "3-star" ? "📝 New 3-star review" : "⚠️ Negative review needs attention"}
          </h1>

          <!-- Review -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr><td style="background:#f9fafb;border-radius:14px;padding:20px;border:1px solid #f3f4f6;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-block;text-align:center;line-height:36px;color:white;font-weight:700;font-size:14px;">
                      ${reviewerName.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${reviewerName}</p>
                    <p style="margin:0;font-size:16px;color:${ratingColor(rating)};">${stars(rating)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:14px;color:#374151;line-height:1.6;">"${reviewText}"</p>
            </td></tr>
          </table>

          <!-- Suggested reply -->
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;">Suggested reply</p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr><td style="background:#f5f3ff;border-radius:14px;padding:18px;border:1px solid #ede9fe;">
              <p style="margin:0;font-size:14px;color:#4c1d95;line-height:1.6;">${suggestedReply}</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-right:8px;">
                <a href="${appUrl}/dashboard" style="display:block;background:#7c3aed;color:white;text-align:center;padding:14px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
                  Review &amp; Post Reply
                </a>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            ReplyPilot · You're receiving this because a new review needs your attention.<br>
            <a href="${appUrl}/settings" style="color:#7c3aed;text-decoration:none;">Manage notification settings</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${stars(rating)} New ${rating}-star review from ${reviewerName} — ${businessName}`,
    html,
  });
}
