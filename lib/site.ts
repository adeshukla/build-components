/** Where the site lives in production. Set NEXT_PUBLIC_SITE_URL to override (e.g. for a preview deploy). */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://build-components.devstash.me";

export const siteName = "Build Components";

export const siteDescription =
  "Accessible UI components you configure visually and take into your project as plain code: React + Tailwind, HTML/CSS/JS, Vue, Svelte, Angular, Solid or a Web Component. No library to install.";

export const author = { name: "Adesh Shukla", url: "https://devstash.me" };

/** Where "Report a problem" on a part page writes to. */
export const problemEmail = "hello@devstash.me";
