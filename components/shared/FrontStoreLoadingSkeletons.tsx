import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FrontStoreSkeletonVariant =
  | "home"
  | "services"
  | "appointments"
  | "appointment-detail"
  | "booking"
  | "pets"
  | "profile"
  | "news"
  | "news-detail"
  | "assistant"
  | "auth";

type FrontStoreRouteSkeletonProps = {
  variant?: FrontStoreSkeletonVariant;
};

function PageShell({
  children,
  className,
  busyLabel = "Loading page",
}: {
  children: ReactNode;
  className?: string;
  busyLabel?: string;
}) {
  return (
    <main
      aria-busy="true"
      aria-label={busyLabel}
      className={cn(
        "mx-auto min-h-screen w-full max-w-5xl overflow-x-hidden p-4 font-noto-thai md:p-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

function SectionHeadingSkeleton({
  iconClassName = "bg-blue-500",
}: {
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2">
      <Skeleton className={cn("size-10 rounded-xl", iconClassName)} />
      <Skeleton className="h-7 w-48 max-w-[70vw]" />
    </div>
  );
}

function ActionCardSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm md:p-8">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Skeleton className="size-7 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="mx-auto h-4 w-full max-w-52" />
        <Skeleton className="mx-auto h-4 w-4/5 max-w-44" />
      </div>
    </div>
  );
}

function CompactNewsCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-3 pr-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-44 max-w-full" />
        <Skeleton className="h-4 w-full max-w-56" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="size-9 rounded-full" />
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

function ServiceCategorySkeleton({
  iconClassName,
}: {
  iconClassName: string;
}) {
  return (
    <section className="space-y-5">
      <SectionHeadingSkeleton iconClassName={iconClassName} />
      <div className="flex gap-2 rounded-2xl border bg-card p-2 shadow-sm md:max-w-sm">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <ServiceCardSkeleton key={item} />
        ))}
      </div>
    </section>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-11 shrink-0 rounded-xl md:size-12" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-40 max-w-[45vw]" />
            <Skeleton className="h-4 w-56 max-w-[55vw]" />
          </div>
        </div>
        <Skeleton className="h-7 w-24 shrink-0 rounded-full" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="my-5 h-px w-full" />
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-3 w-16" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

function ProfileInfoCardSkeleton({
  rows = 4,
  withAction = true,
}: {
  rows?: number;
  withAction?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-6 w-44 max-w-[55vw]" />
        </div>
        {withAction ? <Skeleton className="size-9 rounded-md" /> : null}
      </div>
      <div className="space-y-3 px-6 pb-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36 max-w-[40vw]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading authentication form"
      className="flex min-h-screen items-center justify-center p-5"
    >
      <section className="flex w-full flex-col items-center rounded-lg md:w-[400px]">
        <Skeleton className="mb-3 size-[60px] rounded-sm" />
        <Skeleton className="mb-2 h-6 w-28" />
        <Skeleton className="mb-5 h-5 w-36" />
        <div className="w-full space-y-3">
          {Array.from({ length: fields }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="mt-3 h-10 w-full rounded-md" />
        </div>
        <div className="my-6 flex w-full items-center gap-3">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="w-full space-y-3">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      </section>
    </div>
  );
}

export function FrontStoreHomeSkeleton() {
  return (
    <PageShell busyLabel="Loading home page" className="space-y-6">
      <section className="relative min-h-[200px] overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm md:min-h-[280px]">
        <div className="relative z-10 flex w-full flex-col items-start gap-3 px-6 py-6 md:w-2/3 md:py-10 md:pl-10">
          <Skeleton className="h-6 w-40 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 max-w-[55vw] md:h-10" />
            <Skeleton className="h-8 w-48 max-w-[50vw] md:h-10" />
          </div>
          <Skeleton className="h-4 w-40 md:w-80" />
          <Skeleton className="hidden h-11 w-36 rounded-md md:block" />
        </div>
        <Skeleton className="absolute bottom-0 right-0 size-[140px] rounded-full md:size-[300px]" />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <ActionCardSkeleton key={item} />
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <SectionHeadingSkeleton iconClassName="bg-purple-500" />
          <Skeleton className="hidden h-10 w-28 rounded-xl sm:block" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <CompactNewsCardSkeleton key={item} />
          ))}
        </div>
      </section>

      <ServiceCategorySkeleton iconClassName="bg-blue-500" />

      <section className="space-y-6">
        <SectionHeadingSkeleton iconClassName="bg-amber-300" />
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm md:grid-cols-3">
          <div className="flex flex-col items-center justify-center border-b p-8 md:border-b-0 md:border-r">
            <Skeleton className="h-14 w-24" />
            <Skeleton className="my-3 h-5 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-5 p-6 md:col-span-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export function FrontStoreServicesSkeleton() {
  return (
    <PageShell busyLabel="Loading services" className="space-y-6 pb-20">
      <ServiceCategorySkeleton iconClassName="bg-blue-500" />
      <ServiceCategorySkeleton iconClassName="bg-amber-500" />
    </PageShell>
  );
}

export function FrontStoreAppointmentsSkeleton() {
  return (
    <PageShell busyLabel="Loading appointments" className="max-w-4xl space-y-6">
      <header className="mb-5 mt-3">
        <Skeleton className="h-8 w-56 max-w-full" />
      </header>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-4">
        {[0, 1, 2].map((item) => (
          <AppointmentCardSkeleton key={item} />
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </PageShell>
  );
}

export function FrontStoreAppointmentDetailSkeleton() {
  return (
    <PageShell busyLabel="Loading appointment detail" className="space-y-8 p-6 lg:p-8">
      <Skeleton className="h-10 w-24 rounded-md" />
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 px-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-36" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-5 rounded-xl bg-muted/80 p-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-5 w-full max-w-md" />
                <Skeleton className="h-5 w-3/4 max-w-sm" />
              </div>
              <Skeleton className="size-11 rounded-md" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <Skeleton className="mb-6 h-6 w-36" />
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="my-6 h-px w-full" />
            <div className="flex items-end justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="mt-10 h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function FrontStoreBookingSkeleton() {
  return (
    <PageShell busyLabel="Loading booking form" className="my-4 max-w-5xl space-y-4 px-4 py-0">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm md:p-8">
        <Skeleton className="mb-8 h-8 w-56" />
        <div className="relative mx-auto mb-10 flex max-w-4xl items-start justify-between">
          <Skeleton className="absolute left-0 top-6 h-1 w-full" />
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex w-full flex-col items-center gap-3">
              <Skeleton className="size-10 rounded-full md:size-12" />
              <Skeleton className="h-3 w-12 md:w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-4 md:mx-10">
          <Skeleton className="h-6 w-44" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t pt-6">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </PageShell>
  );
}

export function FrontStorePetsSkeleton() {
  return (
    <PageShell busyLabel="Loading pets" className="space-y-6 pb-20">
      <header className="mb-5 mt-3">
        <Skeleton className="h-8 w-48" />
      </header>
      <div className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="rounded-xl border p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="size-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </PageShell>
  );
}

export function FrontStoreProfileSkeleton() {
  return (
    <PageShell busyLabel="Loading profile" className="max-w-4xl p-5">
      <header className="mb-5 mt-3">
        <Skeleton className="h-8 w-40" />
      </header>
      <div className="space-y-5">
        <ProfileInfoCardSkeleton />
        <ProfileInfoCardSkeleton rows={2} withAction={false} />
      </div>
    </PageShell>
  );
}

export function FrontStoreNewsSkeleton() {
  return (
    <PageShell busyLabel="Loading news" className="space-y-4">
      <header className="mb-5 mt-3">
        <Skeleton className="h-8 w-48" />
      </header>
      <div className="grid grid-cols-1 gap-4">
        {[0, 1, 2, 3].map((item) => (
          <CompactNewsCardSkeleton key={item} />
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </PageShell>
  );
}

export function FrontStoreNewsDetailSkeleton() {
  return (
    <PageShell busyLabel="Loading news detail" className="space-y-6">
      <Skeleton className="h-10 w-24 rounded-md" />
      <article className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-44" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </div>
      </article>
    </PageShell>
  );
}

export function FrontStoreAssistantSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading assistant"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <section className="flex h-[min(720px,calc(100vh-8rem))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-3 border-b p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-4/5 rounded-2xl" />
          <Skeleton className="ml-auto h-12 w-3/5 rounded-2xl" />
          <Skeleton className="h-20 w-5/6 rounded-2xl" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </section>
    </div>
  );
}

export function FrontStoreRouteSkeleton({
  variant = "home",
}: FrontStoreRouteSkeletonProps) {
  switch (variant) {
    case "services":
      return <FrontStoreServicesSkeleton />;
    case "appointments":
      return <FrontStoreAppointmentsSkeleton />;
    case "appointment-detail":
      return <FrontStoreAppointmentDetailSkeleton />;
    case "booking":
      return <FrontStoreBookingSkeleton />;
    case "pets":
      return <FrontStorePetsSkeleton />;
    case "profile":
      return <FrontStoreProfileSkeleton />;
    case "news":
      return <FrontStoreNewsSkeleton />;
    case "news-detail":
      return <FrontStoreNewsDetailSkeleton />;
    case "assistant":
      return <FrontStoreAssistantSkeleton />;
    case "auth":
      return <AuthFormSkeleton fields={3} />;
    case "home":
    default:
      return <FrontStoreHomeSkeleton />;
  }
}
