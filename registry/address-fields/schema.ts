import type { ConfigOf, Schema } from "@/lib/schema";
import type { AddressFieldsConfig } from "./react/address-fields";

export const addressFieldsSchema = [
  { key: "legend", label: "Heading", group: "Content", type: "text", default: "Delivery address", maxLength: 80 },
  { key: "hint", label: "Hint", description: "Leave it empty for none.", group: "Content", type: "text", default: "Your browser can fill this in for you.", maxLength: 140 },
  { key: "name", label: "Field name", description: "Each field sends this with its own part on the end.", group: "Behaviour", type: "text", default: "address", maxLength: 40 },
  {
    key: "countries",
    label: "Countries",
    description: "An empty region label means that country gets no region field.",
    group: "Content",
    type: "list",
    default: [
      { code: "GB", name: "United Kingdom", postcodeLabel: "Postcode", regionLabel: "County" },
      { code: "IE", name: "Ireland", postcodeLabel: "Eircode", regionLabel: "County" },
      { code: "US", name: "United States", postcodeLabel: "ZIP code", regionLabel: "State" },
      { code: "DE", name: "Germany", postcodeLabel: "Postal code", regionLabel: "" },
    ],
    fields: [
      { key: "code", label: "Code", maxLength: 2 },
      { key: "name", label: "Name", maxLength: 60 },
      { key: "postcodeLabel", label: "Postcode called", maxLength: 30 },
      { key: "regionLabel", label: "Region called", maxLength: 30 },
    ],
    maxItems: 40,
    itemLabel: "Country",
  },
  { key: "countryLabel", label: "Country label", group: "Content", type: "text", default: "Country", maxLength: 40 },
  { key: "line1Label", label: "First line label", group: "Content", type: "text", default: "Address line 1", maxLength: 40 },
  { key: "line2Label", label: "Second line label", group: "Content", type: "text", default: "Address line 2", maxLength: 40 },
  { key: "cityLabel", label: "Town label", group: "Content", type: "text", default: "Town or city", maxLength: 40 },
  { key: "showLine2", label: "Second address line", group: "Add-ons", type: "boolean", default: true },
  { key: "countryFirst", label: "Country first", description: "First, so the labels below it can already be right.", group: "Behaviour", type: "boolean", default: true },
  { key: "requireCore", label: "Require line 1, town and postcode", group: "Behaviour", type: "boolean", default: true },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or follow the device.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  { key: "accentColor", label: "Accent colour", group: "Style", type: "color", default: "#1d4ed8" },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof addressFieldsSchema>, AddressFieldsConfig> = true;
