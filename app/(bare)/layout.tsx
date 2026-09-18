// Preview and test-harness routes: no site chrome, so a component's dialogs stay inside the frame.
export default function BareLayout({ children }: LayoutProps<"/">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
