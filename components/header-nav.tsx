"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#catalogue", label: "Catalogue" },
  { href: "/#how", label: "How it works" },
  { href: "/#tests", label: "Testing" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="sm:ml-auto">
      <ul className="-mx-3 flex flex-wrap items-center gap-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="relative flex items-baseline gap-2 rounded px-3 py-2 text-silk-muted transition-colors hover:bg-board-raised hover:text-silk"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
