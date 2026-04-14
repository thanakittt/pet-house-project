import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="จัดการลูกค้า" />
      <div className="p-6">{children}</div>
    </>
  );
}