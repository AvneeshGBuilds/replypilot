import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { postReply } from "@/lib/google-business";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { reviewDocId, replyText } = await req.json();

  if (!reviewDocId || !replyText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getAdminDb();

  const reviewSnap = await db.collection("reviews").doc(reviewDocId).get();
  if (!reviewSnap.exists) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const review = reviewSnap.data()!;

  // Skip actual Google posting for test reviews
  if (!review.reviewId.startsWith("test-")) {
    const userSnap = await db.collection("users").doc(review.userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { accessToken } = userSnap.data()!;
    await postReply(accessToken, review.locationName, review.reviewId, replyText);
  }

  await db.collection("reviews").doc(reviewDocId).update({
    status: "posted",
    postedReply: replyText,
    postedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
