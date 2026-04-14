import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="จัดการประเภทสัตว์เลี้ยง" />
      <div className="p-6">{children}</div>
    </>
  );
}