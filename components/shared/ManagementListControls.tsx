"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      if (!value || value === "ALL") {
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
  pageParamName = "page",
  search,
  selectFilters = [],
}: ManagementListControlsProps) {
  const searchParamName = search?.paramName ?? "q";
  const { isPending, updateUrl } = useUrlParamUpdater();
  const hasFilters =
    (search?.value ?? "").length > 0 ||
    selectFilters.some((filter) => filter.value !== "ALL");

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {search ? (
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
      ) : (
        <div />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        {selectFilters.map((filter) => (
          <Select
            key={filter.name}
            value={filter.value}
            onValueChange={(value) =>
              updateUrl({ [filter.name]: value, [pageParamName]: null })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px]" aria-label={filter.ariaLabel}>
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

        {createAction}
      </div>
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
      className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl"
    >
      <InputGroup className="sm:flex-1">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={search.placeholder}
          aria-label={search.ariaLabel}
        />
      </InputGroup>

      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={disabled}>
          ค้นหา
        </Button>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
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
            <XIcon data-icon="inline-start" />
            ล้าง
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
    <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        แสดง {resultStart}-{resultEnd} จาก {total} รายการ
      </p>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
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
            <ChevronLeftIcon data-icon="inline-start" />
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
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
