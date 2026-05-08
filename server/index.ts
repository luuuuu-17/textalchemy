import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { appendFile } from "node:fs/promises";
import http from "node:http";
import { generateAlchemyReply } from "./services/gemini";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const deepseekApiKey = process.env.DEEPSEEK_API_KEY ?? "";

app.use(cors());
app.use(express.json());

function forwardDebugLog(payload: unknown): void {
  const serialized =
    typeof payload === "string"
      ? payload
      : (() => {
          try {
            return JSON.stringify(payload);
          } catch {
            return JSON.stringify({ sessionId: "c69789", message: "serialize_failed", timestamp: Date.now() });
          }
        })();

  void appendFile("debug-c69789.log", `${serialized}\n`, "utf8").catch(() => {});

  try {
    const data = serialized;
    const req = http.request(
      "http://127.0.0.1:7441/ingest/8c9380ad-4f73-4211-b57c-64b352e75782",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "X-Debug-Session-Id": "c69789",
        },
      },
      (res) => res.resume(),
    );
    req.on("error", () => {});
    req.write(data);
    req.end();
  } catch {
    // ignore
  }
}

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/__debug-log", (req, res) => {
  // Payload must NOT include secrets; caller is responsible.
  forwardDebugLog(req.body);
  res.json({ ok: true });
});

app.post("/api/alchemy", async (req, res) => {
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

  // #region agent log
  forwardDebugLog({sessionId:'c69789',runId:'pre-fix',hypothesisId:'A',location:'server/index.ts:44',message:'POST /api/alchemy responding',data:{responseLen:responseText.length,responsePreview:responseText.slice(0,24),timedOut:responseText===timeoutText},timestamp:Date.now()});
  // #endregion

  return res.json({ reply: responseText });
});

app.listen(port, () => {
  console.log(`TextAlchemy API running on :${port}`);
});

