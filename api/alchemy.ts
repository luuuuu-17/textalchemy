import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateAlchemyReply } from "../server/services/gemini.js";

const deepseekApiKey = process.env.DEEPSEEK_API_KEY ?? "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const text = String(req.body?.text ?? "").trim();
  const seedChars: string[] = Array.isArray(req.body?.seedChars) ? req.body.seedChars : [];

  if (!text) {
    return res.status(400).json({ message: "Missing text" });
  }

  if (!deepseekApiKey) {
    return res.status(500).json({ message: "DEEPSEEK_API_KEY is missing" });
  }

  const timeoutText = "今天先慢一点，明天会更清晰。";
  const alchemyPromise = generateAlchemyReply(text, deepseekApiKey, seedChars);
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve(timeoutText), 12000);
  });

  const responseText = await Promise.race([alchemyPromise, timeoutPromise]);
  return res.json({ reply: responseText });
}
