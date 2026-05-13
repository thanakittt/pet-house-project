"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { RefObject, useMemo } from "react";

export type SearchableComboboxOption = {
  value: string;
  label: string;
  groupLabel?: string;
};

type SearchableComboboxGroup = {
  groupLabel: string;
  items: SearchableComboboxOption[];
};

type SearchableComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableComboboxOption[];
  contentContainerRef?: RefObject<HTMLElement | null>;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  onBlur?: () => void;
};

function groupOptions(
  options: SearchableComboboxOption[],
): SearchableComboboxGroup[] {
  const groupMap = new Map<string, SearchableComboboxOption[]>();

  options.forEach((option) => {
    const groupLabel = option.groupLabel ?? "";
    const currentOptions = groupMap.get(groupLabel) ?? [];

    currentOptions.push(option);
    groupMap.set(groupLabel, currentOptions);
  });

  return Array.from(groupMap.entries()).map(([groupLabel, items]) => ({
    groupLabel,
    items,
  }));
}

export function SearchableCombobox({
  id,
  value,
  onValueChange,
  options,
  contentContainerRef,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  "aria-invalid": ariaInvalid,
  className,
  onBlur,
}: SearchableComboboxProps) {
  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  const groupedOptions = useMemo(() => groupOptions(options), [options]);

  return (
    <Combobox<SearchableComboboxOption>
      items={groupedOptions}
      value={selectedOption}
      onValueChange={(selectedValue) => {
        onValueChange(selectedValue?.value ?? "");
      }}
      isItemEqualToValue={(item, selectedValue) =>
        item.value === selectedValue.value
      }
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        className={cn("w-full", className)}
        placeholder={selectedOption ? undefined : placeholder}
        aria-invalid={ariaInvalid}
        aria-label={searchPlaceholder}
        disabled={disabled}
        showClear
        onBlur={onBlur}
      />
      <ComboboxContent container={contentContainerRef}>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList className="max-h-64 overflow-y-auto">
          {(group: SearchableComboboxGroup) => (
            <ComboboxGroup key={group.groupLabel} items={group.items}>
              {group.groupLabel && (
                <ComboboxLabel>{group.groupLabel}</ComboboxLabel>
              )}
              <ComboboxCollection>
                {(option: SearchableComboboxOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
