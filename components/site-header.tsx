import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="glass relative z-20 border-x-0 border-t-0">
      <div className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 sm:gap-x-6 sm:py-3">
        <Link href="/" className="group flex items-center gap-2.5 rounded-sm sm:gap-3">
          <LogoMark className="size-8 sm:size-9" />
          <span className="font-display text-2xl leading-none sm:text-[1.75rem]">Build Components</span>
        </Link>
        <HeaderNav />
        <div className="hidden sm:flex">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Logo mark: three parts on a shelf. They shuffle along on hover. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={className}>
      <rect x="1" y="1" width="38" height="38" rx="11" className="fill-accent" />
      {[
        [9, 10, 22],
        [9, 18, 14],
        [9, 26, 18],
      ].map(([x, y, width], i) => (
        <rect
          key={y}
          x={x}
          y={y}
          width={width}
          height="4.5"
          rx="2.25"
          className="fill-on-accent transition-transform duration-500 ease-spring group-hover:translate-x-[3px]"
          style={{ transitionDelay: `${i * 60}ms`, opacity: 1 - i * 0.2 }}
        />
      ))}
    </svg>
  );
}
