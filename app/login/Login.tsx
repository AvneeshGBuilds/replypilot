"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  { icon: "⚡", text: "Replies in seconds" },
  { icon: "🌍", text: "12 languages" },
  { icon: "🎛️", text: "Custom tone & voice" },
  { icon: "✅", text: "You approve or auto-post" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left — hero */}
      <div className="hidden lg:flex flex-col w-[52%] bg-[#0f0a1e] relative overflow-hidden p-12">
        {/* Background glows */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
          className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[100px] pointer-events-none"
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center gap-2.5 relative z-10"
        >
          <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">ReplyPilot</span>
        </motion.div>

        {/* Main copy */}
        <div className="mt-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-6"
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/70 text-xs font-medium">AI-powered review management</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5"
          >
            Never lose a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              customer
            </span>{" "}to an<br />
            unanswered review.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-white/50 text-lg mb-10 leading-relaxed max-w-sm"
          >
            ReplyPilot watches your Google reviews 24/7 and replies in your voice — automatically.
          </motion.p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.45 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-3"
              >
                <span className="text-base">{f.icon}</span>
                <span className="text-white/70 text-xs font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              "We went from responding to 20% of our reviews to 100%. Our Google ranking jumped within a month."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
              <div>
                <p className="text-white text-xs font-semibold">Maria R.</p>
                <p className="text-white/40 text-xs">Owner, Casa Maria Restaurant</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — sign in */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-[#f5f5f8]">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-gray-900">ReplyPilot</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Get started</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to manage your review replies</p>

          {/* Pricing pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-6"
          >
            <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-violet-700 font-medium">Free to try · $29/mo when you're ready · Cancel anytime</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-6 py-4 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? "Signing in..." : "Continue with Google"}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 overflow-hidden"
              >
                <p className="text-red-600 text-xs">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mt-6 text-xs text-gray-400 text-center leading-relaxed"
          >
            By signing in you agree to our{" "}
            <a href="/terms" className="text-violet-600 hover:underline font-medium">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-violet-600 hover:underline font-medium">Privacy Policy</a>
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
