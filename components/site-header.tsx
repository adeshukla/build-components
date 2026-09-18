import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="on-board relative z-20 border-b border-board-line bg-board text-silk">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 rounded-sm">
          <ChipMark />
          <span className="font-display text-2xl leading-none font-semibold tracking-wide uppercase">
            Build Components
          </span>
        </Link>
        <HeaderNav />
        <ThemeToggle />
      </div>
    </header>
  );
}

/** Logo mark: an IC package with gold pins. The pins light up on hover. */
export function ChipMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={className}>
      <rect x="9" y="6" width="22" height="28" rx="3" className="fill-board-raised stroke-silk" strokeWidth="2" />
      <path d="M17 6a3 3 0 0 0 6 0" className="fill-none stroke-silk" strokeWidth="2" />
      <circle cx="14.5" cy="12" r="1.6" className="fill-pad" />
      {[12, 20, 28].map((y, i) => (
        <g
          key={y}
          className="fill-pad transition-[fill] duration-300 group-hover:fill-pad-strong"
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <rect x="2" y={y - 1.5} width="7" height="3" rx="1" />
          <rect x="31" y={y - 1.5} width="7" height="3" rx="1" />
        </g>
      ))}
    </svg>
  );
}
