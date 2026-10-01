"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { REEL_HEIGHT, REEL_WIDTH, reelScenes, type ReelMessage } from "@/lib/reel-scenes";
import { CommandMenu } from "@/registry/command-menu/react/command-menu";
import { DatePicker } from "@/registry/date-picker/react/date-picker";
import { Kanban } from "@/registry/kanban/react/kanban";
import { Otp } from "@/registry/otp/react/otp";
import { SearchableSelect } from "@/registry/searchable-select/react/searchable-select";
import { Toast } from "@/registry/toast/react/toast";

/*
 * The home page reel (D79): real parts from the catalogue, played by a script like a launch film, in a
 * frame on the home page (components/hero-reel.tsx).
 *
 * A script that moves focus inside a frame takes it from the page around it, in every browser, even when
 * the frame is inert. So in here nothing really takes focus: focus() only marks the element, which is drawn
 * with a ring, and a modal dialog opens without the browser's focusing step (drawn with its backdrop by the
 * reel's own CSS). A sandboxed frame would do it too, but Next's dev server refuses its requests.
 *
 * Here: the parts, a gliding cursor and click ripples. The camera (zooming in on what matters), the title
 * card and the key caption are the page's, outside, so the captions never zoom or crop.
 */

if (typeof window !== "undefined") {
  HTMLElement.prototype.focus = function (this: HTMLElement) {
    document.querySelector("[data-reel-focus]")?.removeAttribute("data-reel-focus");
    this.setAttribute("data-reel-focus", "");
  };
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}

const parts: Record<string, ReactNode> = {
  "searchable-select": <SearchableSelect />,
  "date-picker": <DatePicker />,
  kanban: <Kanban />,
  otp: <Otp />,
  toast: <Toast />,
  "command-menu": <CommandMenu />,
};

class Stop extends Error {}

const ease = "cubic-bezier(0.65, 0, 0.35, 1)";

function post(message: ReelMessage) {
  window.parent?.postMessage(message, "*");
}

/** Sets a React-controlled field's value the way typing does. */
function setValue(field: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

const byText = (selector: string, text: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.textContent?.trim() === text);
const byStart = (selector: string, text: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.textContent?.trim().startsWith(text));
const byLabel = (start: string) => document.querySelector<HTMLElement>(`[aria-label^="${start}"]`);

type Director = ReturnType<typeof director>;

function director(control: { paused: boolean }, run: { stopped: boolean }, cursor: HTMLDivElement) {
  let at = { x: REEL_WIDTH - 160, y: REEL_HEIGHT - 120 };

  async function wait(ms: number) {
    let left = ms;
    while (left > 0) {
      if (run.stopped) throw new Stop();
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!control.paused) left -= 50;
    }
    if (run.stopped) throw new Stop();
  }

  function centre(el: Element) {
    const box = el.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }

  async function moveTo(el: Element | null | undefined, ms = 750) {
    if (!el) return;
    const to = centre(el);
    cursor.animate([{ transform: `translate(${at.x}px, ${at.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }], {
      duration: ms,
      easing: ease,
      fill: "forwards",
    });
    at = to;
    await wait(ms + 80);
  }

  async function click(el: HTMLElement | null | undefined) {
    if (!el) return;
    await moveTo(el);
    cursor.firstElementChild?.animate([{ scale: 1 }, { scale: 0.82 }, { scale: 1 }], { duration: 260, easing: ease });
    const ripple = document.createElement("span");
    ripple.className = "pointer-events-none fixed z-[60] size-10 -translate-1/2 rounded-full border-2 border-[#c2410c]";
    Object.assign(ripple.style, { left: `${at.x}px`, top: `${at.y}px` });
    document.body.append(ripple);
    ripple.animate([{ scale: 0.3, opacity: 0.9 }, { scale: 1.8, opacity: 0 }], { duration: 600, easing: "ease-out" }).finished.then(
      () => ripple.remove(),
      () => ripple.remove(),
    );
    await wait(140);
    el.click();
    await wait(380);
  }

  const showKey = (label: string) => post({ type: "reel-key", label });
  const hideKey = () => post({ type: "reel-key", label: null });

  async function press(target: EventTarget | null | undefined, key: string, label = key, init: KeyboardEventInit = {}) {
    if (!target) return;
    showKey(label);
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true, ...init }));
    await wait(560);
    hideKey();
  }

  async function type(field: HTMLInputElement | null | undefined, text: string) {
    if (!field) return;
    await moveTo(field);
    showKey(`Type “${text}”`);
    for (const letter of text) {
      setValue(field, field.value + letter);
      await wait(170);
    }
    await wait(300);
    hideKey();
  }

  /** Tells the page where to point the camera: an element and how far in, or the whole frame. */
  async function camera(el: Element | null | undefined, zoom = 1, ms = 1000) {
    const box = el?.getBoundingClientRect();
    post({
      type: "reel-camera",
      x: box ? box.left : 0,
      y: box ? box.top : 0,
      width: box ? box.width : REEL_WIDTH,
      height: box ? box.height : REEL_HEIGHT,
      zoom: box ? zoom : 1,
      duration: ms,
    });
    await wait(ms * 0.6);
  }

  return { wait, moveTo, click, press, type, camera };
}

/** Each scene: what a person would do, in the order they would do it. */
const scripts: Record<string, (d: Director) => Promise<void>> = {
  "searchable-select": async (d) => {
    const field = document.querySelector<HTMLInputElement>('[role="combobox"]');
    await d.camera(field?.closest("section, div"), 1.5);
    await d.type(field, "uni");
    await d.camera(document.querySelector('[role="listbox"]') ?? field, 1.35, 800);
    await d.press(field, "ArrowDown", "↓");
    await d.press(field, "ArrowDown", "↓");
    await d.press(field, "Enter");
    await d.camera(field, 1.6, 800);
  },
  "date-picker": async (d) => {
    const open = byLabel("Choose date");
    await d.camera(open?.closest("div"), 1.6);
    await d.click(open);
    await d.wait(300);
    await d.camera(document.querySelector("dialog[open]"), 1.25, 900);
    await d.click(byLabel("Next month"));
    // A longer month can flip the calendar above the field: follow it.
    await d.camera(document.querySelector("dialog[open]"), 1.2, 700);
    await d.click(byText('[role="gridcell"]', "14"));
    await d.wait(200);
    await d.camera(document.querySelector("input"), 1.7, 900);
  },
  kanban: async (d) => {
    await d.camera(document.querySelector('[aria-label="Refit board"]'), 1.1);
    await d.click(byStart("button", "Move Sand the deck to In progress"));
    await d.wait(400);
    await d.click(byStart("button", "Move Sand the deck to Done"));
    await d.wait(400);
    await d.click(byStart("button", "Move Order sailcloth to In progress"));
  },
  otp: async (d) => {
    const boxes = [...document.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')];
    await d.camera(boxes[0]?.parentElement, 2);
    for (const [index, digit] of [..."482915"].entries()) {
      const box = boxes[index];
      if (!box) break;
      await d.moveTo(box, 260);
      setValue(box, digit);
      await d.wait(140);
    }
  },
  toast: async (d) => {
    await d.click(byText("button", "Save changes"));
    await d.camera(document.querySelector('[aria-label="Notifications"]') ?? document.body, 1.3, 900);
    await d.click(byText("button", "Save changes"));
    await d.click(byText("button", "Save without a connection"));
    await d.wait(600);
  },
  "command-menu": async (d) => {
    await d.press(document, "k", "Ctrl K", { ctrlKey: true });
    await d.wait(250);
    const dialog = document.querySelector("dialog[open]");
    await d.camera(dialog, 1.3, 900);
    const field = dialog?.querySelector<HTMLInputElement>("input");
    for (let step = 0; step < 3; step++) await d.press(field, "ArrowDown", "↓");
    // Escape on a real modal dialog is the browser's cancel event; this one is only drawn as modal.
    await d.press(field, "Escape", "Esc");
    dialog?.dispatchEvent(new Event("cancel", { cancelable: true }));
  },
};

export function MotionReel() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  // Shared by every run of a scene; each run has its own stop flag, so a run that was cleaned up (or the
  // second mount React makes in development) can never carry on beside the next.
  const control = useRef({ paused: false, run: { stopped: false }, goto: -1 });

  // The page outside pauses the reel, plays it, and jumps to a scene.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      if (event.data?.type === "reel-pause") control.current.paused = Boolean(event.data.paused);
      if (event.data?.type === "reel-goto" && typeof event.data.index === "number") {
        control.current.goto = event.data.index;
        control.current.run.stopped = true;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const scene = reelScenes[index];
    const state = control.current;
    const run = { stopped: false };
    state.run = run;
    const d = director(state, run, cursorRef.current!);
    post({ type: "reel-scene", index });
    let timer = 0;
    (async () => {
      try {
        await d.wait(500);
        await scripts[scene.slug](d);
        await d.wait(1100);
        await d.camera(null, 1, 800);
        setLeaving(true);
        await d.wait(450);
        setLeaving(false);
        setIndex((index + 1) % reelScenes.length);
      } catch (error) {
        if (!(error instanceof Stop)) throw error;
        // Asked for another scene, or unmounted.
        if (state.goto >= 0) {
          const next = state.goto;
          state.goto = -1;
          timer = window.setTimeout(() => {
            setLeaving(false);
            setIndex(next);
          }, 0);
        }
      }
    })();
    return () => {
      run.stopped = true;
      window.clearTimeout(timer);
    };
  }, [index]);

  const scene = reelScenes[index];
  return (
    <div
      className="reel-stage relative overflow-hidden"
      style={{
        width: REEL_WIDTH,
        height: REEL_HEIGHT,
        background:
          "radial-gradient(60% 70% at 15% 10%, #fde7d9, transparent 70%), radial-gradient(50% 60% at 90% 80%, #f6dde6, transparent 70%), #f5f2ec",
      }}
    >
      <div
        key={index}
        className={`absolute inset-0 grid place-items-center p-16 ${leaving ? "reel-leave" : "reel-enter"}`}
      >
        <div className="max-w-[1080px] rounded-[28px] bg-white p-10 text-[#1c1a17] shadow-[0_40px_80px_-30px_rgb(60_40_20/0.35),0_2px_6px_rgb(60_40_20/0.08)]">
          {parts[scene.slug]}
        </div>
      </div>

      <div ref={cursorRef} className="pointer-events-none fixed top-0 left-0 z-[70]" style={{ transform: `translate(${REEL_WIDTH - 160}px, ${REEL_HEIGHT - 120}px)` }}>
        <svg width="30" height="30" viewBox="0 0 24 24" className="-translate-x-1 -translate-y-1 drop-shadow-[0_3px_6px_rgb(0_0_0/0.35)]">
          <path d="M4 2.5 20 12l-7.2 1.6L9 20.5z" fill="#1c1a17" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
