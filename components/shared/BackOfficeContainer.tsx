import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BackOfficeContainerProps = ComponentPropsWithoutRef<"div">;

export function BackOfficeContainer({
  children,
  className,
  ...props
}: BackOfficeContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
