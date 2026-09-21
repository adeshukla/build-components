import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
      <p className="font-mono text-sm text-ink-muted uppercase">Error 404</p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold uppercase sm:text-7xl">Part not found</h1>
      <p className="mt-4 text-lg text-pretty text-ink-muted">
        There is nothing at this address. It may have moved, or the link may be mistyped.
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/#catalogue" className="btn-ink">
          Browse the catalogue
        </Link>
      </p>
    </main>
  );
}
