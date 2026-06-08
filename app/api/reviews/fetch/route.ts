import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { fetchNewReviews } from "@/lib/google-business";
import { generateReviewReply } from "@/lib/claude";
import { sendNewReviewEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId, accessToken, locationName, businessName } = await req.json();

  if (!userId || !accessToken || !locationName || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getAdminDb();

  const existing = await db
    .collection("reviews")
    .where("userId", "==", userId)
    .where("locationName", "==", locationName)
    .limit(50)
    .get();

  const dates = existing.docs.map((d) => d.data().createdAt as string).sort();
  const since = dates.length > 0
    ? dates[dates.length - 1]
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Load user settings for tone, language, templates
  const settingsSnap = await db.collection("settings").doc(userId).get();
  const userSettings = settingsSnap.exists ? settingsSnap.data()! : {};

  const reviews = await fetchNewReviews(accessToken, locationName, since);

  const stored = [];
  for (const review of reviews) {
    const rating =
      review.starRating === "FIVE" ? 5
      : review.starRating === "FOUR" ? 4
      : review.starRating === "THREE" ? 3
      : review.starRating === "TWO" ? 2
      : 1;

    const template = rating >= 4
      ? userSettings.templates?.positive
      : rating === 3
      ? userSettings.templates?.neutral
      : userSettings.templates?.negative;

    const suggestedReply = await generateReviewReply(
      review.comment || "(no text)",
      review.reviewer?.displayName || "A customer",
      rating,
      businessName,
      {
        tone: userSettings.tone ?? 3,
        language: userSettings.language ?? "auto",
        template,
        contactEmail: userSettings.contactEmail,
      }
    );

    const reviewerName = review.reviewer?.displayName || "Anonymous";
    const reviewText = review.comment || "";

    const ref = await db.collection("reviews").add({
      userId,
      locationName,
      businessName,
      reviewId: review.reviewId,
      reviewerName,
      rating,
      reviewText,
      suggestedReply,
      status: "pending",
      createdAt: review.updateTime,
    });
    stored.push(ref.id);

    if (userSettings.contactEmail) {
      try {
        await sendNewReviewEmail({
          toEmail: userSettings.contactEmail,
          reviewerName,
          rating,
          reviewText,
          suggestedReply,
          businessName,
          reviewDocId: ref.id,
        });
      } catch {
        // Non-fatal
      }
    }
  }

  return NextResponse.json({ stored: stored.length });
}
