export type MorphChar = {
  key: string;
  char: string;
  fromIndex: number | null;
  toIndex: number | null;
  kind: "move" | "fadeOut" | "fadeIn";
};

function trackOccurrences(text: string): Map<string, number[]> {
  const buckets = new Map<string, number[]>();
  [...text].forEach((char, index) => {
    const normalized = char.toLowerCase();
    const existing = buckets.get(normalized) ?? [];
    existing.push(index);
    buckets.set(normalized, existing);
  });
  return buckets;
}

/**
 * 判断输入是否为完整句子：
 * 汉字+字母+数字 占总字符 50% 以上 → 是句子，符号不参与选字
 */
function isSentence(text: string): boolean {
  if (text.length === 0) return false;
  const meaningful = [...text].filter(
    (c) => /\p{L}/u.test(c) || /\p{N}/u.test(c) || /[\u4e00-\u9fff]/.test(c)
  ).length;
  return meaningful / text.length > 0.5;
}

/**
 * 根据规则选取种子字
 */
export function pickSeedChars(text: string): string[] {
  const chars = [...text];
  const isSent = isSentence(text);

  let pool: Array<{ char: string; index: number }>;
  if (isSent) {
    pool = chars
      .map((c, i) => ({ char: c, index: i }))
      .filter(({ char }) => /\p{L}/u.test(char) || /\p{N}/u.test(char) || /[\u4e00-\u9fff]/.test(char));
  } else {
    pool = chars.map((c, i) => ({ char: c, index: i }));
  }

  if (pool.length === 0) return [];

  const n = pool.length;

  let targetCount: number;
  if (n === 1) {
    targetCount = 1;
  } else if (n <= 4) {
    const max = Math.min(3, n - 1);
    const min = 1;
    targetCount = min + Math.floor(Math.random() * (max - min + 1));
  } else {
    const min = Math.max(1, Math.ceil(n * 0.2));
    const max = Math.min(n - 1, Math.ceil(n * 0.6));
    targetCount = min + Math.floor(Math.random() * (max - min + 1));
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, targetCount).map((item) => item.char);

  return selected;
}

export function buildMorphMap(source: string, target: string): MorphChar[] {
  const sourceBuckets = trackOccurrences(source);
  const seen = new Map<string, number>();
  const morphs: MorphChar[] = [];

  [...target].forEach((char, toIndex) => {
    const normalized = char.toLowerCase();
    const usedCount = seen.get(normalized) ?? 0;
    const sourceIndices = sourceBuckets.get(normalized) ?? [];
    const maybeSourceIndex = sourceIndices[usedCount];

    seen.set(normalized, usedCount + 1);
    if (maybeSourceIndex !== undefined) {
      morphs.push({
        key: `${normalized}-${usedCount}-move`,
        char,
        fromIndex: maybeSourceIndex,
        toIndex,
        kind: "move",
      });
      return;
    }

    morphs.push({
      key: `${normalized}-${toIndex}-fadeIn`,
      char,
      fromIndex: null,
      toIndex,
      kind: "fadeIn",
    });
  });

  const consumedSource = new Set(
    morphs.filter((item) => item.fromIndex !== null).map((item) => item.fromIndex as number),
  );

  [...source].forEach((char, sourceIndex) => {
    if (consumedSource.has(sourceIndex)) {
      return;
    }
    morphs.push({
      key: `${char.toLowerCase()}-${sourceIndex}-fadeOut`,
      char,
      fromIndex: sourceIndex,
      toIndex: null,
      kind: "fadeOut",
    });
  });

  return morphs;
}

