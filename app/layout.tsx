import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import { author, siteDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteName}: accessible components, plain code`, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  authors: [author],
  creator: author.name,
  openGraph: { type: "website", siteName, url: "/", title: siteName, description: siteDescription },
  twitter: { card: "summary_large_image", title: siteName, description: siteDescription },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25154d" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1233" },
  ],
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
        {children}
      </body>
    </html>
  );
}
