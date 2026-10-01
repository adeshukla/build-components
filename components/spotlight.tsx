"use client";

import { useEffect } from "react";

/*
 * The spotlight (D82). The light behind the page (.site-follow) eases toward the pointer, or the finger
 * on a touch screen, by transform only. A spotlit card (.spot) is told where the pointer is, so its border
 * lights there. A touch screen has no hover, so a card also lights while a finger is on it, and as it
 * crosses the middle of the screen while scrolling. With reduced motion the light stays where it is.
 */
export function Spotlight() {
  useEffect(() => {
    const light = document.querySelector<HTMLElement>(".site-follow");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(hover: none)");
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.35;
    let atX = x;
    let atY = y;
    let frame = 0;
    let lit: Element[] = [];

    function step() {
      frame = 0;
      atX += (x - atX) * 0.12;
      atY += (y - atY) * 0.12;
      if (light) light.style.transform = `translate3d(${atX}px, ${atY}px, 0)`;
      if (Math.abs(x - atX) + Math.abs(y - atY) > 0.5) frame = requestAnimationFrame(step);
    }

    function aim(toX: number, toY: number) {
      if (still.matches) return;
      x = toX;
      y = toY;
      if (!frame) frame = requestAnimationFrame(step);
    }

    /** Points a card's light at a spot on screen. */
    function point(card: Element, atClientX: number, atClientY: number) {
      const box = card.getBoundingClientRect();
      (card as HTMLElement).style.setProperty("--cx", `${atClientX - box.left}px`);
      (card as HTMLElement).style.setProperty("--cy", `${atClientY - box.top}px`);
    }

    function lightUp(cards: Element[]) {
      for (const card of lit) if (!cards.includes(card)) card.classList.remove("is-lit");
      for (const card of cards) card.classList.add("is-lit");
      lit = cards;
    }

    function onPointer(event: PointerEvent) {
      aim(event.clientX, event.clientY);
      const card = (event.target as Element | null)?.closest?.(".spot");
      if (card) point(card, event.clientX, event.clientY);
    }

    function onTouch(event: TouchEvent) {
      const finger = event.touches[0];
      if (!finger) return;
      aim(finger.clientX, finger.clientY);
      const card = (event.target as Element | null)?.closest?.(".spot");
      if (card) {
        point(card, finger.clientX, finger.clientY);
        lightUp([card]);
      }
    }

    // While scrolling on a touch screen: the cards across the middle of the screen light up.
    let scrollFrame = 0;
    function onScroll() {
      if (!touch.matches || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const middle = window.innerHeight / 2;
        const cards = new Set<Element>();
        for (const across of [0.25, 0.75]) {
          const card = document.elementFromPoint(window.innerWidth * across, middle)?.closest(".spot");
          if (card) {
            point(card, window.innerWidth * across, middle);
            cards.add(card);
          }
        }
        lightUp([...cards]);
      });
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
