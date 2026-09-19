import type { Metadata } from "next";
import { PartHeader } from "@/components/part-header";
import { cartSchema } from "@/registry/cart/schema";
import { parseConfig } from "@/lib/schema";
import { readComponentSources } from "@/lib/sources";
import { CartEditor } from "./editor";

export const metadata: Metadata = { title: "Basket: configure, test and export" };

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }

  return (
    <main className="flex-1">
      <PartHeader slug="cart" />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <CartEditor initialConfig={parseConfig(cartSchema, query)} sources={readComponentSources("cart")} />
      </div>
    </main>
  );
}
