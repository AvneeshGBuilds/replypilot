import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const DEFAULT_TEMPLATES = {
  positive: "Acknowledge one specific thing they mentioned. Thank them without being over the top. Invite them back.",
  neutral: "Acknowledge the specific issue they raised. Thank them for the honest feedback. Say you're working on it and invite them back.",
  negative: "Open with a real apology for exactly what went wrong. Take ownership. Invite them to contact you directly to make it right.",
};

const TONE_MAP: Record<number, string> = {
  1: "formal and measured — no contractions, professional but human",
  2: "warm and professional — occasional contractions, genuine",
  3: "natural and conversational — friendly, real, not stiff",
  4: "casual — like texting a regular, relaxed and personal",
  5: "very human — slightly unpolished, like typed on a phone quickly",
};

const LANG_MAP: Record<string, string> = {
  auto: "Match the language the review is written in.",
  en: "English", es: "Spanish", fr: "French", de: "German",
  pt: "Portuguese", it: "Italian", ja: "Japanese", zh: "Simplified Chinese",
  ko: "Korean", ar: "Arabic", hi: "Hindi",
};

export async function generateReviewReply(
  reviewText: string,
  reviewerName: string,
  rating: number,
  businessName: string,
  options?: {
    tone?: number;
    language?: string;
    template?: string;
    contactEmail?: string;
  }
): Promise<string> {
  const tone = options?.tone ?? 3;
  const language = options?.language ?? "auto";
  const contactEmail = options?.contactEmail || "us directly";
  const sentiment = rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative";
  const template = options?.template || DEFAULT_TEMPLATES[sentiment];

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are writing a Google review reply on behalf of the owner of "${businessName}".

REVIEW:
Reviewer: ${reviewerName}
Stars: ${rating}/5 (${sentiment})
Text: "${reviewText || "(no written review)"}"

YOUR REPLY MUST DO EXACTLY THIS — follow it literally:
${template}${sentiment === "negative" && contactEmail !== "us directly" ? `\nAlways include: invite them to contact ${contactEmail}.` : sentiment === "negative" ? `\nAlways include: invite them to reach out directly.` : ""}

STYLE:
- Tone: ${TONE_MAP[tone]}
- Language: ${LANG_MAP[language]}
- 2-3 sentences maximum
- Reference something SPECIFIC from their review (exact words, a detail they mentioned) — not just "your experience"
- Write like a real human owner, not a marketing team
- End with: — ${businessName}

DO NOT start with "Thank you". DO NOT use: "strive to", "committed to", "top priority", "hope to see you soon", "don't hesitate", "wonderful", "fantastic", "absolutely", "certainly".

Reply:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
