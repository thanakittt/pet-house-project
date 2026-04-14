import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="จัดการสายพันธุ์สัตว์เลี้ยง" />
      <div className="p-6">{children}</div>
    </>
  );
}