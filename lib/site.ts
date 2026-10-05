/** Where the site lives in production. Set NEXT_PUBLIC_SITE_URL to override (e.g. for a preview deploy). */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://build-components.devstash.me";

export const siteName = "Build Components";

export const siteDescription =
  "Accessible UI components you configure visually and take into your project as plain code: React + Tailwind (Next.js or any React app), HTML/CSS/JS, Vue, Svelte, Angular, Solid or a Web Component. No library to install.";

export const author = { name: "Adesh Shukla", url: "https://devstash.me" };

/** Where "Report a problem" on a part page writes to. */
export const problemEmail = "hello@devstash.me";

/**
 * The public repository Vercel clones for one-click deploys (D99), made from deploy-template/. Unset, the
 * builder shows no Deploy button: set NEXT_PUBLIC_DEPLOY_TEMPLATE once the repository exists.
 */
export const deployTemplate = process.env.NEXT_PUBLIC_DEPLOY_TEMPLATE ?? "";
