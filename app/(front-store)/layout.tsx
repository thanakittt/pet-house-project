import { FrontStoreNavbar } from "@/modules/front-store/components/FrontStoreNavbar";

export default function FrontStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FrontStoreNavbar />
      <div className="pt-16">{children}</div>
    </>
  );
}
