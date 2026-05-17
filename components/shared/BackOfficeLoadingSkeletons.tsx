import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { cn } from "@/lib/utils";

type RouteLoadingShellProps = {
  children: React.ReactNode;
  titleWidth?: string;
};

type ManagementTableSkeletonProps = {
  columns?: number;
  rows?: number;
  showCreateAction?: boolean;
};

type BackOfficeSkeletonVariant =
  | "home"
  | "appointments"
  | "pos"
  | "line-oa"
  | "operations"
  | "profile"
  | "shell"
  | "table"
  | "dashboard"
  | "detail";

const quickAccessCardWidths = [
  "w-28",
  "w-24",
  "w-32",
  "w-20",
  "w-28",
  "w-24",
  "w-32",
  "w-28",
  "w-24",
  "w-28",
  "w-32",
  "w-24",
];

function RouteLoadingShell({
  children,
  titleWidth = "w-36",
}: RouteLoadingShellProps) {
  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-6"
          />
          <Skeleton className={cn("h-5", titleWidth)} />
        </div>
      </header>
      {children}
    </>
  );
}

export function BackOfficeHomeSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 flex flex-col gap-2">
        <Skeleton className="h-8 w-72 max-w-full md:h-9" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-3/4 max-w-2xl md:hidden" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quickAccessCardWidths.map((width, index) => (
          <section key={index} className="rounded-lg border p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className={cn("h-5", width)} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AppointmentScheduleSkeleton() {
  return (
    <main aria-busy="true" aria-live="polite" className="w-full min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <div className="mb-4 grid h-11 grid-cols-2 rounded-lg bg-muted p-1">
          <Skeleton className="h-full rounded-md" />
          <Skeleton className="h-full rounded-md bg-muted-foreground/10" />
        </div>

        <section className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="z-20 flex shrink-0 flex-col items-stretch justify-between gap-4 border-b border-slate-200 bg-white px-4 py-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="hidden size-11 rounded-lg sm:block" />
                <div className="flex min-w-0 flex-col gap-2">
                  <Skeleton className="h-6 w-48 max-w-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
            <Skeleton className="hidden h-10 w-36 lg:block" />
          </div>

          <div className="bg-slate-50/50 p-4 md:hidden">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <ScheduleListItemSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className="relative hidden h-[720px] flex-1 overflow-hidden bg-slate-50/50 md:flex">
            <div className="sticky left-0 z-20 w-20 flex-shrink-0 border-r border-slate-200 bg-white pt-4 shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className="relative flex items-start justify-center"
                  style={{ height: "120px" }}
                >
                  <Skeleton className="absolute -top-2.5 h-4 w-12" />
                </div>
              ))}
            </div>
            <div className="relative min-w-[600px] flex-1 pb-10 pt-4">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  className="absolute w-full border-t border-slate-200/60"
                  style={{ top: `${index * 120 + 16}px` }}
                />
              ))}
              <Skeleton className="absolute left-2 right-4 top-[64px] h-24 rounded-md border-l-4 border-l-primary bg-white" />
              <Skeleton className="absolute left-2 right-4 top-[244px] h-32 rounded-md border-l-4 border-l-primary bg-white" />
              <Skeleton className="absolute left-2 right-4 top-[456px] h-28 rounded-md border-l-4 border-l-primary bg-white" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function POSWaitingPaymentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <PaymentCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function LineOAManagementSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="hidden flex-col gap-4 lg:flex"
    >
      <div className="mb-2 grid h-11 grid-cols-2 rounded-lg bg-muted p-1">
        <Skeleton className="h-full rounded-md" />
        <Skeleton className="h-full rounded-md bg-muted-foreground/10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border">
          <div className="flex flex-col gap-2 p-6">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="p-6 pt-0">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-52 w-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex justify-end border-t p-6">
            <Skeleton className="h-10 w-40" />
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </section>
      </div>

      <section className="rounded-lg border">
        <div className="flex flex-col gap-2 p-6">
          <Skeleton className="h-6 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex flex-col gap-4 p-6 pt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DailyAppointmentsBoardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <section key={index} className="rounded-lg border p-6 shadow-sm">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-9 w-12" />
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        {["border-l-yellow-400", "border-l-blue-500", "border-l-green-500"].map(
          (borderColor) => (
            <div key={borderColor} className="flex flex-col gap-4">
              <OperationCardSkeleton borderColor={borderColor} />
              <OperationCardSkeleton borderColor={borderColor} />
              <div className="rounded-xl border-2 border-dashed bg-muted/20 p-6">
                <Skeleton className="mx-auto h-4 w-24" />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function BackOfficeProfileSkeleton() {
  return (
    <main aria-busy="true" aria-live="polite" className="w-full p-5">
      <div className="mx-auto max-w-4xl">
        <ProfileCardSkeleton rows={5} showAction />
        <div className="mt-5">
          <ProfileCardSkeleton rows={2} />
        </div>
      </div>
    </main>
  );
}

export function BackOfficeShellSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-5">
      <section className="rounded-lg border p-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-52 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-3/4 max-w-xl" />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      <section className="rounded-lg border p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </section>
    </div>
  );
}

function ManagementFiltersSkeleton({
  showCreateAction = true,
}: {
  showCreateAction?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full sm:w-40" />
        <Skeleton className="h-10 w-full lg:max-w-xl" />
        <Skeleton className="h-10 w-24" />
      </div>
      {showCreateAction ? <Skeleton className="h-10 w-36" /> : null}
    </div>
  );
}

export function ManagementTableSkeleton({
  columns = 5,
  rows = 8,
  showCreateAction = true,
}: ManagementTableSkeletonProps) {
  const columnIndexes = Array.from({ length: columns }, (_, index) => index);
  const rowIndexes = Array.from({ length: rows }, (_, index) => index);

  return (
    <div aria-busy="true" aria-live="polite">
      <ManagementFiltersSkeleton showCreateAction={showCreateAction} />

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {columnIndexes.map((index) => (
                <TableHead
                  key={index}
                  className={cn(index === columns - 1 && "text-right")}
                >
                  <Skeleton
                    className={cn(
                      "h-4",
                      index === columns - 1 ? "ml-auto w-16" : "w-24",
                    )}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowIndexes.map((rowIndex) => (
              <TableRow key={rowIndex}>
                {columnIndexes.map((columnIndex) => (
                  <TableCell key={columnIndex}>
                    <Skeleton
                      className={cn(
                        "h-4",
                        columnIndex === columns - 1
                          ? "ml-auto w-20"
                          : columnIndex === 0
                            ? "w-36"
                            : "w-24",
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-full sm:w-60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      <section className="rounded-lg border p-6">
        <div className="mb-6 flex flex-col gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <section className="rounded-lg border p-6">
        <div className="mb-6 flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
        <ManagementTableSkeleton columns={4} rows={5} showCreateAction={false} />
      </section>
    </div>
  );
}

export function BackOfficeRouteSkeleton({
  variant = "table",
}: {
  variant?: BackOfficeSkeletonVariant;
}) {
  const content = getRouteSkeletonContent(variant);

  return (
    <RouteLoadingShell titleWidth={getRouteTitleWidth(variant)}>
      <BackOfficeContainer>{content}</BackOfficeContainer>
    </RouteLoadingShell>
  );
}

function getRouteSkeletonContent(variant: BackOfficeSkeletonVariant) {
  switch (variant) {
    case "home":
      return <BackOfficeHomeSkeleton />;
    case "appointments":
      return <AppointmentScheduleSkeleton />;
    case "pos":
      return <POSWaitingPaymentSkeleton />;
    case "line-oa":
      return <LineOAManagementSkeleton />;
    case "operations":
      return <DailyAppointmentsBoardSkeleton />;
    case "profile":
      return <BackOfficeProfileSkeleton />;
    case "shell":
      return <BackOfficeShellSkeleton />;
    case "dashboard":
      return <DashboardSkeleton />;
    case "detail":
      return <DetailPageSkeleton />;
    case "table":
    default:
      return <ManagementTableSkeleton />;
  }
}

function getRouteTitleWidth(variant: BackOfficeSkeletonVariant) {
  switch (variant) {
    case "dashboard":
    case "appointments":
    case "operations":
    case "line-oa":
      return "w-40";
    case "pos":
      return "w-64";
    case "profile":
      return "w-28";
    case "shell":
      return "w-36";
    case "home":
    case "table":
    case "detail":
    default:
      return "w-32";
  }
}

function ScheduleListItemSkeleton() {
  return (
    <section className="rounded-lg border border-l-4 border-l-primary bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
    </section>
  );
}

function PaymentCardSkeleton() {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-border/60 p-0 shadow-sm">
      <div className="flex-1 p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-3.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between border-t border-border/50 bg-slate-50/50 p-6 pt-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="hidden h-10 w-32 lg:block" />
      </div>
    </section>
  );
}

function TemplateCardSkeleton() {
  return (
    <section className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-9 w-16" />
      </div>
    </section>
  );
}

function OperationCardSkeleton({ borderColor }: { borderColor: string }) {
  return (
    <section className={cn("rounded-lg border border-l-4 p-0 shadow-sm", borderColor)}>
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4 py-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center justify-between border-t p-4 pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
    </section>
  );
}

function ProfileCardSkeleton({
  rows,
  showAction = false,
}: {
  rows: number;
  showAction?: boolean;
}) {
  return (
    <section className="w-full rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-6">
        <Skeleton className="h-5 w-44" />
        {showAction ? <Skeleton className="size-10 rounded-lg" /> : null}
      </div>
      <div className="p-6 pt-0">
        <div className="flex flex-col gap-3">
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40 max-w-[50%]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCardSkeleton() {
  return (
    <section className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mb-3 h-8 w-28" />
      <Skeleton className="h-4 w-44" />
    </section>
  );
}

function SummaryCardSkeleton() {
  return (
    <section className="rounded-lg border p-6">
      <div className="mb-5 flex flex-col gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}
