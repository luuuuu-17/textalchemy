import gsap from "gsap";

export function animateMorph(
  previousNodes: HTMLElement[],
  nextNodes: HTMLElement[],
  movedPairs: Array<{ from: HTMLElement; to: HTMLElement }>,
): Promise<void> {
  return new Promise((resolve) => {
    const movedFromNodes = new Set(movedPairs.map((p) => p.from));
    const fadeOutNodes = previousNodes.filter((node) => !movedFromNodes.has(node));
    const movedToNodes = new Set(movedPairs.map((p) => p.to));
    const fadeInNodes = nextNodes.filter((node) => !movedToNodes.has(node));

    void document.body.offsetHeight;

    gsap.set(nextNodes, {
      opacity: 0,
      scale: 0.8,
      filter: "blur(2px)",
      willChange: "transform, opacity, filter",
      transformOrigin: "50% 60%",
    });

    gsap.set(previousNodes, {
      willChange: "transform, opacity, filter",
      transformOrigin: "50% 60%",
    });

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => resolve(),
    });

    if (fadeOutNodes.length > 0) {
      timeline.to(fadeOutNodes, {
        opacity: 0,
        filter: "blur(3px)",
        scale: 0.7,
        duration: 0.4,
        stagger: { each: 0.02, from: "edges" },
      }, 0);
    }

    movedPairs.forEach(({ from, to }) => {
      const fromBox = from.getBoundingClientRect();
      const toBox = to.getBoundingClientRect();
      const deltaX = fromBox.left - toBox.left;
      const deltaY = fromBox.top - toBox.top;

      timeline.to(from, {
        opacity: 0,
        duration: 0.25,
      }, 0);

      timeline.fromTo(to, {
        x: deltaX,
        y: deltaY,
        opacity: 0,
        scale: 0.85,
        filter: "blur(2px)",
      }, {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "back.out(1.2)",
      }, 0.05);
    });

    if (fadeInNodes.length > 0) {
      timeline.to(fadeInNodes, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.5,
        stagger: { each: 0.025, from: "center" },
        ease: "back.out(1.5)",
      }, 0.15);
    }
  });
}