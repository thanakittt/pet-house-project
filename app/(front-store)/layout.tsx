import { FrontStoreNavbar } from "@/modules/front-store/components/FrontStoreNavbar";

export default function FrontStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FrontStoreNavbar />
      <div className="min-h-screen bg-background pt-16 text-foreground">
        {children}
      </div>
    </>
  );
}
