"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2Icon,
  CheckSquareIcon,
  PawPrintIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterLineConnectedCustomers,
  type LineConnectedCustomer,
} from "../types/line-connected-customer";

type LineConnectedCustomerTableProps = {
  customers: LineConnectedCustomer[];
  selectable?: boolean;
  selectedCustomerIds?: Set<string>;
  onToggleSelectCustomer?: (customerId: string) => void;
  onSelectAllFiltered?: (customerIds: string[]) => void;
  onDeselectAllFiltered?: (customerIds: string[]) => void;
};

export function LineConnectedCustomerTable({
  customers,
  selectable = false,
  selectedCustomerIds,
  onToggleSelectCustomer,
  onSelectAllFiltered,
  onDeselectAllFiltered,
}: LineConnectedCustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(
    () => filterLineConnectedCustomers(customers, searchQuery),
    [customers, searchQuery],
  );

  const filteredCustomerIds = useMemo(
    () => filteredCustomers.map((c) => c.id),
    [filteredCustomers],
  );

  const selectedFilteredCount = useMemo(() => {
    if (!selectedCustomerIds || selectedCustomerIds.size === 0) return 0;
    return filteredCustomers.filter((c) => selectedCustomerIds.has(c.id)).length;
  }, [filteredCustomers, selectedCustomerIds]);

  const isAllFilteredSelected =
    filteredCustomers.length > 0 &&
    selectedFilteredCount === filteredCustomers.length;

  const isSomeFilteredSelected =
    selectedFilteredCount > 0 && !isAllFilteredSelected;

  function handleSelectAllToggle() {
    if (!selectable) return;

    if (isAllFilteredSelected) {
      onDeselectAllFiltered?.(filteredCustomerIds);
    } else {
      onSelectAllFiltered?.(filteredCustomerIds);
    }
  }

  const selectedTotalCount = selectedCustomerIds?.size ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="top-1/2 left-3 absolute size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ค้นหาชื่อ, เบอร์โทร, ชื่อสัตว์เลี้ยง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {selectable && (
            <Badge
              variant={selectedTotalCount > 0 ? "default" : "secondary"}
              className="gap-1.5 font-medium text-xs"
            >
              <CheckSquareIcon className="size-3.5" />
              เลือกแล้ว {selectedTotalCount.toLocaleString("th-TH")} คน
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <UsersIcon className="size-4" />
            <span>
              แสดง {filteredCustomers.length.toLocaleString("th-TH")} จาก{" "}
              {customers.length.toLocaleString("th-TH")} คน
            </span>
          </div>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 p-8 border border-dashed rounded-lg text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="font-medium text-base">
            ยังไม่มีลูกค้าที่เชื่อมต่อบัญชี LINE กับระบบ
          </p>
          <p className="text-muted-foreground text-sm">
            เมื่อลูกค้าผูกบัญชี LINE กับทางร้าน รายชื่อจะแสดงที่นี่เพื่อใช้ส่งข้อความ
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 p-8 border border-dashed rounded-lg text-center">
          <SearchIcon className="size-8 text-muted-foreground" />
          <p className="font-medium text-base">
            ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา
          </p>
          <p className="text-muted-foreground text-sm">
            ลองค้นหาด้วยชื่ออื่น เบอร์โทรศัพท์ หรือชื่อสัตว์เลี้ยง
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={
                        isAllFilteredSelected
                          ? true
                          : isSomeFilteredSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleSelectAllToggle}
                      aria-label="เลือกทั้งหมดในผลการค้นหา"
                      disabled={filteredCustomers.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead>ลูกค้า</TableHead>
                <TableHead>เบอร์โทรศัพท์</TableHead>
                <TableHead>สัตว์เลี้ยง</TableHead>
                <TableHead className="text-right">สถานะ LINE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const isSelected =
                  selectable && Boolean(selectedCustomerIds?.has(customer.id));

                return (
                  <TableRow
                    key={customer.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={selectable ? "cursor-pointer select-none" : undefined}
                    onClick={() => {
                      if (selectable) {
                        onToggleSelectCustomer?.(customer.id);
                      }
                    }}
                  >
                    {selectable && (
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            onToggleSelectCustomer?.(customer.id)
                          }
                          aria-label={`เลือกลูกค้า ${customer.nickname}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {customer.nickname}
                        </span>
                        {customer.userName && (
                          <span className="text-muted-foreground text-xs">
                            {customer.userName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {customer.contactPhoneNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.petNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.petNames.map((petName) => (
                            <Badge
                              key={petName}
                              variant="secondary"
                              className="font-normal text-xs"
                            >
                              <PawPrintIcon className="mr-1 size-3" />
                              {petName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
                      >
                        <CheckCircle2Icon className="mr-1 size-3" />
                        เชื่อมต่อแล้ว
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
