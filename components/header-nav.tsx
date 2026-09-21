"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/#catalogue", label: "Catalogue" },
  { href: "/#how", label: "How it works" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/about", label: "About" },
];

/**
 * The site links. On a phone they sit behind a menu button, so the header stays one row;
 * from 640px up they are always shown.
 */
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const list = (
    <ul className="flex flex-col gap-1 text-sm sm:-mx-3 sm:flex-row sm:items-center">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={pathname === link.href ? "page" : undefined}
            className="block rounded px-3 py-2 text-silk-muted transition-colors hover:bg-board-raised hover:text-silk"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={rootRef} className="contents">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
        className="ml-auto flex items-center gap-2 rounded-md border border-board-line px-2.5 py-1.5 text-sm text-silk transition-colors hover:bg-board-raised sm:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
        Menu
      </button>

      <nav aria-label="Main" className="hidden sm:ml-auto sm:block">
        {list}
      </nav>
      {/* On a phone the theme control lives in here, so the header itself stays one row. */}
      <div id="site-menu" hidden={!open} className="w-full pb-2 sm:hidden">
        <nav aria-label="Main">{list}</nav>
        <div className="mt-2 border-t border-board-line pt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
