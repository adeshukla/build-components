// One options schema per component drives the editor panel, URL state and every exporter.

type Base = {
  key: string;
  label: string;
  group: "Content" | "Behaviour" | "Add-ons" | "Style";
  /** One plain sentence shown under the control: what the option does. */
  description?: string;
  /** Only shown (in the editor) when another option has this value. */
  dependsOn?: { key: string; equals: string | boolean };
};

type ListField = { key: string; label: string; maxLength: number; format?: "url" };

export type Option = Base &
  (
    | { type: "text"; default: string; maxLength: number; format?: "url" }
    | { type: "boolean"; default: boolean }
    | { type: "select"; default: string; options: readonly string[] }
    | { type: "color"; default: string }
    | { type: "date"; default: string } // "YYYY-MM-DD" or "" for none
    | { type: "number"; default: number; min: number; max: number; step?: number }
    | {
        type: "list";
        default: readonly Readonly<Record<string, string>>[];
        fields: readonly ListField[];
        maxItems: number;
        /** Singular name for one item, e.g. "Link". */
        itemLabel: string;
      }
  );

export type Schema = readonly Option[];

type ValueOf<O> = O extends { type: "list"; fields: readonly { key: infer K extends string }[] }
  ? Record<K, string>[]
  : O extends { type: "select"; options: readonly (infer V)[] }
    ? V
    : O extends { type: "boolean" }
      ? boolean
      : O extends { type: "number" }
        ? number
        : string;

export type ConfigOf<S extends Schema> = { [O in S[number] as O["key"]]: ValueOf<O> };

/** Builds a config from untrusted query params; anything invalid falls back to the default. */
export function parseConfig<S extends Schema>(schema: S, params: URLSearchParams): ConfigOf<S> {
  const config: Record<string, unknown> = {};
  for (const option of schema) {
    const raw = params.get(option.key);
    config[option.key] = raw === null ? option.default : coerce(option, raw);
  }
  return config as ConfigOf<S>;
}

// Links from a shared URL must never run script: allow relative, fragment, http(s), mailto and tel only.
const safeUrl = (value: string) => (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#");

function coerce(option: Option, raw: string) {
  switch (option.type) {
    case "text": {
      const text = raw.slice(0, option.maxLength);
      return option.format === "url" ? safeUrl(text) : text;
    }
    case "boolean":
      return raw === "true" ? true : raw === "false" ? false : option.default;
    case "select":
      return option.options.includes(raw) ? raw : option.default;
    case "color":
      return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : option.default;
    case "date":
      return raw === "" || /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : option.default;
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? Math.min(option.max, Math.max(option.min, n)) : option.default;
    }
    case "list": {
      try {
        const items: unknown = JSON.parse(raw);
        if (!Array.isArray(items) || items.length === 0) return option.default;
        return items.slice(0, option.maxItems).map((item) =>
          Object.fromEntries(
            option.fields.map((field) => {
              const value = (item as Record<string, unknown> | null)?.[field.key];
              const text = typeof value === "string" ? value.slice(0, field.maxLength) : "";
              return [field.key, field.format === "url" ? safeUrl(text) : text];
            }),
          ),
        );
      } catch {
        return option.default;
      }
    }
  }
}

/** Lists compare by content; everything else by value. */
export function isDefault(option: Option, value: unknown) {
  return option.type === "list" ? JSON.stringify(value) === JSON.stringify(option.default) : value === option.default;
}

/** Only non-default values, so shared URLs stay short. */
export function toSearchParams(schema: Schema, config: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const option of schema) {
    const value = config[option.key];
    if (!isDefault(option, value)) params.set(option.key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  return params;
}

export function isVisible(option: Option, config: Record<string, unknown>) {
  return !option.dependsOn || config[option.dependsOn.key] === option.dependsOn.equals;
}
