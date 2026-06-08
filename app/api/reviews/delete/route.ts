import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { reviewDocId, userId } = await req.json();

  if (!reviewDocId || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection("reviews").doc(reviewDocId).get();

  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (snap.data()!.userId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  await db.collection("reviews").doc(reviewDocId).delete();

  return NextResponse.json({ success: true });
}
