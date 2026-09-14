import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">
        Component Platform <span className="text-base font-normal text-neutral-600">(working name)</span>
      </h1>
      <p className="mt-3 text-neutral-700">
        Configure accessible UI components visually, then take them into your project as plain code — React +
        Tailwind or HTML/CSS/JS. No library to install.
      </p>
      <h2 className="mt-10 text-lg font-semibold">Components</h2>
      <ul className="mt-3 list-disc pl-5">
        <li>
          <Link href="/date-picker" className="underline">
            Date picker
          </Link>
        </li>
      </ul>
    </main>
  );
}
