import { dictionary } from "@/lib/dictionary";
import type { Option } from "@/lib/schema";

/*
 * Languages (D94). Every word a part says by itself is an option in its Words group, with English as
 * the default, so a part speaks whatever language its options are written in, and the file you take
 * holds only the words you chose. The editor's Language picker fills the Words options in from the
 * dictionary below; anything the dictionary lacks stays English, and e2e/languages.spec.ts fails on it.
 *
 * Words with something put in them say where: "Clear {noun}", "{count} results". Counted phrases come in
 * two options, one and other: enough for these languages' everyday counts, not every plural rule.
 *
 * The translations were written without a native speaker's check: [TODO: have each language reviewed].
 */

export const languages = [
  { id: "en", name: "English", dir: "ltr" },
  { id: "es", name: "Español", dir: "ltr" },
  { id: "fr", name: "Français", dir: "ltr" },
  { id: "de", name: "Deutsch", dir: "ltr" },
  { id: "pt", name: "Português", dir: "ltr" },
  { id: "ar", name: "العربية", dir: "rtl" },
  { id: "he", name: "עברית", dir: "rtl" },
  { id: "hi", name: "हिन्दी", dir: "ltr" },
  { id: "ja", name: "日本語", dir: "ltr" },
  { id: "zh", name: "中文", dir: "ltr" },
] as const;
export type LanguageId = (typeof languages)[number]["id"];

/** A part's options with its Words in another language; options the dictionary lacks keep their English. */
export function translate(schema: readonly Option[], config: Record<string, unknown>, language: LanguageId) {
  const next = { ...config };
  for (const option of schema) {
    if (option.group !== "Words" || option.type !== "text") continue;
    next[option.key] = language === "en" ? option.default : (dictionary[option.default]?.[language] ?? option.default);
  }
  return next;
}

export const directionOf = (language: LanguageId) => languages.find((candidate) => candidate.id === language)!.dir;

/** Which language a part's Words are in, read from the options themselves; null once any is edited by hand. */
export function languageOf(schema: readonly Option[], config: Record<string, unknown>): LanguageId | null {
  const words = schema.filter((option) => option.group === "Words" && option.type === "text");
  return (
    languages.find(({ id }) => {
      const translated = translate(words, {}, id);
      return words.every((option) => config[option.key] === translated[option.key]);
    })?.id ?? null
  );
}
