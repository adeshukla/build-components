import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The glow the glass sits over. */}
      <div aria-hidden="true" className="site-glow" />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
