import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "Moves from post to post: each card is one link, named by its title."],
  [["Enter"], "Opens the post."],
];

export const checklist = [
  "Screen reader: the posts are a list, each an article whose title is a heading and a link.",
  "The heading levels fit the page: the section's heading, then each post one level below.",
  "Dates are read as dates (a time element), in words, not as numbers.",
  "Browser zoom at 200%: the cards stack into one column.",
];
