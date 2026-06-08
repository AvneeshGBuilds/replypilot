import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { fetchUnansweredReviews } from "@/lib/google-business";
import { generateReviewReply, DEFAULT_TEMPLATES } from "@/lib/claude";
import { sendNewReviewEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const db = getAdminDb();
  const settingsSnap = await db.collection("settings").doc(userId).get();
  if (!settingsSnap.exists) return NextResponse.json({ error: "No settings" }, { status: 404 });

  const settings = settingsSnap.data()!;
  const { googleAccessToken, locations, businessName, contactEmail, tone, language, templates } = settings;

  if (!googleAccessToken || !locations?.length) {
    return NextResponse.json({ error: "No Google account connected" }, { status: 400 });
  }

  // Get already-saved reviewIds so we don't duplicate
  const existingSnap = await db.collection("reviews").where("userId", "==", userId).get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.data().reviewId));

  let totalStored = 0;

  for (const locationName of locations) {
    const reviews = await fetchUnansweredReviews(googleAccessToken, locationName);

    for (const review of reviews as Record<string, unknown>[]) {
      if (existingIds.has(review.reviewId)) continue;

      const rating =
        review.starRating === "FIVE" ? 5
        : review.starRating === "FOUR" ? 4
        : review.starRating === "THREE" ? 3
        : review.starRating === "TWO" ? 2 : 1;

      const template = rating >= 4
        ? (templates?.positive || DEFAULT_TEMPLATES.positive)
        : rating === 3
        ? (templates?.neutral || DEFAULT_TEMPLATES.neutral)
        : (templates?.negative || DEFAULT_TEMPLATES.negative);

      const reviewerName = (review.reviewer as Record<string, string>)?.displayName || "Anonymous";
      const reviewText = (review.comment as string) || "";

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
  }

  return NextResponse.json({ success: true, stored: totalStored });
}
