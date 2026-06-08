import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { fetchNewReviews } from "@/lib/google-business";
import { generateReviewReply } from "@/lib/claude";
import { sendNewReviewEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  // Get all users who have a connected Google account
  const settingsSnap = await db.collection("settings")
    .where("googleAccessToken", "!=", null)
    .get();

  let totalStored = 0;

  for (const settingDoc of settingsSnap.docs) {
    const userId = settingDoc.id;
    const settings = settingDoc.data();
    const { googleAccessToken, locations, businessName, contactEmail, tone, language, templates } = settings;

    if (!googleAccessToken || !locations?.length) continue;

    for (const locationName of locations) {
      try {
        const existing = await db.collection("reviews")
          .where("userId", "==", userId)
          .where("locationName", "==", locationName)
          .limit(50)
          .get();

        const dates = existing.docs.map((d) => d.data().createdAt as string).sort();
        const since = dates.length > 0
          ? dates[dates.length - 1]
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const reviews = await fetchNewReviews(googleAccessToken, locationName, since);

        for (const review of reviews) {
          const rating =
            review.starRating === "FIVE" ? 5
            : review.starRating === "FOUR" ? 4
            : review.starRating === "THREE" ? 3
            : review.starRating === "TWO" ? 2 : 1;

          const template = rating >= 4 ? templates?.positive
            : rating === 3 ? templates?.neutral
            : templates?.negative;

          const reviewerName = review.reviewer?.displayName || "Anonymous";
          const reviewText = review.comment || "";

          let suggestedReply = `${reviewerName}, thank you for your feedback. — ${businessName || "Us"}`;
          try {
            suggestedReply = await generateReviewReply(reviewText, reviewerName, rating, businessName || "Us", {
              tone: tone ?? 3,
              language: language ?? "auto",
              template,
              contactEmail,
            });
          } catch { /* use fallback */ }

          const ref = await db.collection("reviews").add({
            userId,
            locationName,
            businessName: businessName || "",
            reviewId: review.reviewId,
            reviewerName,
            rating,
            reviewText,
            suggestedReply,
            status: "pending",
            createdAt: review.updateTime,
          });

          totalStored++;

          if (contactEmail) {
            try {
              await sendNewReviewEmail({
                toEmail: contactEmail,
                reviewerName,
                rating,
                reviewText,
                suggestedReply,
                businessName: businessName || "",
                reviewDocId: ref.id,
              });
            } catch { /* non-fatal */ }
          }
        }
      } catch { /* skip this location, continue */ }
    }
  }

  return NextResponse.json({ ok: true, stored: totalStored });
}
