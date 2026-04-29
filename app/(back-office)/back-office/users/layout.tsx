import { SiteHeader } from "@/components/site-header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="จัดการผู้ใช้" />
      <div className="p-6">{children}</div>
    </>
  );
}