import type { ConfigOf, Schema } from "@/lib/schema";
import type { StepperConfig } from "./react/stepper";

export const stepperSchema = [
  {
    key: "label",
    label: "Flow name",
    description: "What this run of steps is for, e.g. Checkout. Screen readers read it first.",
    group: "Content",
    type: "text",
    default: "Checkout",
    maxLength: 40,
  },
  {
    key: "steps",
    label: "Steps",
    description: "In order. A link is only used for steps already done, so nobody jumps ahead.",
    group: "Content",
    type: "list",
    default: [
      { label: "Basket", detail: "3 items", href: "/basket" },
      { label: "Delivery", detail: "Where it goes", href: "/delivery" },
      { label: "Payment", detail: "How you pay", href: "" },
      { label: "Confirm", detail: "Check and send", href: "" },
    ],
    fields: [
      { key: "label", label: "Step", maxLength: 40 },
      { key: "detail", label: "Detail", maxLength: 60 },
      { key: "href", label: "Link, once it is done", maxLength: 200, format: "url" },
    ],
    maxItems: 8,
    itemLabel: "Step",
  },
  {
    key: "current",
    label: "Current step",
    description: "Which step the visitor is on. Everything before it counts as done.",
    group: "Behaviour",
    type: "number",
    default: 3,
    min: 1,
    max: 8,
  },
  {
    key: "linkDone",
    label: "Link finished steps",
    description: "Lets people go back to a step they have already completed.",
    group: "Behaviour",
    type: "boolean",
    default: true,
  },
  {
    key: "orientation",
    label: "Direction",
    description: "Along the page, or down the side. Either way it stacks on a phone.",
    group: "Behaviour",
    type: "select",
    default: "horizontal",
    options: ["horizontal", "vertical"],
  },
  {
    key: "summary",
    label: "Step count",
    description: "Reads “Step 3 of 4” above the run.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "details",
    label: "Step details",
    description: "A line under each step name.",
    group: "Add-ons",
    type: "boolean",
    default: true,
  },
  {
    key: "marker",
    label: "Marker",
    description: "A number or a dot before each step. Finished steps always show a tick.",
    group: "Style",
    type: "select",
    default: "number",
    options: ["number", "dot"],
  },
  {
    key: "theme",
    label: "Theme",
    description: "Light, dark, or whatever the visitor's device is set to.",
    group: "Style",
    type: "select",
    default: "light",
    options: ["light", "dark", "system"],
  },
  {
    key: "accentColor",
    label: "Accent colour",
    description: "The current step. Its text colour adjusts for contrast.",
    group: "Style",
    type: "color",
    default: "#2563eb",
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof stepperSchema>, StepperConfig> = true;
