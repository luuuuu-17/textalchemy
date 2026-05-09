import gsap from "gsap";

/**
 * 阶段1：旧文字层中不匹配的字符淡出
 * 完成后，匹配的字符保留在屏幕上
 */
export function animatePhase1(
  containerEl: HTMLElement,
  fadeOutIndices: Set<number>,
): Promise<void> {
  return new Promise((resolve) => {
    const nodes = Array.from(containerEl.querySelectorAll("[data-char]")) as HTMLElement[];

    void document.body.offsetHeight;

    const fadeOutNodes = nodes.filter((_, i) => fadeOutIndices.has(i));

    if (fadeOutNodes.length === 0) {
      resolve();
      return;
    }

    gsap.to(fadeOutNodes, {
      opacity: 0,
      scale: 0.6,
      filter: "blur(3px)",
      duration: 0.4,
      stagger: { each: 0.02, from: "edges" },
      onComplete: () => {
        // 从 DOM 移除这些节点
        fadeOutNodes.forEach((node) => node.remove());
        resolve();
      },
    });
  });
}

/**
 * 阶段2：构建新文字层，匹配字符从旧位置飞入，新增字符淡入
 *
 * @param containerEl 旧文字层的容器（上面只剩下匹配的字符）
 * @param targetChars 目标文本的字符数组
 * @param oldPositions 每个匹配的旧字符的屏幕坐标 Map<旧字符内容, DOMRect[]>
 */
export function animatePhase2(
  containerEl: HTMLElement,
  targetText: string,
  _sourceText: string,
): Promise<void> {
  return new Promise((resolve) => {
    const targetChars = [...targetText];

    // 获取当前容器中保留下来的旧节点（它们还在 DOM 中）
    const oldKeptNodes = Array.from(containerEl.querySelectorAll("[data-char]")) as HTMLElement[];
    const oldKeptTexts = oldKeptNodes.map((n) => n.textContent ?? "");

    // 记录每个旧节点的当前位置
    const oldRects = oldKeptNodes.map((n) => n.getBoundingClientRect());

    // 清空容器
    containerEl.innerHTML = "";

    // 构建新文字层的所有 span
    const newSpans: HTMLElement[] = [];
    const spanIsMove: boolean[] = []; // true=从旧位置飞来, false=新增淡入

    // 复制旧节点文本列表用于匹配
    const availTexts = [...oldKeptTexts];
    const availNodes = [...oldKeptNodes];

    for (let ti = 0; ti < targetChars.length; ti++) {
      const char = targetChars[ti];
      let matched = false;

      // 找第一个匹配的旧节点
      for (let ai = 0; ai < availTexts.length; ai++) {
        if (availTexts[ai] !== "" && availTexts[ai].toLowerCase() === char.toLowerCase()) {
          // 复用旧节点
          const node = availNodes[ai];
          node.textContent = char;
          newSpans.push(node);
          spanIsMove.push(true);
          availTexts[ai] = ""; // 标记已使用
          availNodes[ai] = null!;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // 新增节点
        const span = document.createElement("span");
        span.className = "inline-block";
        span.setAttribute("data-char", "");
        span.textContent = char;
        newSpans.push(span);
        spanIsMove.push(false);
      }
    }

    // 剩余的没匹配上的旧节点丢弃
    availNodes.filter(Boolean).forEach((n) => n?.remove());

    // 把所有 span 按顺序插入容器
    newSpans.forEach((span) => containerEl.appendChild(span));

    // 强制布局，获取新位置
    void document.body.offsetHeight;

    // 创建 timeline
    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => resolve(),
    });

    // 索引跟踪：每个旧节点已被分配给哪个 target 位置
    let usedAvailIdx = new Set<number>();

    newSpans.forEach((span, ti) => {
      if (spanIsMove[ti]) {
        // 这个节点是复用的旧节点——它需要从旧位置飞到新位置
        // 找到它对应的旧节点索引
        let foundIdx = -1;
        const char = targetChars[ti];
        for (let ai = 0; ai < oldKeptTexts.length; ai++) {
          if (
            !usedAvailIdx.has(ai) &&
            oldKeptTexts[ai].toLowerCase() === char.toLowerCase()
          ) {
            foundIdx = ai;
            break;
          }
        }

        if (foundIdx >= 0) {
          usedAvailIdx.add(foundIdx);
          const oldRect = oldRects[foundIdx];
          const newRect = span.getBoundingClientRect();
          const deltaX = oldRect.left - newRect.left;
          const deltaY = oldRect.top - newRect.top;

          gsap.set(span, {
            x: deltaX,
            y: deltaY,
            opacity: 1,
            scale: 1,
          });

          timeline.to(span, {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: "back.out(1.2)",
          }, 0);
        }
      } else {
        // 新增节点：淡入
        gsap.set(span, {
          opacity: 0,
          scale: 0.8,
          filter: "blur(2px)",
        });

        timeline.to(span, {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "back.out(1.5)",
        }, 0.15);
      }
    });
  });
}