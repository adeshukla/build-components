import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "One stop per card: the title. The tags are text, and there is no second link to the same place."],
  [["Enter"], "Follow the article."],
];

export const checklist = [
  "One link per card, and it is the title. A card with a \"Read more\" as well gives a screen reader two links to the same place, one of them called \"Read more\".",
  "The whole card is clickable through an overlay on that one link rather than a second link or a click handler on the article. It costs text selection inside the card, which is why it is an option.",
  "The focus ring is drawn round the card with :has(a:focus-visible), because the link itself fills the card and a ring on the link alone would be invisible.",
  "The heading level is an option: a grid of cards under an h2 needs h3s, or the page's outline is nonsense.",
  "The date is a real time element written out in full, formatted by hand so the server and the browser agree.",
  "The thumbnail is decoration by default, with aria-hidden. Giving it a description turns it into an image with a name — an empty alt and a missing alt are not the same thing.",
  "The tags are a list, not links: a tag that goes nowhere should not look like it does.",
  "No JavaScript at all.",
];
