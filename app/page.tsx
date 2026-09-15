import Link from "next/link";
import { componentsList } from "@/components/site-header";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Configure it. Test it. Take the code.</h1>
      <p className="mt-3 max-w-2xl text-neutral-700">
        Accessible UI components you set up visually, then take into your project as plain code — React + Tailwind
        or HTML/CSS/JS. No library to install.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Components</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {componentsList.map((component) => (
          <li key={component.slug} className="rounded-lg border border-neutral-300 p-5 hover:border-neutral-500">
            <h3 className="font-semibold">
              <Link href={`/${component.slug}`} className="underline-offset-4 hover:underline">
                {component.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-neutral-700">{component.summary}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">How to test a component</h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-neutral-700">
        <li>Change options on the left; the live test updates straight away.</li>
        <li>Switch between React + Tailwind and HTML/CSS/JS: both are the exported code, not a mock-up.</li>
        <li>Try the phone and tablet widths, and submit the test form to see the real form values.</li>
        <li>Work through the manual checklist with a keyboard and a screen reader.</li>
      </ol>
    </main>
  );
}
