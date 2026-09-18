import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Direction contract (impeccable). Rendered as an HTML comment so it survives the production build.
const contract = `<!--
THESIS: Components as parts on a datasheet: named part, pinout (keyboard map), spec table (tests), order code (install). Refuses the sidebar-docs-with-preview-cards library site.
OWN-WORLD: Solder-mask purple board bands with gold contact pads and silkscreen labels; datasheet paper for work, in light or dark. Barlow Condensed display, Geist UI, Geist Mono only for data and code.
STORY: A front-end developer sees live, tested parts, configures one in seconds, checks both outputs, and leaves with plain code.
FIRST VIEWPORT: Full-width board. Left: oversized condensed headline and two actions (gold pad, outline). Right: live parts mounted on the board with gold pins; traces draw in.
FORM: Parts datasheet, grounded list position 3, seed e9db4b6a.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export const metadata: Metadata = {
  title: { default: "Accessible components, plain code", template: "%s" },
  description:
    "Accessible UI components you configure visually and take into your project as plain code: React + Tailwind or HTML/CSS/JS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}",
          }}
        />
        <div hidden dangerouslySetInnerHTML={{ __html: contract }} />
        {children}
      </body>
    </html>
  );
}
