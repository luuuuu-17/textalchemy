import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAlchemyText } from "./lib/api";
import { buildMorphMap, pickSeedChars } from "./lib/charMorph";
import { animateMorph } from "./lib/morphAnimation";

type ViewState = "idle" | "typing" | "waiting" | "morphing" | "result";

const PLACEHOLDER = "想说点什么？";

function computeFontSize(text: string): string {
  const length = [...text].length;
  if (length <= 12) return "clamp(2rem, 6vw, 2.6rem)";
  if (length <= 22) return "clamp(1.7rem, 5.2vw, 2.1rem)";
  return "clamp(1.4rem, 4.8vw, 1.8rem)";
}

function normalizeInline(text: string): string {
  return text.replace(/\n+/g, " ").trim();
}

export default function App() {
  const [input, setInput] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [resultText, setResultText] = useState("");
  const [status, setStatus] = useState<ViewState>("idle");
    const [error, setError] = useState("");
    // result 自动聚焦时隐藏光标，用户打字时恢复
    const [hideCaret, setHideCaret] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
  const oldRef = useRef<HTMLDivElement>(null);
  const newRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
    inputRef.current?.focus();
  }, []);

    // result 状态下自动聚焦输入框，隐藏光标
  useEffect(() => {
    if (status === "result") {
      inputRef.current?.focus();
      setHideCaret(true);
    }
  }, [status]);

  const typeClass = useMemo(() => {
    if (status === "waiting") {
      return "animate-breathe animate-shiver";
    }
    return "";
  }, [status]);

  const canSubmit = input.trim().length > 0 && status !== "waiting" && status !== "morphing";
  const computedFontSize = computeFontSize(input || resultText || PLACEHOLDER);

        async function runMorph(fromText: string, toText: string): Promise<void> {
        setStatus("morphing");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const oldNodes = oldRef.current ? Array.from(oldRef.current.querySelectorAll("[data-char]")) : [];
        const nextNodes = newRef.current ? Array.from(newRef.current.querySelectorAll("[data-char]")) : [];
        const map = buildMorphMap(fromText, toText);

        const movePairs = map
          .filter((item) => item.kind === "move" && item.fromIndex !== null && item.toIndex !== null)
          .map((item) => ({
            from: oldNodes[item.fromIndex as number] as HTMLElement,
            to: nextNodes[item.toIndex as number] as HTMLElement,
          }))
          .filter((pair) => pair.from && pair.to);

        await animateMorph(oldNodes as HTMLElement[], nextNodes as HTMLElement[], movePairs);
        setStatus("result");
  }

    async function onSubmit(): Promise<void> {
    const normalized = normalizeInline(input);
    if (!normalized) return;

    setError("");
    setSourceText(normalized);
    setStatus("waiting");

        try {
      // 先选种子字
      const seedChars = pickSeedChars(normalized);
      const aiText = await fetchAlchemyText(normalized, seedChars);
      const normalizedAiText = normalizeInline(aiText);
      setResultText(normalizedAiText);
      await runMorph(normalized, normalizedAiText);
      setInput("");
    } catch {
      setStatus("typing");
      setError("灵感掉线了，按下 Enter 再试一次。");
    }
  }

        const showOverlay = status === "morphing" || status === "result";
    const showOld = status === "waiting" || status === "morphing";
    const inputHidden = status === "waiting" || status === "morphing";

    return (
    <main
      className="min-h-screen bg-parchment text-charcoal px-4"
      onClick={() => {
        if (status !== "morphing") inputRef.current?.focus();
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col items-center justify-center gap-8">
        <div className="w-full text-center">
          <h1 className="mb-2 text-sm tracking-[0.32em] uppercase opacity-70">
            TextAlchemy
          </h1>
        </div>

        <div ref={containerRef} className="relative w-full min-h-[140px] flex items-center justify-center">
                    {showOld && sourceText && (
                      <div
                        ref={oldRef}
                        className="absolute inset-0 flex items-center justify-center whitespace-nowrap break-keep"
                        style={{ fontSize: computedFontSize, pointerEvents: "none" }}
                      >
                        {[...sourceText].map((char, idx) => (
                          <span key={`source-${idx}`} data-char className="inline-block">
                            {char}
                          </span>
                        ))}
                      </div>
                    )}

                    {showOverlay && resultText && (
                      <div
                        ref={newRef}
                        className="absolute inset-0 flex items-center justify-center whitespace-normal break-keep"
                        style={{ fontSize: computeFontSize(resultText), pointerEvents: "none" }}
                      >
                        {[...resultText].map((char, idx) => (
                          <span key={`next-${idx}`} data-char className="inline-block">
                            {char}
                          </span>
                        ))}
                      </div>
                    )}

                    {status === "result" && resultText && (
            <div
              className="absolute inset-0 flex items-center justify-center whitespace-normal break-keep select-none px-4"
              style={{ fontSize: computeFontSize(resultText) }}
            >
              {[...resultText].map((char, idx) => (
                <span key={`result-${idx}`} className="inline-block">
                  {char}
                </span>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            value={input}
                        onChange={(event) => {
              if (hideCaret) setHideCaret(false);
              if (status === "result") {
                setSourceText("");
                setResultText("");
                setStatus("typing");
              }
              setInput(event.target.value);
              if (status === "idle") setStatus("typing");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) {
                event.preventDefault();
                void onSubmit();
              }
            }}
                        className={`w-full bg-transparent border-none outline-none text-center whitespace-nowrap overflow-x-auto ${typeClass} ${
              inputHidden ? "opacity-0 pointer-events-none select-none" : ""
            } ${hideCaret ? "caret-hidden" : ""}`}
            style={{ fontSize: computedFontSize }}
            placeholder={status === "idle" && input.length === 0 ? PLACEHOLDER : ""}
            disabled={status === "waiting" || status === "morphing"}
          />
        </div>

        <div className="flex min-h-6 items-center gap-4 text-xs opacity-70">
          {status === "waiting" && <span className="animate-breathe">正在提炼你的字句...</span>}
          {error && <span>{error}</span>}
        </div>

        <div className="min-h-4" />
      </section>
    </main>
  );
}
