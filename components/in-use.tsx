"use client";

import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import { partBySlug } from "@/lib/parts";

import { AddressFields } from "@/registry/address-fields/react/address-fields";
import { CardFields } from "@/registry/card-fields/react/card-fields";
import { CircularProgress } from "@/registry/circular-progress/react/circular-progress";
import { Faq } from "@/registry/faq/react/faq";
import { FeatureGrid } from "@/registry/feature-grid/react/feature-grid";
import { HelpHint } from "@/registry/help-hint/react/help-hint";
import { Hero } from "@/registry/hero/react/hero";
import { InvoiceSummary } from "@/registry/invoice-summary/react/invoice-summary";
import { LoadingButton } from "@/registry/loading-button/react/loading-button";
import { LogoWall } from "@/registry/logo-wall/react/logo-wall";
import { Newsletter } from "@/registry/newsletter/react/newsletter";
import { NotificationList } from "@/registry/notification-list/react/notification-list";
import { OrderTracker } from "@/registry/order-tracker/react/order-tracker";
import { RowActions } from "@/registry/row-actions/react/row-actions";
import { Sidebar } from "@/registry/sidebar/react/sidebar";
import { SplitFeature } from "@/registry/split-feature/react/split-feature";
import { StatComparison } from "@/registry/stat-comparison/react/stat-comparison";
import { StatsTiles } from "@/registry/stats-tiles/react/stats-tiles";

/**
 * One part of a composed screen, with the X-ray label that names it.
 *
 * The label is a link to the part's own page, so the screen doubles as a way in. It is drawn over the
 * part rather than around it, so turning the X-ray on never changes the layout underneath — which is the
 * whole point: what you see with it off is what the parts actually do together.
 */
function Wrapped({ slug, xray, children }: { slug: string; xray: boolean; children: ReactNode }) {
  const part = partBySlug(slug);
  return (
    <div data-part={slug} className={`relative ${xray ? "outline-2 outline-offset-2 outline-dashed outline-board" : ""}`}>
      {xray && (
        <Link
          href={`/${slug}`}
          className="absolute -top-3 left-2 z-20 inline-flex min-h-6 items-center gap-1.5 rounded-full bg-board px-2.5 py-0.5 font-mono text-[0.6875rem] text-silk no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: part.accent }} />
          {part.name}
        </Link>
      )}
      {children}
    </div>
  );
}

type Screen = { id: string; tab: string; heading: string; blurb: string; parts: string[]; render: (xray: boolean) => ReactNode };

const screens: Screen[] = [
  {
    id: "product",
    tab: "A product page",
    heading: "A product page, seven parts deep",
    blurb:
      "Hero, logo wall, split feature, feature grid, comparison, FAQ, sign-up. Every one of them is the part as it comes, with its own default content — nothing here has been restyled to fit.",
    parts: ["hero", "logo-wall", "split-feature", "feature-grid", "stat-comparison", "faq", "newsletter"],
    render: (xray) => (
      <div className="grid gap-10">
        <Wrapped slug="hero" xray={xray}>
          <Hero />
        </Wrapped>
        <Wrapped slug="logo-wall" xray={xray}>
          <LogoWall />
        </Wrapped>
        <Wrapped slug="split-feature" xray={xray}>
          <SplitFeature />
        </Wrapped>
        <Wrapped slug="feature-grid" xray={xray}>
          <FeatureGrid />
        </Wrapped>
        <Wrapped slug="stat-comparison" xray={xray}>
          <StatComparison />
        </Wrapped>
        <Wrapped slug="faq" xray={xray}>
          <Faq />
        </Wrapped>
        <Wrapped slug="newsletter" xray={xray}>
          <Newsletter />
        </Wrapped>
      </div>
    ),
  },
  {
    id: "checkout",
    tab: "A checkout",
    heading: "A checkout, five parts deep",
    blurb:
      "The summary adds up in whole pennies, the address block relabels itself per country, the card fields carry their autofill tokens, and the button keeps its focus while it works.",
    parts: ["invoice-summary", "address-fields", "help-hint", "card-fields", "loading-button"],
    render: (xray) => (
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="grid gap-10">
          <Wrapped slug="address-fields" xray={xray}>
            <AddressFields />
          </Wrapped>
          <Wrapped slug="help-hint" xray={xray}>
            <HelpHint />
          </Wrapped>
          <Wrapped slug="card-fields" xray={xray}>
            <CardFields />
          </Wrapped>
          <Wrapped slug="loading-button" xray={xray}>
            <LoadingButton />
          </Wrapped>
        </div>
        <Wrapped slug="invoice-summary" xray={xray}>
          <InvoiceSummary />
        </Wrapped>
      </div>
    ),
  },
  {
    id: "admin",
    tab: "An admin screen",
    heading: "An admin screen, six parts deep",
    blurb:
      "Sidebar, tiles, a table whose every row button is named with its row, a notification list that keeps its count in step, a ring that never invents a number, and an order's progress said in words.",
    parts: ["sidebar", "stats-tiles", "row-actions", "notification-list", "circular-progress", "order-tracker"],
    render: (xray) => (
      <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:items-start">
        <Wrapped slug="sidebar" xray={xray}>
          <Sidebar />
        </Wrapped>
        <div className="grid gap-10">
          <Wrapped slug="stats-tiles" xray={xray}>
            <StatsTiles />
          </Wrapped>
          <Wrapped slug="row-actions" xray={xray}>
            <RowActions />
          </Wrapped>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <Wrapped slug="notification-list" xray={xray}>
              <NotificationList />
            </Wrapped>
            <div className="grid gap-10">
              <Wrapped slug="circular-progress" xray={xray}>
                <CircularProgress />
              </Wrapped>
              <Wrapped slug="order-tracker" xray={xray}>
                <OrderTracker />
              </Wrapped>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

/**
 * Three screens built out of the catalogue, with an X-ray that names every part in the one you are
 * looking at. Only the chosen screen is rendered: these are real components, not pictures of them, and
 * three screens' worth of live parts on one page would be a waste of everyone's battery.
 */
export function InUse() {
  const id = useId();
  const [at, setAt] = useState(0);
  const [xray, setXray] = useState(false);
  const tabs = useRef<HTMLDivElement | null>(null);

  const move = (to: number) => {
    const next = (to + screens.length) % screens.length;
    setAt(next);
    tabs.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  const screen = screens[at];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* A tablist, so the three screens are one stop and the arrows move between them. */}
        <div ref={tabs} role="tablist" aria-label="Screens built from the catalogue" className="flex flex-wrap gap-2">
          {screens.map((one, index) => (
            <button
              key={one.id}
              type="button"
              role="tab"
              id={`${id}-tab-${one.id}`}
              aria-selected={index === at}
              aria-controls={`${id}-panel-${one.id}`}
              tabIndex={index === at ? 0 : -1}
              onClick={() => setAt(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  move(at + 1);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  move(at - 1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  move(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  move(screens.length - 1);
                }
              }}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board ${
                index === at
                  ? "border-board bg-board text-silk"
                  : "border-rule-strong text-ink-muted hover:text-ink"
              }`}
            >
              {one.tab}
            </button>
          ))}
        </div>

        {/*
          A real switch, not a styled div: the state is the checkbox's own, so it is announced without
          anything being wired up by hand.
        */}
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            role="switch"
            checked={xray}
            onChange={(event) => setXray(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-6 w-11 shrink-0 rounded-full border border-rule-strong bg-paper-sunk transition-colors peer-checked:border-board peer-checked:bg-board peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-board after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-ink after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-pad"
          />
          X-ray: name every part
        </label>
      </div>

      {screens.map((one, index) => (
        <div
          key={one.id}
          role="tabpanel"
          id={`${id}-panel-${one.id}`}
          aria-labelledby={`${id}-tab-${one.id}`}
          hidden={index !== at}
          // A tabpanel takes focus so Tab from the tabs lands inside it rather than back in the page.
          tabIndex={0}
          className="mt-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-board"
        >
          {index === at && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
                <h3 className="font-display text-2xl leading-tight font-bold uppercase sm:text-3xl">{screen.heading}</h3>
                <p className="max-w-lg text-sm text-pretty text-ink-muted">{screen.blurb}</p>
              </div>

              <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
                {screen.parts.map((slug) => (
                  <Link key={slug} href={`/${slug}`} className="underline-offset-2 hover:underline">
                    {partBySlug(slug).name}
                  </Link>
                ))}
              </p>

              <div className="mt-8 rounded-xl border border-rule bg-paper p-4 sm:p-6">{one.render(xray)}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
