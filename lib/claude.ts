import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const DEFAULT_TEMPLATES = {
  positive: "Thank them genuinely. Mention something specific they highlighted. Let them know we look forward to seeing them again.",
  neutral: "Thank them for their feedback. Acknowledge the specific concern they raised. Reassure them we're always improving and invite them back.",
  negative: "Sincerely apologize for their experience. Acknowledge the specific issue they mentioned. Offer to make it right and provide our contact info. Keep it humble and genuine.",
};

const TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Write formally and professionally. No contractions. Polished, measured language. But still human — not a press release.",
  2: "Write professionally but warmly. You're a manager who genuinely cares. Use occasional contractions. Sound real.",
  3: "Write like a real person who owns this place and actually read the review. Natural, warm, a little conversational. Not stiff.",
  4: "Write like a friendly owner texting a regular. Casual, genuine, a little personal. Like you dashed this off between customers.",
  5: "Write exactly how a real small business owner would type this — maybe a little rushed, genuine, no polish. It should feel like a human typed it on their phone, not a marketing team.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  auto: "Detect the language the review is written in and reply in that exact same language.",
  en: "Reply in English.",
  es: "Reply in Spanish.",
  fr: "Reply in French.",
  de: "Reply in German.",
  pt: "Reply in Portuguese.",
  it: "Reply in Italian.",
  ja: "Reply in Japanese.",
  zh: "Reply in Simplified Chinese.",
  ko: "Reply in Korean.",
  ar: "Reply in Arabic.",
  hi: "Reply in Hindi.",
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

  const contentGuidance = options?.template
    ? `CONTENT — follow this outline the business owner has set for ${sentiment} reviews:
${options.template}
${sentiment === "negative" ? `Also: always invite them to contact at ${contactEmail}.` : ""}`
    : `CONTENT:
- Pick ONE specific thing they mentioned and reference it directly. Not vaguely — specifically.
- For negative reviews: Start with a real apology (not "we're sorry you felt that way"). Acknowledge exactly what went wrong. Invite them to contact you at ${contactEmail}.
- For neutral reviews: Thank them, acknowledge the specific criticism, invite them back.
- For positive reviews: Acknowledge a specific detail they mentioned. Express genuine appreciation. Invite them back naturally.`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a real business owner writing a reply to a Google review for "${businessName}". You are NOT an AI assistant. You are a person.

REVIEW:
- From: ${reviewerName}
- Stars: ${rating}/5 (${sentiment})
- Text: "${reviewText}"

TONE: ${TONE_INSTRUCTIONS[tone]}

LANGUAGE: ${LANGUAGE_INSTRUCTIONS[language]}

RULES — follow every single one:

LENGTH & STRUCTURE:
- 2-3 sentences maximum. No more.
- Mix short and longer sentences — don't make them all the same length.
- No bullet points, no lists, no headers.

${contentGuidance}

SIGN OFF:
- End with: — ${businessName}

FORBIDDEN PHRASES — never use any of these:
- "Thank you for your review"
- "Thank you for your feedback"
- "We appreciate your feedback"
- "We strive to"
- "It is our goal"
- "We take pride in"
- "We are committed to"
- "We are sorry to hear"
- "We apologize for any inconvenience"
- "Your satisfaction is our priority"
- "We hope to see you again soon"
- "Please don't hesitate to"
- "At [business name], we..."
- "As always"
- "Certainly"
- "Absolutely"
- "Wonderful"
- "Fantastic"
- "Amazing"
- "Delighted"
- "Thrilled"

FORBIDDEN PATTERNS:
- Do NOT start with "Thank you"
- Do NOT use more than one exclamation mark in the whole reply
- Do NOT use em-dashes (—) anywhere except the sign-off
- Do NOT sound like a PR department
- Do NOT write the same opening every time
- Do NOT use the reviewer's first name more than once
- Do NOT be sycophantic or over-the-top

Output ONLY the reply. No quotes around it. Nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
