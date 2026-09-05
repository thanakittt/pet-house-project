"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2Icon, PawPrintIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterLineConnectedCustomers,
  type LineConnectedCustomer,
} from "../types/line-connected-customer";

type LineConnectedCustomerTableProps = {
  customers: LineConnectedCustomer[];
};

export function LineConnectedCustomerTable({
  customers,
}: LineConnectedCustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(
    () => filterLineConnectedCustomers(customers, searchQuery),
    [customers, searchQuery],
  );

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
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <UsersIcon className="size-4" />
          <span>
            แสดง {filteredCustomers.length.toLocaleString("th-TH")} จาก{" "}
            {customers.length.toLocaleString("th-TH")} คน
          </span>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 p-8 border border-dashed rounded-lg text-center">
          <UsersIcon className="size-8 text-muted-foreground" />
          <p className="font-medium text-base">ยังไม่มีลูกค้าที่เชื่อมต่อบัญชี LINE กับระบบ</p>
          <p className="text-muted-foreground text-sm">
            เมื่อลูกค้าผูกบัญชี LINE กับทางร้าน รายชื่อจะแสดงที่นี่เพื่อใช้ส่งข้อความ
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col justify-center items-center gap-2 p-8 border border-dashed rounded-lg text-center">
          <SearchIcon className="size-8 text-muted-foreground" />
          <p className="font-medium text-base">ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา</p>
          <p className="text-muted-foreground text-sm">
            ลองค้นหาด้วยชื่ออื่น เบอร์โทรศัพท์ หรือชื่อสัตว์เลี้ยง
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>เบอร์โทรศัพท์</TableHead>
                <TableHead>สัตว์เลี้ยง</TableHead>
                <TableHead className="text-right">สถานะ LINE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
