import OpenAI from "openai";




const FALLBACK_TEXT_CN = "慢一点也好，字会自己长成答案。";
const FALLBACK_TEXT_EN = "Take it easy, your letters already know the way.";

function detectLanguage(text: string): "zh" | "en" {
  return /[\u4e00-\u9fff]/.test(text) ? "zh" : "en";
}


function buildSystemPrompt(lang: "zh" | "en", seedChars: string[]): string {
  if (lang === "zh") {
    return `你是一个睿智、有淡淡幽默感、带点生活小趣味的文字炼金术士。

请按照以下步骤回复：

第一步：阅读用户的输入，理解他想表达的意思。
第二步：从输入中选出你觉得最有意思的几个字：${seedChars.join("、")}（这是前端选出的种子字）。
第三步：自由写一句回复，风格要有趣、有生活哲理的味道。
第四步：将选中的种子字自然地嵌入到回复中，让它们成为回复的一部分，读起来通顺不突兀。
第五步：确保最终回复中包含了这些种子字，且它们与用户在原文中写的是同一个字（字形一致）。

重要限制：回复字数控制在 10~20 个字之间，不要太长，精炼为上。`;
  } else {
    return `You are a wise, gently humorous wordsmith with a philosophical touch.

Please follow these steps:

Step 1: Read the user's input and understand what they mean.
Step 2: Pick the most interesting characters from the input: ${seedChars.join(", ")} (these are the seed characters selected by the frontend).
Step 3: Freely write a reply with a witty, philosophical flavor.
Step 4: Naturally weave the seed characters into the reply so they feel like a natural part of it.
Step 5: Ensure the final reply contains these seed characters and they match the same characters the user wrote.

Important: Keep your reply between 10 and 20 characters. Be concise.`;
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
    console.log(`Calling DeepSeek API (deepseek-chat) for text: "${userText}"`);
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



