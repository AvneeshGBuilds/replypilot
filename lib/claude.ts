import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const DEFAULT_TEMPLATES = {
  positive: "Acknowledge one specific thing they mentioned. Thank them without being over the top. Invite them back.",
  neutral: "Acknowledge the specific issue they raised. Thank them for the honest feedback. Say you're working on it and invite them back.",
  negative: "Open with a real apology for exactly what went wrong. Take ownership. Invite them to contact you directly to make it right.",
};

const TONE_MAP: Record<number, string> = {
  1: "formal and measured — no contractions, professional, but still a real human not a press release",
  2: "warm and professional — occasional contractions, like a business owner who genuinely cares",
  3: "natural and conversational — friendly, real, not stiff",
  4: "casual — like texting a regular customer between shifts, relaxed and personal",
  5: "very human — slightly unpolished, genuine, like typed on a phone in 30 seconds",
};

const LANG_MAP: Record<string, string> = {
  auto: "Match the language of the review exactly.",
  en: "English.",
  es: "Spanish.",
  fr: "French.",
  de: "German.",
  pt: "Portuguese.",
  it: "Italian.",
  ja: "Japanese.",
  zh: "Simplified Chinese.",
  ko: "Korean.",
  ar: "Arabic.",
  hi: "Hindi.",
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

  const prompt = `You are the owner of "${businessName}" replying to a Google review. You are a real person — write exactly like one.

REVIEW (${rating}/5 stars, ${sentiment}):
Reviewer: ${reviewerName}
"${reviewText || "(no text — rating only)"}"

YOUR REPLY MUST COVER THIS AND ONLY THIS:
${template}${sentiment === "negative" && contactEmail ? `\nAlso invite them to reach out at ${contactEmail}.` : ""}

TONE: ${TONE_MAP[tone]}
LANGUAGE: ${LANG_MAP[language]}

EXAMPLES — study the difference:

BAD (sounds like AI):
"Thank you for your wonderful feedback! We're so glad you enjoyed your experience with us. We strive to provide excellent service and hope to see you again soon!"

GOOD (sounds human):
"That dish you mentioned — our chef's been perfecting it for two years, glad it finally landed the way it should. See you next time."

BAD (sounds like AI):
"We sincerely apologize for the inconvenience you experienced. Your satisfaction is our top priority and we are committed to improving."

GOOD (sounds human):
"A 40-minute wait with cold food at the end — that's on us, and I'm sorry. Reach out at ${contactEmail} and I'll make it right personally."

NOW WRITE THE REPLY. Rules:
- 2 to 3 sentences. No more.
- Reference something SPECIFIC from the review (a dish, a name, a wait time — something real, not "your experience")
- Vary sentence length — not all the same rhythm
- End with: — ${businessName}
- No em-dashes except the sign-off
- No exclamation marks unless tone is 4 or 5
- Do NOT start with "Thank you"
- Do NOT use: "strive to", "committed to", "top priority", "hope to see you", "don't hesitate", "wonderful", "fantastic", "absolutely", "certainly", "delighted"

Output ONLY the reply. No quotes. Nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
