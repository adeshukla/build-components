// Preview and test-harness routes: no site chrome, so a component's dialogs stay inside the frame.
// The system font stack, the same one the HTML/CSS/JS output declares, so both outputs are compared
// like for like instead of the React one borrowing this site's Geist. And a plain page behind them,
// not the site's paper, so a part is previewed and tested on the kind of page it will live on.
export default function BareLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bare-page flex flex-1 flex-col" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {children}
    </div>
  );
}
