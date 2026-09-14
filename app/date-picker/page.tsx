import type { Metadata } from "next";
import { parseConfig } from "@/lib/schema";
import { readSource } from "@/lib/sources";
import { datePickerSchema } from "@/registry/date-picker/schema";
import { DatePickerEditor } from "./editor";

export const metadata: Metadata = { title: "Date picker" };

export default async function DatePickerPage({ searchParams }: PageProps<"/date-picker">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Date picker</h1>
      <p className="mb-8 text-neutral-700">
        WAI-ARIA dialog + grid pattern. Configure it, then copy the code or install it by URL.
      </p>
      <DatePickerEditor
        initialConfig={parseConfig(datePickerSchema, query)}
        sources={{
          react: readSource("date-picker/react/date-picker.tsx"),
          html: readSource("date-picker/vanilla/date-picker.html"),
          css: readSource("date-picker/vanilla/date-picker.css"),
          js: readSource("date-picker/vanilla/date-picker.js"),
        }}
      />
    </main>
  );
}
