"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { inStock } from "@/lib/parts";

export function HeaderNav() {
  const pathname = usePathname();
  const links = [
    ...inStock.map((part) => ({ href: `/${part.slug}`, label: part.name, code: part.partNumber })),
    { href: "/#catalogue", label: "All parts", code: "" },
  ];

  return (
    <nav aria-label="Main" className="sm:ml-auto">
      <ul className="-mx-3 flex flex-wrap items-center gap-1 text-sm">
        {links.map((link) => {
          const current = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className="relative flex items-baseline gap-2 rounded px-3 py-2 text-silk-muted transition-colors hover:bg-board-raised hover:text-silk aria-[current=page]:text-silk"
              >
                {link.code && <span className="hidden font-mono text-xs text-pad md:inline">{link.code}</span>}
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-[0.8125rem] h-0.5 origin-left bg-pad transition-transform duration-500 ease-out-expo ${current ? "scale-x-100" : "scale-x-0"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
