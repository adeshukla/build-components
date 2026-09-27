"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const reduceMotion = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

/**
 * Three drawn diagrams for the three steps: an options panel, a bench with the keyboard path across it,
 * and a file leaving. Each is the step it stands for rather than an icon beside it.
 *
 * They draw once, when they reach the screen. Asking for less motion is not the same as asking for less
 * information, so there the diagram is simply already finished.
 */
export function StepDiagram({ step }: { step: "configure" | "test" | "take" }) {
  const ref = useRef<SVGSVGElement>(null);
  const [seen, setSeen] = useState(false);
  const still = useSyncExternalStore(reduceMotion.subscribe, reduceMotion.get, () => true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        watcher.disconnect();
      },
      { threshold: 0.4 },
    );
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  // Before the server and the client agree on the media query, the finished diagram is the safe state.
  const drawn = !still;
  const running = drawn && seen;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 240 132"
      className="h-32 w-full"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {step === "configure" && <Configure drawn={drawn} running={running} />}
      {step === "test" && <Test drawn={drawn} running={running} />}
      {step === "take" && <Take drawn={drawn} running={running} />}
    </svg>
  );
}

type Parts = { drawn: boolean; running: boolean };

/** How a line behaves: drawn in on arrival, or simply already there. */
function line(drawn: boolean, running: boolean, delay: number) {
  return {
    className: drawn ? "draw-in" : "",
    style: drawn ? { animationDelay: `${delay}ms`, animationPlayState: running ? ("running" as const) : ("paused" as const) } : undefined,
  };
}

/** Option rows filling in, with one row marked gold, as the editor marks a changed option. */
function Configure({ drawn, running }: Parts) {
  return (
    <g>
      <rect x="8" y="10" width="224" height="112" rx="6" className="stroke-rule-strong" />
      <line x1="8" y1="32" x2="232" y2="32" className="stroke-rule-strong" />
      {[0, 1, 2].map((tab) => (
        <rect
          key={tab}
          x={20 + tab * 42}
          y={18}
          width="34"
          height="8"
          rx="3"
          className={tab === 0 ? "fill-link stroke-none" : "fill-rule-strong stroke-none"}
        />
      ))}
      {[0, 1, 2, 3].map((row) => {
        const timing = line(drawn, running, 120 + row * 130);
        return (
          <g key={row}>
            <line
              x1="22"
              y1={50 + row * 18}
              x2={row === 1 ? 150 : 120}
              y2={50 + row * 18}
              pathLength={1}
              className={`${timing.className} stroke-rule-strong`}
              style={timing.style}
            />
            <line
              x1="170"
              y1={50 + row * 18}
              x2="218"
              y2={50 + row * 18}
              pathLength={1}
              className={`${timing.className} ${row === 1 ? "stroke-link" : "stroke-rule-strong"}`}
              style={timing.style}
            />
          </g>
        );
      })}
      <circle cx="222" cy="68" r="3" className={`fill-link stroke-none ${running ? "pad-live" : ""}`} />
    </g>
  );
}

/** The bench: the component inside a frame, with the path a keyboard takes across it. */
function Test({ drawn, running }: Parts) {
  const timing = line(drawn, running, 160);
  return (
    <g>
      <rect x="8" y="10" width="224" height="112" rx="6" className="stroke-rule-strong" />
      <rect x="24" y="26" width="192" height="80" rx="4" className="stroke-rule-strong" />
      <rect x="40" y="42" width="72" height="12" rx="3" className="fill-rule-strong stroke-none" />
      <rect x="40" y="62" width="120" height="28" rx="4" className="stroke-rule-strong" />
      {[0, 1, 2].map((key) => (
        <rect key={key} x={48 + key * 26} y={70} width="18" height="12" rx="2" className="fill-paper-sunk stroke-rule-strong" />
      ))}
      <path
        d="M40 48 H112 M56 76 H100 M124 76 H196"
        pathLength={1}
        className={`${timing.className} stroke-link`}
        style={timing.style}
      />
      <circle cx="196" cy="76" r="4" className={`fill-link stroke-none ${running ? "pad-live" : ""}`} />
    </g>
  );
}

/** The file leaving: a page of code, and a copy of it moving off to the right. */
function Take({ drawn, running }: Parts) {
  const arrow = line(drawn, running, 620);
  return (
    <g>
      <rect x="14" y="18" width="104" height="96" rx="6" className="stroke-rule-strong" />
      {[0, 1, 2, 3, 4].map((row) => {
        const timing = line(drawn, running, 100 + row * 90);
        return (
          <line
            key={row}
            x1="28"
            y1={38 + row * 16}
            x2={row % 2 === 0 ? 96 : 76}
            y2={38 + row * 16}
            pathLength={1}
            className={`${timing.className} stroke-rule-strong`}
            style={timing.style}
          />
        );
      })}
      <path d="M124 66 H186" pathLength={1} className={`${arrow.className} stroke-link`} style={arrow.style} />
      <path d="M178 58 L188 66 L178 74" className="stroke-link" />
      <rect x="192" y="34" width="34" height="64" rx="4" className="fill-paper-sunk stroke-rule-strong" />
      <circle cx="209" cy="66" r="4" className={`fill-link stroke-none ${running ? "pad-live" : ""}`} />
    </g>
  );
}
