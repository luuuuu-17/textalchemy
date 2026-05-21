import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAlchemyText } from "./lib/api";
import { buildMorphMap, pickSeedChars } from "./lib/charMorph";
import { animatePhase1, animatePhase2 } from "./lib/morphAnimation";

type ViewState = "idle" | "typing" | "waiting" | "morphing" | "result";

const PLACEHOLDER = "想说点什么？";

function computeFontSize(_text: string): string {
  return "1.8rem";
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
  const computedFontSize = useMemo(() => {
    // 所有文字层统一用同一套字体大小
    const textForSize = sourceText || resultText || input || PLACEHOLDER;
    return computeFontSize(textForSize);
  }, [sourceText, resultText, input]);

                async function runMorph(fromText: string, toText: string): Promise<void> {
                setStatus("morphing");
                await new Promise((resolve) => setTimeout(resolve, 50));

                const oldEl = oldRef.current;
                if (!oldEl) return;

                const map = buildMorphMap(fromText, toText);

                // 找出哪些旧索引需要淡出（不匹配）
                const movedFromIndices = new Set(
                  map.filter((item) => item.fromIndex !== null).map((item) => item.fromIndex as number),
                );
                // 找出哪些旧索引需要保留（匹配）
                const keptIndices = new Set(
                  map.filter((item) => item.kind === "move").map((item) => item.fromIndex as 
                  number),
                  
                );
                // 要淡出的索引 = 所有有 fromIndex 的 - 匹配(move)的
                const fadeOutIndices = new Set(
                  [...movedFromIndices].filter((i) => !keptIndices.has(i)),
                );

                // 阶段1：不匹配的字符淡出
                await animatePhase1(oldEl, fadeOutIndices);

                // 此时旧层中只剩下匹配的字符
                // 阶段2：用同一个容器构建新文字层，做飞入+淡入动画
                await animatePhase2(oldEl, toText, fromText);
                setStatus("result");
                setInput("");
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

        const inputHidden = status === "waiting" || status === "morphing";

    return (
    <main
      className="min-h-screen bg-parchment text-charcoal px-4"
      onClick={() => {
        if (status !== "morphing") inputRef.current?.focus();
      }}
    >
                        <section className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col items-center justify-start pt-[25vh] gap-10">
        <div className="w-full text-center">
                                        <h1 className="text-4xl tracking-[0.15em] uppercase opacity-80">
                                          TextAlchemy
                                        </h1>
                                        <div className="mx-auto mt-6 h-px bg-gradient-to-r from-transparent via-[#2D2D2D] to-transparent" style={{ width: "10em" }} />
        </div>

        <div ref={containerRef} className="relative w-full min-h-[140px] flex items-center justify-center">
                                                                                {sourceText && status !== "result" && (
                                                                                  <div
                                                                                    ref={oldRef}
                                                                                    className="absolute inset-0 flex items-center justify-center whitespace-nowrap break-keep"
                                                                                    style={{
                                                                                      fontSize: computedFontSize,
                                                                                      pointerEvents: "none",
                                                                                      letterSpacing: "-0.02em",
                                                                                    }}
                                                                                  >
                                                                                    {[...sourceText].map((char, idx) => (
                                                                                      <span key={`source-${idx}`} data-char className="inline-block">
                                                                                        {char}
                                                                                      </span>
                                                                                    ))}
                                                                                  </div>
                                                                                )}

                    {status === "result" && resultText && (
            <div
                            className="absolute inset-0 flex items-center justify-center whitespace-normal break-keep select-none px-4"
              style={{ fontSize: computedFontSize, letterSpacing: "-0.02em" }}
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
                        className={`w-full bg-transparent border-none outline-none text-center ${typeClass} ${
              inputHidden ? "opacity-0 pointer-events-none select-none" : ""
            } ${hideCaret ? "caret-hidden" : ""}`}
            style={{ fontSize: computedFontSize, letterSpacing: "-0.02em" }}
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
