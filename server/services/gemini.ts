import OpenAI from "openai";

const FALLBACK_TEXT_CN = "慢一点也好，字会自己长成答案。";
const FALLBACK_TEXT_EN = "Take it easy, your letters already know the way.";

function detectLanguage(text: string): "zh" | "en" {
  return /[\u4e00-\u9fff]/.test(text) ? "zh" : "en";
}

function buildSystemPrompt(lang: "zh" | "en", seedChars: string[]): string {
  const zhSeed = seedChars.length > 0
      ? `写回复时，如果自然的话可以用到这些字：${seedChars.join("、")}。用不上也没关系。`
      : "";
  const enSeed = seedChars.length > 0
      ? "If natural, you can use these words: " + seedChars.join(", ") + ". It's okay if you don't."
      : "";

  if (lang === "zh") {
    return "你是一个睿智、有淡淡幽默感、带点生活小趣味的文字炼金术士。\n\n" +
      "用户会跟你说一句话。请你读懂他想表达的情绪或意思，然后用一句有温度、有智慧的话回应他。\n\n" +
      zhSeed + "\n\n" +
      "要求：\n" +
      "- 像朋友聊天一样自然，不要文绉绉\n" +
      "- 控制在 10~25 个字\n" +
      "- 不要为了用某个字而强行嵌入";
  } else {
    return "You are a wise, gently humorous wordsmith with a philosophical touch.\n\n" +
      "The user will say something to you. Read their emotion and meaning, then reply with a warm, wise line.\n\n" +
      enSeed + "\n\n" +
      "Requirements:\n" +
      "- Natural, like a friend chatting\n" +
      "- Keep it between 10 and 25 characters\n" +
      "- Don't force the seed characters in";
  }
}

export async function generateAlchemyReply(
  userText: string,
  apiKey: string,
  seedChars: string[],
): Promise<string> {
  console.log("Initializing DeepSeek with API Key:", apiKey ? "PRESENT" : "MISSING");
  console.log("Seed chars:", seedChars);
  const lang = detectLanguage(userText);

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey,
  });

  try {
    console.log("Calling DeepSeek API (deepseek-chat) for text: \"" + userText + "\"");
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: buildSystemPrompt(lang, seedChars) },
        { role: "user", content: userText },
      ],
      temperature: 0.65,
      max_tokens: 100,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    console.log("DeepSeek response received:", text);

    if (!text) {
      return lang === "zh" ? FALLBACK_TEXT_CN : FALLBACK_TEXT_EN;
    }
    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("DeepSeek API Error details:", error);
    return lang === "zh" ? FALLBACK_TEXT_CN : FALLBACK_TEXT_EN;
  }
}