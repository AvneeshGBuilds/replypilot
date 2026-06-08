"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Onboarding from "./Onboarding";

type Review = {
  id: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  suggestedReply: string;
  status: "pending" | "approved" | "posted" | "edited";
  locationName: string;
  reviewId: string;
  createdAt: string;
  businessName: string;
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function ratingColor(rating: number) {
  if (rating >= 4) return { badge: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-400" };
  if (rating === 3) return { badge: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-400" };
  return { badge: "text-rose-700 bg-rose-50 border-rose-200", bar: "bg-rose-400" };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [posting, setPosting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [autoPost, setAutoPost] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [addingTest, setAddingTest] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "settings", user.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAutoPost(d.autoPost ?? false);
        setBusinessName(d.businessName || "");
        if (!d.onboardingComplete) setShowOnboarding(true);
      } else {
        setShowOnboarding(true);
      }
      setSettingsLoaded(true);
    });

    const q = query(collection(db, "reviews"), where("userId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(data);
    });
  }, [user]);

  function handleOnboardingComplete(biz: string, _email: string, _tone: number) {
    setBusinessName(biz);
    setShowOnboarding(false);
  }

  async function toggleAutoPost() {
    if (!user) return;
    setSavingToggle(true);
    const val = !autoPost;
    setAutoPost(val);
    await setDoc(doc(db, "settings", user.uid), { autoPost: val }, { merge: true });
    setSavingToggle(false);
  }

  async function backfillReviews() {
    if (!user) return;
    setBackfilling(true);
    await fetch("/api/reviews/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid }),
    });
    setBackfilling(false);
  }

  async function addTestReview() {
    if (!user) return;
    setAddingTest(true);
    await fetch("/api/reviews/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid }),
    });
    setAddingTest(false);
  }

  async function approveAndPost(review: Review) {
    setPosting(review.id);
    try {
      const res = await fetch("/api/reviews/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewDocId: review.id,
          replyText: editingId === review.id ? editText : review.suggestedReply,
        }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      alert("Failed to post reply. Please try again.");
    }
    setPosting(null);
    setEditingId(null);
  }

  async function deleteReview(reviewId: string) {
    if (!user) return;
    setDeleting(reviewId);
    await fetch("/api/reviews/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewDocId: reviewId, userId: user.uid }),
    });
    setDeleting(null);
  }

  async function saveEdit(reviewId: string) {
    await updateDoc(doc(db, "reviews", reviewId), { suggestedReply: editText, status: "edited" });
    setEditingId(null);
  }

  const pending = reviews.filter((r) => r.status === "pending" || r.status === "edited");
  const posted = reviews.filter((r) => r.status === "posted");
  const responseRate = reviews.length > 0 ? Math.round((posted.length / reviews.length) * 100) : 0;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {showOnboarding && settingsLoaded && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-[#f5f5f8]">
        {/* Nav */}
        <nav className="bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 tracking-tight">ReplyPilot</span>
            {businessName && (
              <>
                <span className="text-gray-200">/</span>
                <span className="text-sm text-gray-400 font-medium">{businessName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <a href="/settings" className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
            <button onClick={() => auth.signOut()} className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition font-medium">
              Sign out
            </button>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Stats */}
          <AnimatePresence>
            {reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3 mb-5"
              >
                <StatCard label="Total reviews" value={String(reviews.length)} color="violet" />
                <StatCard label="Response rate" value={`${responseRate}%`} color={responseRate === 100 ? "emerald" : "violet"} />
                <StatCard label="Avg rating" value={avgRating} color="amber" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cron info banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4"
          >
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-600 font-medium">New Google reviews are checked every hour and replied to automatically.</p>
          </motion.div>

          {/* Auto-post toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${autoPost ? "bg-violet-100" : "bg-gray-100"}`}>
                <svg className={`w-4 h-4 transition-colors ${autoPost ? "text-violet-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Auto-post replies</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {autoPost ? "Replies go live on Google automatically" : "You approve each reply before it posts"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleAutoPost}
              disabled={savingToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${autoPost ? "bg-violet-600" : "bg-gray-200"} disabled:opacity-50`}
            >
              <motion.span
                layout
                className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: autoPost ? 24 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </motion.div>

          {/* Generating skeleton */}
          <AnimatePresence>
            {addingTest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5 mb-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-28 bg-gray-100 rounded-full animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-3 w-4/5 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="bg-violet-50 rounded-xl p-4 space-y-2">
                  <div className="h-3 w-24 bg-violet-200 rounded-full animate-pulse" />
                  <div className="h-3 w-full bg-violet-100 rounded-full animate-pulse" />
                  <div className="h-3 w-3/4 bg-violet-100 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                  <p className="text-xs text-violet-500 font-semibold">Generating AI reply…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          <AnimatePresence>
            {pending.length === 0 && posted.length === 0 && !addingTest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                >
                  <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </motion.div>
                <p className="font-bold text-gray-900 text-lg mb-1">No reviews yet</p>
                <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                  New Google reviews will appear here with AI replies ready to approve
                </p>
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={addTestReview}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-6 py-2.5 rounded-xl font-semibold shadow-sm shadow-violet-200"
                  >
                    Try a test review
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={backfillReviews}
                    disabled={backfilling}
                    className="text-xs text-violet-600 hover:text-violet-800 border border-violet-200 hover:border-violet-400 px-5 py-2 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    {backfilling ? "Fetching past reviews…" : "Reply to past unanswered reviews"}
                  </motion.button>
                  <a href="/settings" className="text-xs text-gray-400 hover:text-violet-600 transition font-medium">
                    Configure settings →
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending reviews */}
          {pending.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Needs approval</span>
                  <motion.span layout className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pending.length}
                  </motion.span>
                </div>
                {!addingTest && (
                  <button onClick={addTestReview} className="text-xs text-gray-400 hover:text-violet-600 transition font-medium">
                    + Test review
                  </button>
                )}
              </div>
              <AnimatePresence mode="popLayout">
                {pending.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    editingId={editingId}
                    editText={editText}
                    posting={posting}
                    deleting={deleting}
                    onEdit={() => { setEditingId(r.id); setEditText(r.suggestedReply); }}
                    onEditChange={setEditText}
                    onSaveEdit={() => saveEdit(r.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onApprove={() => approveAndPost(r)}
                    onDelete={() => deleteReview(r.id)}
                  />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* Posted reviews */}
          {posted.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Posted</span>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {posted.length}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {posted.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    editingId={null}
                    editText=""
                    posting={null}
                    deleting={deleting}
                    onEdit={() => {}}
                    onEditChange={() => {}}
                    onSaveEdit={() => {}}
                    onCancelEdit={() => {}}
                    onApprove={() => {}}
                    onDelete={() => deleteReview(r.id)}
                  />
                ))}
              </AnimatePresence>
            </section>
          )}

          <p className="text-center text-xs text-gray-300 mt-12 pb-4">
            <a href="/terms" className="hover:text-gray-500 transition">Terms</a>
            {" · "}
            <a href="/privacy" className="hover:text-gray-500 transition">Privacy</a>
            {" · "}
            <span>ReplyPilot © 2026</span>
          </p>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: "violet" | "emerald" | "amber" }) {
  const styles = {
    violet: { bg: "from-violet-50 to-white border-violet-100", text: "text-violet-700", sub: "text-violet-400" },
    emerald: { bg: "from-emerald-50 to-white border-emerald-100", text: "text-emerald-700", sub: "text-emerald-400" },
    amber: { bg: "from-amber-50 to-white border-amber-100", text: "text-amber-700", sub: "text-amber-400" },
  }[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-gradient-to-br ${styles.bg} rounded-2xl border shadow-sm p-4 cursor-default`}
    >
      <p className={`text-xs font-semibold mb-1 ${styles.sub}`}>{label}</p>
      <p className={`text-2xl font-black ${styles.text}`}>{value}</p>
    </motion.div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({
  review, editingId, editText, posting, deleting,
  onEdit, onEditChange, onSaveEdit, onCancelEdit, onApprove, onDelete,
}: {
  review: Review; editingId: string | null; editText: string;
  posting: string | null; deleting: string | null;
  onEdit: () => void; onEditChange: (v: string) => void;
  onSaveEdit: () => void; onCancelEdit: () => void;
  onApprove: () => void; onDelete: () => void;
}) {
  const isEditing = editingId === review.id;
  const isPosting = posting === review.id;
  const isDeleting = deleting === review.id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { badge, bar } = ratingColor(review.rating);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3"
    >
      {/* Color accent bar based on rating */}
      <div className={`h-1 w-full ${bar}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(review.reviewerName)}`}>
              {initials(review.reviewerName)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{review.reviewerName}</p>
              <StarRating rating={review.rating} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge}`}>
              {review.rating}★
            </span>
            {review.status === "posted" && (
              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-bold">
                Posted ✓
              </span>
            )}
          </div>
        </div>

        {/* Review text */}
        <p className="text-gray-500 text-sm leading-relaxed mb-4 bg-gray-50 rounded-xl px-4 py-3 italic">
          "{review.reviewText}"
        </p>

        {/* AI Reply */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-4 h-4 bg-violet-600 rounded-sm flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">AI reply</p>
          </div>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.textarea key="edit"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                value={editText} onChange={(e) => onEditChange(e.target.value)}
                className="w-full text-sm text-gray-700 bg-white border border-violet-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                rows={4}
              />
            ) : (
              <motion.p key="text"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm text-gray-700 leading-relaxed"
              >
                {review.suggestedReply}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center">
          {review.status !== "posted" && (
            isEditing ? (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={onSaveEdit}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg font-semibold transition">
                  Save
                </motion.button>
                <button onClick={onCancelEdit} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 transition">
                  Cancel
                </button>
              </>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={onEdit}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-lg font-semibold transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </motion.button>
            )
          )}

          {/* Delete */}
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              {confirmDelete ? (
                <motion.div key="confirm"
                  initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs text-gray-400">Remove?</span>
                  <button onClick={() => { onDelete(); setConfirmDelete(false); }} disabled={isDeleting}
                    className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-lg font-semibold transition disabled:opacity-50">
                    {isDeleting ? "…" : "Yes"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition">
                    No
                  </button>
                </motion.div>
              ) : (
                <motion.button key="delete" whileTap={{ scale: 0.9 }} onClick={() => setConfirmDelete(true)}
                  className="text-xs text-gray-300 hover:text-rose-400 p-2 rounded-lg transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {review.status !== "posted" && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onApprove} disabled={isPosting}
              className="ml-auto text-xs bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPosting ? (
                <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Posting…</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Approve & Post</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
