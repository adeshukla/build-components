import Link from "next/link";

export const componentsList = [
  { slug: "date-picker", name: "Date picker", summary: "Single or range, typed input in your format, min/max dates." },
  { slug: "modal", name: "Modal", summary: "Accessible dialog with title, body, actions and close options." },
];

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold">
          Component Platform <span className="text-sm font-normal text-neutral-600">(working name)</span>
        </Link>
        <nav aria-label="Components">
          <ul className="flex flex-wrap gap-4 text-sm">
            {componentsList.map((component) => (
              <li key={component.slug}>
                <Link href={`/${component.slug}`} className="underline-offset-4 hover:underline">
                  {component.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
