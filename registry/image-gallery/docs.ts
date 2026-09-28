import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Nothing to stop on. A gallery of pictures is not a set of controls; put the lightbox part around it if they should open."],
];

export const checklist = [
  "A list of figures, so a screen reader counts the pictures and can move between them instead of meeting an undifferentiated wall.",
  "An empty alt and a missing alt are not the same thing: empty says \"this is decoration, skip it\", missing makes a reader announce the file name. Every item here has one or the other on purpose.",
  "A caption is not alt text. The caption says something about the picture; alt says what the picture is, for someone who cannot see it. Both are offered because they do different jobs.",
  "The shape is set in CSS, so the space is reserved before the file arrives: no layout shift, and the caption does not jump down the page.",
  "loading=\"lazy\" and decoding=\"async\", so a gallery below the fold costs nothing until it is reached.",
  "No pictures ship with this part, and the placeholder says so rather than filling the space with a stock photograph.",
  "Only http, https and same-site paths are accepted as a source, so a shared link can never make one a javascript: URL.",
  "Nothing is focusable and there is no JavaScript. To make the pictures open, wrap this in the lightbox part.",
];
