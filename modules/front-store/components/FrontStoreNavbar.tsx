"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarClock,
  Cat,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  activeHref?: string;
  activeMatch: "exact" | "startsWith";
};

const publicNavItems: NavItem[] = [
  { label: "หน้าแรก", href: "/", activeMatch: "exact" },
  { label: "ติดต่อ", href: "/#contact", activeMatch: "exact" },
  { label: "บริการ", href: "/services", activeMatch: "startsWith" },
  { label: "ข่าวสาร", href: "/news", activeMatch: "startsWith" },
  { label: "ถาม AI", href: "/assistant", activeMatch: "startsWith" },
];

const authenticatedNavItems: NavItem[] = [
  ...publicNavItems,
  {
    label: "จองคิว",
    href: "/appointments/new",
    activeHref: "/appointments",
    activeMatch: "exact",
  }
];

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.activeMatch === "exact") {
    return pathname === item.href;
  }

  const activeHref = item.activeHref ?? item.href;

  return pathname === activeHref || pathname.startsWith(`${activeHref}/`);
}

function BrandLink() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 min-w-0"
      aria-label="กลับไปหน้าแรก Pet House"
    >
      <Image
        src="/images/logo/2.png"
        alt="โลโก้ Pet House"
        width={44}
        height={44}
        priority
        className="rounded-sm size-10 object-contain shrink-0"
      />
      <span className="font-heading font-bold text-primary text-lg truncate">
        Pet House
      </span>
    </Link>
  );
}

export function FrontStoreNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user;
  const isLoggedIn = Boolean(user);
  const navItems = isLoggedIn ? authenticatedNavItems : publicNavItems;
  const userDisplayName = user?.name?.trim() || "บัญชีของฉัน";

  async function handleSignOut() {
    try {
      setIsSigningOut(true);

      const result = await authClient.signOut();

      if (result.error) {
        toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Customer sign out error:", error);
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSigningOut(false);
    }
  }

  useEffect(() => {
    function updateNavbarBackground() {
      // ใช้ scrollY เพื่อตัดสินใจว่า navbar ควรเป็นสีขาวหรือโปร่งใส
      setIsScrolled(window.scrollY > 8);
    }

    updateNavbarBackground();
    window.addEventListener("scroll", updateNavbarBackground, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateNavbarBackground);
    };
  }, []);

  return (
    <header
      className={cn(
        "top-0 z-50 fixed w-full transition-all duration-200",
        isScrolled
          ? "border-b border-border/50 bg-background/70 shadow-sm backdrop-blur-md"
          : "border-b border-border bg-background shadow-sm"
      )}
    >
      <div className="items-center gap-4 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] mx-auto px-4 md:px-8 max-w-5xl h-16">
        <div className="flex justify-start min-w-0">
          <BrandLink />
        </div>

        <nav aria-label="เมนูลูกค้า" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item);

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
              >
                <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                  {item.label}
                </Link>
              </Button>
            );
          })}

        </nav>

        <div className="hidden md:flex justify-end gap-2">
          {!isPending && !isLoggedIn && (
            <>
              <Button asChild variant="outline">
                <Link href="/sign-up">สมัครสมาชิก</Link>
              </Button>

              <Button asChild>
                <Link href="/sign-in">เข้าสู่ระบบ</Link>
              </Button>
            </>
          )}

          {!isPending && isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="max-w-44">
                  <span className="truncate">{userDisplayName}</span>
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <CircleUserRound />
                      โปรไฟล์
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pets">
                      <Cat />
                      สัตว์เลี้ยงของฉัน
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/appointments">
                      <CalendarClock />
                      ประวัติการจอง
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  <LogOut />
                  {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="md:hidden"
              aria-label="เปิดเมนู"
            >
              <Menu data-icon="inline-start" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80 max-w-[85vw]">
            <SheetHeader>
              <SheetTitle>
                <BrandLink />
              </SheetTitle>
            </SheetHeader>

            <nav aria-label="เมนูลูกค้าบนมือถือ" className="flex flex-col gap-2 px-4">
              {navItems.map((item) => {
                const isActive = isNavItemActive(pathname, item);

                return (
                  <SheetClose key={item.href} asChild>
                    <Button
                      asChild
                      variant={isActive ? "secondary" : "ghost"}
                      className="justify-start h-11"
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </Button>
                  </SheetClose>
                );
              })}

              {!isPending && !isLoggedIn && (
                <>
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      className="justify-start mt-2 h-11"
                    >
                      <Link href="/sign-up">สมัครสมาชิก</Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button asChild className="justify-start h-11">
                      <Link href="/sign-in">เข้าสู่ระบบ</Link>
                    </Button>
                  </SheetClose>
                </>
              )}

              {!isPending && isLoggedIn && (
                <>
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      className="justify-start mt-2 h-11"
                    >
                      <Link href="/profile">
                        <CircleUserRound data-icon="inline-start" />
                        โปรไฟล์
                      </Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button asChild variant="outline" className="justify-start h-11">
                      <Link href="/appointments">
                        <CalendarClock data-icon="inline-start" />
                        ประวัติการจอง
                      </Link>
                    </Button>
                  </SheetClose>

                  <Button
                    type="button"
                    variant="destructive"
                    className="justify-start h-11"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                  >
                    <LogOut data-icon="inline-start" />
                    {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
