import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Write in a formal, corporate tone. Use complete sentences, no contractions, professional language. Sound like a polished brand statement.",
  2: "Write professionally but with warmth. Polished yet approachable — like a trusted manager responding.",
  3: "Write naturally and conversationally. Sound like a real human who genuinely cares. Use contractions. Be warm but not over the top.",
  4: "Write casually and personally. Sound like a friendly owner who knows their regulars. Relaxed, genuine, maybe a touch of personality.",
  5: "Write in a very personal, heartfelt way. Sound completely human — like the owner themselves typed this at their desk. Use natural speech patterns, contractions, and real emotion. It should NOT sound like AI at all.",
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

  const templateSection = options?.template
    ? `\nFollow this specific outline:\n${options.template}`
    : "";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are writing a real Google Business review reply for "${businessName}".

REVIEW DETAILS:
- Reviewer name: ${reviewerName}
- Star rating: ${rating}/5 (${sentiment})
- Review text: "${reviewText}"

TONE INSTRUCTION: ${TONE_INSTRUCTIONS[tone]}

LANGUAGE INSTRUCTION: ${LANGUAGE_INSTRUCTIONS[language]}
${templateSection}

STRICT RULES:
- Maximum 3 sentences. Do not exceed this.
- Reference something SPECIFIC from what they wrote — never write a generic reply
- For negative reviews (1-2 stars): lead with a genuine apology, acknowledge their specific complaint, then invite them to reach out at ${contactEmail}
- For neutral reviews (3 stars): thank them, address their specific concern or suggestion, invite them back
- For positive reviews (4-5 stars): thank them genuinely, echo one specific detail they mentioned, express you can't wait to see them again
- Do NOT start with "Thank you for your review" — it sounds robotic
- Do NOT use phrases like "We strive to" or "It is our goal" or "We take pride in" — they sound fake
- Do NOT use exclamation marks more than once per reply
- Sign off naturally as "— ${businessName}" (just the name, no "The ... Team")
- Output ONLY the reply text. Nothing else.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
