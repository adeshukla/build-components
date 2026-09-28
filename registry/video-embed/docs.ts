import type { KeyboardRow } from "@/components/editor";

export const keyboard: KeyboardRow[] = [
  [["Tab"], "To the play button, then to the direct link under it."],
  [["Enter", "Space"], "Ask for the video. Only then is the frame created."],
];

export const checklist = [
  "Nothing is requested from the video host until the button is pressed: no third-party script, no cookie, no frame. That is a privacy decision and a performance one at the same time, and it is the whole point of this part.",
  "The play button is named with the video and its length, so a page with four videos on it does not have four buttons called \"Play\".",
  "The frame is given a title. An untitled iframe is announced as \"frame\" and nothing else, which is one of the commonest failures on a page with an embed.",
  "Focus moves into the frame once it is created, so the keyboard ends up where the video is.",
  "There is a direct link to the video as well, so it is reachable where a frame is blocked by a content policy, an extension or a network.",
  "The poster is decoration with an empty alt: the button beside it already carries the name, so describing the poster as well says everything twice.",
  "The shape is set in CSS, so the space is reserved and the caption does not jump when the frame appears.",
  "With no embed address set it says so rather than showing an empty black box. No video ships with this part.",
];
