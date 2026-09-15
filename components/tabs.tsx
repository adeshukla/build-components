"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

type Tab = { id: string; label: ReactNode };

/** WAI-ARIA APG tabs with automatic activation: arrows, Home and End move and select. */
export function TabList({
  label,
  idBase,
  tabs,
  value,
  onChange,
}: {
  label: string;
  idBase: string;
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, tabs.findIndex((tab) => tab.id === value));

  function onKeyDown(event: KeyboardEvent) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative grid border-b border-rule"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(element) => {
            refs.current[i] = element;
          }}
          type="button"
          role="tab"
          id={`${idBase}-tab-${tab.id}`}
          aria-selected={tab.id === value}
          aria-controls={`${idBase}-panel-${tab.id}`}
          tabIndex={tab.id === value ? 0 : -1}
          onClick={() => onChange(tab.id)}
          className="flex min-w-0 cursor-pointer items-center justify-center gap-1.5 px-2 py-3 text-sm font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink aria-selected:text-ink"
        >
          {tab.label}
        </button>
      ))}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-0.5 bg-board transition-transform duration-500 ease-out-expo"
        style={{ width: `${100 / tabs.length}%`, transform: `translateX(${index * 100}%)` }}
      />
    </div>
  );
}

export function tabPanelProps(idBase: string, id: string) {
  return {
    role: "tabpanel",
    id: `${idBase}-panel-${id}`,
    "aria-labelledby": `${idBase}-tab-${id}`,
    tabIndex: 0,
  } as const;
}
