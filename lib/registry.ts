// One place that knows every component: used by the registry route, the preview frame and the editor.
import { ctaSchema } from "@/registry/cta/schema";
import { datePickerSchema } from "@/registry/date-picker/schema";
import { formSchema } from "@/registry/form/schema";
import { headerSchema } from "@/registry/header/schema";
import { modalSchema } from "@/registry/modal/schema";
import { searchableSelectSchema } from "@/registry/searchable-select/schema";

export const registry = {
  "date-picker": {
    title: "Date picker",
    description: "Accessible date picker (WAI-ARIA dialog + grid) with single or range selection.",
    schema: datePickerSchema,
  },
  form: {
    title: "Form with validation",
    description: "A contact form with your rules and error messages that say how to fix each problem.",
    schema: formSchema,
  },
  header: {
    title: "Site header",
    description: "A site header with links, a call to action and a small-screen menu (APG disclosure navigation).",
    schema: headerSchema,
  },
  modal: {
    title: "Modal",
    description: "Accessible modal dialog (WAI-ARIA dialog pattern) with title, body and actions.",
    schema: modalSchema,
  },
  cta: {
    title: "CTA section",
    description: "A call-to-action section: heading, supporting text and actions. Plain HTML, no JavaScript.",
    schema: ctaSchema,
  },
  "searchable-select": {
    title: "Searchable select",
    description: "Accessible combobox (WAI-ARIA combobox with list autocomplete) that filters as you type.",
    schema: searchableSelectSchema,
  },
};

export type RegistrySlug = keyof typeof registry;
export const isRegistrySlug = (slug: string): slug is RegistrySlug => Object.hasOwn(registry, slug);
