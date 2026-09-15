// One options schema per component drives the editor panel, URL state and every exporter.

type Base = {
  key: string;
  label: string;
  group: "Content" | "Behaviour" | "Add-ons" | "Style";
  /** Only shown (in the editor) when another option has this value. */
  dependsOn?: { key: string; equals: string | boolean };
};

export type Option = Base &
  (
    | { type: "text"; default: string; maxLength: number }
    | { type: "boolean"; default: boolean }
    | { type: "select"; default: string; options: readonly string[] }
    | { type: "color"; default: string }
    | { type: "date"; default: string } // "YYYY-MM-DD" or "" for none
    | { type: "number"; default: number; min: number; max: number; step?: number }
  );

export type Schema = readonly Option[];

type ValueOf<O> = O extends { type: "select"; options: readonly (infer V)[] }
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

function coerce(option: Option, raw: string) {
  switch (option.type) {
    case "text":
      return raw.slice(0, option.maxLength);
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
  }
}

/** Only non-default values, so shared URLs stay short. */
export function toSearchParams(schema: Schema, config: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const option of schema) {
    if (config[option.key] !== option.default) params.set(option.key, String(config[option.key]));
  }
  return params;
}

export function isVisible(option: Option, config: Record<string, unknown>) {
  return !option.dependsOn || config[option.dependsOn.key] === option.dependsOn.equals;
}
