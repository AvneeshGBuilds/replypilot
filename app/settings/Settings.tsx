"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: "auto", label: "Auto-detect — match the reviewer's language" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
];

const TONE_LABELS = [
  { value: 1, label: "Very formal", description: "Corporate and professional — sounds like a brand statement" },
  { value: 2, label: "Professional", description: "Warm but polished — trusted business voice" },
  { value: 3, label: "Friendly", description: "Natural and conversational — the sweet spot" },
  { value: 4, label: "Casual", description: "Relaxed and approachable — like a friendly owner" },
  { value: 5, label: "Personal", description: "Heartfelt and human — barely sounds like AI" },
];

import { DEFAULT_TEMPLATES } from "@/lib/claude";

type Settings = {
  autoPost: boolean;
  language: string;
  tone: number;
  businessName: string;
  contactEmail: string;
  templates: { positive: string; neutral: string; negative: string };
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    autoPost: false,
    language: "auto",
    tone: 3,
    businessName: "",
    contactEmail: "",
    templates: DEFAULT_TEMPLATES,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const snap = await getDoc(doc(db, "settings", user.uid));
      if (snap.exists()) {
        const data = snap.data() as Partial<Settings>;
        // Merge defaults for any fields not yet saved (e.g. templates on first visit)
        setSettings((prev) => ({
          ...prev,
          ...data,
          templates: { ...prev.templates, ...data.templates },
        }));
        // If templates weren't in Firestore yet, write them now so routes always have them
        if (!data.templates) {
          setDoc(doc(db, "settings", user.uid), { templates: DEFAULT_TEMPLATES }, { merge: true });
        }
      }
      setLoading(false);
    });
  }, [router]);

  function update(key: keyof Settings, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateTemplate(key: keyof Settings["templates"], value: string) {
    setSettings((prev) => ({ ...prev, templates: { ...prev.templates, [key]: value } }));
    setSaved(false);
  }

  async function save() {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "settings", user.uid), settings, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f8] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  );

  const currentTone = TONE_LABELS.find((t) => t.value === settings.tone) || TONE_LABELS[2];

  return (
    <main className="min-h-screen bg-[#f5f5f8]">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </a>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-bold text-gray-900">Settings</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={save}
          disabled={saving}
          className={`text-sm px-5 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            saved ? "bg-emerald-500 text-white" : "bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span key={saved ? "saved" : saving ? "saving" : "idle"}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5">
              {saving ? "Saving…" : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </>
              ) : "Save changes"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-4">

        {/* Business Info */}
        <Card
          title="Business info"
          subtitle="Used to personalize every reply"
          icon={
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <Field label="Business name">
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="e.g. Tony's Pizza"
              className={inputClass}
            />
          </Field>
          <Field label="Contact email" hint="Inserted in negative replies so unhappy customers can reach you">
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="manager@yourbusiness.com"
              className={inputClass}
            />
          </Field>
        </Card>

        {/* Language */}
        <Card
          title="Reply language"
          subtitle="Choose a language or let AI match the reviewer automatically"
          icon={
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          }
        >
          <select
            value={settings.language}
            onChange={(e) => update("language", e.target.value)}
            className={inputClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Card>

        {/* Tone */}
        <Card
          title="Reply tone"
          subtitle="Control how human vs polished the AI sounds"
          delay={0.15}
          icon={
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        >
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>Very formal</span>
              <span>Very personal</span>
            </div>
            <input
              type="range" min={1} max={5} step={1}
              value={settings.tone}
              onChange={(e) => update("tone", Number(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer"
            />
            {/* Tone tile row */}
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {TONE_LABELS.map((t) => (
                <motion.button key={t.value} whileTap={{ scale: 0.92 }}
                  onClick={() => update("tone", t.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all text-center ${
                    settings.tone === t.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <span className={`text-sm font-black transition-colors ${settings.tone === t.value ? "text-violet-700" : "text-gray-400"}`}>
                    {t.value}
                  </span>
                  <span className={`text-[10px] font-semibold leading-tight transition-colors ${settings.tone === t.value ? "text-violet-600" : "text-gray-400"}`}>
                    {t.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentTone.value}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3.5">
              <p className="text-sm font-bold text-violet-900">{currentTone.label}</p>
              <p className="text-xs text-violet-500 mt-0.5">{currentTone.description}</p>
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Templates */}
        <Card
          title="Reply outlines"
          subtitle="Tell the AI what to cover — it writes naturally from your outline"
          delay={0.2}
          icon={
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        >
          <div className="space-y-4">
            <TemplateField label="5-star reviews" stars={5} color="green" value={settings.templates.positive} onChange={(v) => updateTemplate("positive", v)} />
            <TemplateField label="3-4 star reviews" stars={3} color="amber" value={settings.templates.neutral} onChange={(v) => updateTemplate("neutral", v)} />
            <TemplateField label="1-2 star reviews" stars={1} color="red" value={settings.templates.negative} onChange={(v) => updateTemplate("negative", v)} />
          </div>
        </Card>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={save} disabled={saving}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${
            saved
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
              : "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span key={saved ? "s" : "n"}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2">
              {saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  All saved!
                </>
              ) : saving ? "Saving…" : "Save changes"}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pb-4">
          <a href="/terms" className="hover:text-gray-500 transition">Terms of Service</a>
          {" · "}
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {" · "}
          <span>ReplyPilot © 2026</span>
        </p>
      </div>
    </main>
  );
}

const inputClass = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition placeholder:text-gray-300";

function Card({ title, subtitle, children, delay = 0, icon }: {
  title: string; subtitle: string; children: React.ReactNode; delay?: number; icon?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-violet-200 shadow-sm p-6"
    >
      <div className="flex items-start gap-3 mb-5">
        {icon && (
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

function TemplateField({ label, stars, color, value, onChange }: {
  label: string; stars: number; color: "green" | "amber" | "red";
  value: string; onChange: (v: string) => void;
}) {
  const badge = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
  }[color];

  const placeholderHint = {
    green: "e.g. Thank them warmly, mention the specific thing they loved, invite them back",
    amber: "e.g. Acknowledge the mixed experience, address any concern, offer to make it right",
    red: "e.g. Apologize sincerely, take responsibility, provide contact email to resolve offline",
  }[color];

  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border mb-2.5 ${badge}`}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
        <span className="ml-0.5">{label}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition resize-none placeholder:text-gray-300"
        placeholder={placeholderHint}
      />
    </div>
  );
}
