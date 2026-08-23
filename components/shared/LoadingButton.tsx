import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type * as React from "react";

type LoadingButtonContentProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
};

type LoadingButtonProps = React.ComponentProps<typeof Button> &
  LoadingButtonContentProps;

export function LoadingButtonContent({
  children,
  isLoading = false,
  loadingText,
}: LoadingButtonContentProps) {
  return (
    <>
      {isLoading && <Spinner data-icon="inline-start" />}
      {isLoading && loadingText ? loadingText : children}
    </>
  );
}

export function LoadingButton({
  children,
  disabled,
  isLoading = false,
  loadingText,
  ...props
}: LoadingButtonProps) {
  // Loading state should always block repeat clicks, while still respecting any caller disabled rule.
  const shouldDisableButton = disabled || isLoading;

  return (
    <Button aria-busy={isLoading} disabled={shouldDisableButton} {...props}>
      <LoadingButtonContent isLoading={isLoading} loadingText={loadingText}>
        {children}
      </LoadingButtonContent>
    </Button>
  );
}
