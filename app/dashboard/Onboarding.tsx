"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const TONE_LABELS = [
  { value: 1, label: "Very formal", desc: "Polished brand voice" },
  { value: 2, label: "Professional", desc: "Warm but polished" },
  { value: 3, label: "Friendly", desc: "Natural — the sweet spot" },
  { value: 4, label: "Casual", desc: "Relaxed and approachable" },
  { value: 5, label: "Personal", desc: "Barely sounds like AI" },
];

type Props = {
  onComplete: (businessName: string, contactEmail: string, tone: number) => void;
};

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tone, setTone] = useState(3);
  const [saving, setSaving] = useState(false);

  const steps = [
    "Welcome",
    "Your business",
    "Reply tone",
    "You're set",
  ];

  async function finish() {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "settings", user.uid), {
      businessName,
      contactEmail,
      tone,
      onboardingComplete: true,
    }, { merge: true });
    setSaving(false);
    onComplete(businessName, contactEmail, tone);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-1 bg-violet-600 rounded-full"
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        <div className="p-8">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-violet-600" : i < step ? "w-3 bg-violet-300" : "w-3 bg-gray-200"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-200">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">Welcome to ReplyPilot</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  ReplyPilot watches your Google reviews and writes personalized replies in your voice — automatically. Let's get you set up in 2 minutes.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: "⚡", title: "AI reads every review", desc: "Detects sentiment, mentions, and tone" },
                    { icon: "✍️", title: "Writes a reply for you", desc: "Specific to what the customer said" },
                    { icon: "✅", title: "You approve or auto-post", desc: "Stay in control or go fully hands-off" },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                      <span className="text-xl mt-0.5">{f.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(1)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-sm shadow-violet-200">
                  Get started →
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-black text-gray-900 mb-1">Your business</h2>
                <p className="text-sm text-gray-400 mb-6">Used to personalize every reply</p>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Business name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Tony's Pizza"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition placeholder:text-gray-300"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contact email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="manager@yourbusiness.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition placeholder:text-gray-300"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">Added to negative replies so unhappy customers can reach you</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">Back</button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(2)} disabled={!businessName.trim()}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-bold text-sm transition disabled:opacity-40 shadow-sm shadow-violet-200">
                    Continue →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h2 className="text-xl font-black text-gray-900 mb-1">Reply tone</h2>
                <p className="text-sm text-gray-400 mb-6">How human should your replies sound?</p>
                <div className="space-y-2 mb-8">
                  {TONE_LABELS.map((t) => (
                    <motion.button key={t.value} whileTap={{ scale: 0.98 }} onClick={() => setTone(t.value)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all ${
                        tone === t.value ? "border-violet-500 bg-violet-50" : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                          tone === t.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{t.value}</div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${tone === t.value ? "text-violet-900" : "text-gray-700"}`}>{t.label}</p>
                          <p className={`text-xs ${tone === t.value ? "text-violet-500" : "text-gray-400"}`}>{t.desc}</p>
                        </div>
                      </div>
                      {tone === t.value && (
                        <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">Back</button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-bold text-sm transition shadow-sm shadow-violet-200">
                    Continue →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200"
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-xl font-black text-gray-900 mb-3">You're all set, {businessName}!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  ReplyPilot is ready to generate replies. You have 1 month free — no card needed. Try a test review to see how it works, then go to Settings anytime to fine-tune your templates and language.
                </p>
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-8">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">Quick tip</p>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Hit <strong>"Try a test review"</strong> on your dashboard to preview a reply. Check your email — you'll get a notification too.
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={finish} disabled={saving}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-sm shadow-violet-200 disabled:opacity-50">
                  {saving ? "Saving…" : "Go to dashboard →"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
