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
        {/* Violet gradient top border */}
        <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <motion.div
            className="h-0.5 bg-violet-400/40 rounded-full"
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
                    {
                      icon: (
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ),
                      title: "AI reads every review",
                      desc: "Detects sentiment, mentions, and tone"
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      ),
                      title: "Writes a reply for you",
                      desc: "Specific to what the customer said"
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      title: "You approve or auto-post",
                      desc: "Stay in control or go fully hands-off"
                    },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                      <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        {f.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{f.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(1)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-md shadow-violet-200">
                  Get started
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
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-bold text-sm transition disabled:opacity-40 shadow-md shadow-violet-200">
                    Continue
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
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-colors flex-shrink-0 ${
                          tone === t.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}>{t.value}</div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${tone === t.value ? "text-violet-900" : "text-gray-700"}`}>{t.label}</p>
                          <p className={`text-xs ${tone === t.value ? "text-violet-500" : "text-gray-400"}`}>{t.desc}</p>
                        </div>
                      </div>
                      {tone === t.value && (
                        <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">Back</button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-2xl font-bold text-sm transition shadow-md shadow-violet-200">
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {/* Confetti dots */}
                <div className="relative mb-6">
                  {[
                    { x: "10%", y: "20%", color: "bg-violet-400", size: "w-2 h-2", delay: 0.1 },
                    { x: "80%", y: "10%", color: "bg-emerald-400", size: "w-1.5 h-1.5", delay: 0.15 },
                    { x: "90%", y: "50%", color: "bg-amber-400", size: "w-2 h-2", delay: 0.2 },
                    { x: "5%", y: "60%", color: "bg-indigo-400", size: "w-1.5 h-1.5", delay: 0.12 },
                    { x: "70%", y: "70%", color: "bg-rose-400", size: "w-2 h-2", delay: 0.18 },
                    { x: "40%", y: "5%", color: "bg-cyan-400", size: "w-1.5 h-1.5", delay: 0.08 },
                  ].map((dot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: dot.delay, duration: 0.4, ease: "backOut" }}
                      className={`absolute ${dot.color} ${dot.size} rounded-full`}
                      style={{ left: dot.x, top: dot.y }}
                    />
                  ))}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
                      className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 relative"
                    >
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <motion.path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
                        />
                      </motion.svg>
                    </motion.div>
                  </div>
                </div>

                <h2 className="text-xl font-black text-gray-900 mb-3 text-center">You're all set, {businessName}!</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 text-center">
                  ReplyPilot is ready to generate replies. You have 1 month free — no card needed.
                </p>
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-8">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">Quick tip</p>
                  <p className="text-sm text-violet-800 leading-relaxed">
                    Hit <strong>"Try a test review"</strong> on your dashboard to preview a reply. Check your email — you'll get a notification too.
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={finish} disabled={saving}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-md shadow-violet-200 disabled:opacity-50">
                  {saving ? "Saving…" : "Go to dashboard"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
