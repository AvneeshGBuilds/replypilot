import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { generateReviewReply, DEFAULT_TEMPLATES } from "@/lib/claude";
import { sendNewReviewEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const TEST_REVIEWS = [
  {
    reviewerName: "John Smith",
    rating: 5,
    reviewText: "Amazing service! The food was incredible and the staff were so friendly. Will definitely be coming back!",
    fallback: (biz: string, _contact: string) =>
      `John, hearing that the food and our team both hit the mark means a lot — those are the two things we care most about. Can't wait to have you back. — ${biz}`,
  },
  {
    reviewerName: "Sarah Johnson",
    rating: 2,
    reviewText: "Waited 45 minutes for our food and it arrived cold. Very disappointed with the experience.",
    fallback: (biz: string, contact: string) =>
      `Sarah, a 45-minute wait and cold food is genuinely unacceptable, and I'm sorry we let you down like that. Please reach out to us at ${contact} — I want to personally make this right. — ${biz}`,
  },
  {
    reviewerName: "Mike Chen",
    rating: 4,
    reviewText: "Great atmosphere and tasty food. Service was a bit slow but overall a good experience.",
    fallback: (biz: string, _contact: string) =>
      `Mike, really glad the atmosphere and food landed well — and noted on the service speed, we're actively working on it. Hope to give you a faster experience next time. — ${biz}`,
  },
  {
    reviewerName: "Lisa Park",
    rating: 5,
    reviewText: "Best brunch spot in the neighborhood. The avocado toast was perfect and the coffee was strong just how I like it.",
    fallback: (biz: string, _contact: string) =>
      `Lisa, strong coffee and good avocado toast — that's the whole mission right there. So glad it hit the spot. See you next weekend. — ${biz}`,
  },
  {
    reviewerName: "David Torres",
    rating: 1,
    reviewText: "Rude staff, wrong order, and took forever. Will not be coming back.",
    fallback: (biz: string, contact: string) =>
      `David, I'm really sorry — a wrong order, slow service, and rude staff all in one visit is inexcusable. Please reach out to us at ${contact} so I can understand exactly what happened. — ${biz}`,
  },
];

function buildFallbackReply(review: typeof TEST_REVIEWS[0], businessName: string, contactEmail: string): string {
  const biz = businessName || "us";
  const contact = contactEmail || "us directly";
  return review.fallback(biz, contact);
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const db = getAdminDb();

  // Load user settings
  const settingsSnap = await db.collection("settings").doc(userId).get();
  const settings = settingsSnap.exists ? settingsSnap.data()! : {};
  const businessName = settings.businessName || "My Business";
  const contactEmail = settings.contactEmail || "";
  const autoPost = settings.autoPost ?? false;

  const template = (rating: number) =>
    rating >= 4
      ? (settings.templates?.positive || DEFAULT_TEMPLATES.positive)
      : rating === 3
      ? (settings.templates?.neutral || DEFAULT_TEMPLATES.neutral)
      : (settings.templates?.negative || DEFAULT_TEMPLATES.negative);

  const review = TEST_REVIEWS[Math.floor(Math.random() * TEST_REVIEWS.length)];

  let suggestedReply = buildFallbackReply(review, businessName, contactEmail);
  try {
    suggestedReply = await generateReviewReply(
      review.reviewText,
      review.reviewerName,
      review.rating,
      businessName,
      {
        tone: settings.tone ?? 3,
        language: settings.language ?? "auto",
        template: template(review.rating),
        contactEmail,
      }
    );
  } catch {
    // Use fallback reply built from user's settings
  }

  const reviewId = `test-${Date.now()}`;
  const status = autoPost ? "posted" : "pending";

  const docRef = await db.collection("reviews").add({
    userId,
    locationName: "test-location",
    businessName,
    reviewId,
    reviewerName: review.reviewerName,
    rating: review.rating,
    reviewText: review.reviewText,
    suggestedReply,
    status,
    postedReply: autoPost ? suggestedReply : null,
    postedAt: autoPost ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  });

  // Email the user when a review needs their approval
  if (!autoPost && settings.contactEmail) {
    try {
      await sendNewReviewEmail({
        toEmail: settings.contactEmail,
        reviewerName: review.reviewerName,
        rating: review.rating,
        reviewText: review.reviewText,
        suggestedReply,
        businessName,
        reviewDocId: docRef.id,
      });
    } catch {
      // Non-fatal — review is saved, email is best-effort
    }
  }

  return NextResponse.json({ success: true, autoPosted: autoPost });
}
