"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DESKTOP_ONLY_CONTAINER_CLASS } from "@/components/shared/TableActionButton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export type ManagementFilterOption = {
  value: string;
  label: string;
};

type SelectFilter = {
  ariaLabel: string;
  name: string;
  options: ManagementFilterOption[];
  placeholder: string;
  value: string;
};

type ManagementListControlsProps = {
  createAction?: ReactNode;
  createActionDesktopOnly?: boolean;
  pageParamName?: string;
  search?: {
    ariaLabel: string;
    paramName?: string;
    placeholder: string;
    value: string;
  };
  selectFilters?: SelectFilter[];
};

type ManagementPaginationProps = {
  page: number;
  pageParamName?: string;
  pageSize: number;
  total: number;
  totalPages: number;
};

function useUrlParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value.toUpperCase() === "ALL") {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const queryString = params.toString();

    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return { isPending, updateUrl };
}

export function ManagementListControls({
  createAction,
  createActionDesktopOnly,
  pageParamName = "page",
  search,
  selectFilters = [],
}: ManagementListControlsProps) {
  const searchParamName = search?.paramName ?? "q";
  const { isPending, updateUrl } = useUrlParamUpdater();
  const hasFilters =
    (search?.value ?? "").trim().length > 0 ||
    selectFilters.some(
      (filter) => Boolean(filter.value) && filter.value.toUpperCase() !== "ALL",
    );

  return (
    <div className="mb-2 flex flex-col gap-2" aria-busy={isPending}>
      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-center gap-3">
        {/* ฝั่งซ้าย: [filter][search] */}
        <div className="flex sm:flex-row flex-col flex-1 sm:items-center gap-3">
          {/* 1. Filters */}
          {selectFilters.length > 0 && (
            <div className="flex sm:flex-row flex-col sm:items-center gap-2">
              {selectFilters.map((filter) => (
                <Select
                  key={filter.name}
                  value={filter.value}
                  disabled={isPending}
                  onValueChange={(value) =>
                    updateUrl({ [filter.name]: value, [pageParamName]: null })
                  }
                >
                  <SelectTrigger
                    className="w-full sm:w-[160px]"
                    aria-label={filter.ariaLabel}
                  >
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    <SelectGroup>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}

          {/* 2. Search */}
          {search && (
            <ManagementSearchForm
              key={search.value}
              disabled={isPending}
              hasFilters={hasFilters}
              pageParamName={pageParamName}
              search={search}
              searchParamName={searchParamName}
              selectFilters={selectFilters}
              updateUrl={updateUrl}
            />
          )}
        </div>

        {/* ฝั่งขวา: [createAction] */}
        {createAction && (
          <div
            className={`justify-end items-center shrink-0 ${createActionDesktopOnly ? DESKTOP_ONLY_CONTAINER_CLASS : "flex"
              }`}
          >
            {createAction}
          </div>
        )}
      </div>
      <PendingIndicator isPending={isPending} />
    </div>
  );
}

function ManagementSearchForm({
  disabled,
  hasFilters,
  pageParamName,
  search,
  searchParamName,
  selectFilters,
  updateUrl,
}: {
  disabled: boolean;
  hasFilters: boolean;
  pageParamName: string;
  search: NonNullable<ManagementListControlsProps["search"]>;
  searchParamName: string;
  selectFilters: SelectFilter[];
  updateUrl: (updates: Record<string, string | null>) => void;
}) {
  const [searchValue, setSearchValue] = useState(search.value);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        updateUrl({
          [searchParamName]: searchValue.trim(),
          [pageParamName]: null,
        });
      }}
      className="flex sm:flex-row flex-col gap-2 w-full lg:max-w-2xl"
    >
      <InputGroup className="sm:flex-1">
        <InputGroupAddon>
          <SearchIcon className="opacity-50 size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={search.placeholder}
          aria-label={search.ariaLabel}
        />
      </InputGroup>

      <div className="flex gap-2">
        <Button
          type="submit"
          variant="outline"
          size="default"
          disabled={disabled}>
          ค้นหา
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={disabled}
            onClick={() => {
              setSearchValue("");
              updateUrl({
                [searchParamName]: null,
                [pageParamName]: null,
                ...Object.fromEntries(
                  selectFilters.map((filter) => [filter.name, null]),
                ),
              });
            }}
            aria-label="ล้างตัวกรอง"
          >
            <XIcon data-icon="inline-start" className="size-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </form>
  );
}

export function ManagementPagination({
  page,
  pageParamName = "page",
  pageSize,
  total,
  totalPages,
}: ManagementPaginationProps) {
  const { isPending, updateUrl } = useUrlParamUpdater();
  const resultStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const resultEnd = Math.min(page * pageSize, total);
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > 0 && page < totalPages;

  return (
    <div className="mt-4 flex flex-col gap-2" aria-busy={isPending}>
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 text-muted-foreground text-sm">
        <p>
          แสดง {resultStart}-{resultEnd} จาก {total} รายการ
        </p>

        <div className="flex justify-between sm:justify-end items-center gap-3">
          <span>
            หน้า {totalPages === 0 ? 0 : page} จาก {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasPreviousPage || isPending}
              onClick={() => updateUrl({ [pageParamName]: String(page - 1) })}
            >
              <ChevronLeftIcon
                data-icon="inline-start"
                className="mr-1 w-4 h-4"
              />
              ก่อนหน้า
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNextPage || isPending}
              onClick={() => updateUrl({ [pageParamName]: String(page + 1) })}
            >
              ถัดไป
              <ChevronRightIcon data-icon="inline-end" className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <PendingIndicator isPending={isPending} />
    </div>
  );
}

function PendingIndicator({ isPending }: { isPending: boolean }) {
  return (
    <div className="h-1 w-full" aria-hidden="true">
      {isPending ? <Skeleton className="h-1 w-full rounded-full" /> : null}
    </div>
  );
}
