"use client";

import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import {
  TableActionButton,
  TableActionLink,
} from "@/components/shared/TableActionButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCustomerDialog } from "@/modules/customer/components/CreateCustomerDialog";
import { useState } from "react";
import { deleteCustomer } from "../actions/delete-customer";
import type { ListCustomersResult } from "../queries/list-customer";
import { Customer } from "../types/customer";
import { UpdateCustomerDialog } from "./UpdateCustomerDialog";

const channelOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกช่องทาง" },
  { value: "ONLINE", label: "Online" },
  { value: "WALK_IN", label: "Walk-in" },
];

export default function CustomerManagement({
  customers,
  total,
  page,
  pageSize,
  totalPages,
  q,
  channel,
}: ListCustomersResult) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาลูกค้า",
          placeholder: "ค้นหาชื่อลูกค้า หรือเบอร์โทร",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองช่องทางลูกค้า",
            name: "channel",
            options: channelOptions,
            placeholder: "ช่องทาง",
            value: channel,
          },
        ]}
        createAction={<CreateCustomerDialog />}
      />

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>ช่องทาง</TableHead>
              <TableHead>เบอร์โทรศัพท์</TableHead>
              <TableHead>วันที่สมัคร</TableHead>
              {/* TODO: pet column */}
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.userName ?? customer.nickname}</TableCell>
                  <TableCell>
                    {customer.userId === null ? "Walk-in" : "Online"}
                  </TableCell>
                  <TableCell>
                    {customer.userPhoneNumber ??
                      customer.walkInPhoneNumber ??
                      "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TableActionLink
                        aria-label="ดูรายละเอียด"
                        action="view"
                        href={`/back-office/customers/${customer.id}`}
                      />

                      <TableActionButton
                        aria-label="แก้ไขข้อมูล"
                        action="edit"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsUpdateDialogOpen(true);
                        }}
                      />

                      <TableActionButton
                        aria-label="ลบข้อมูล"
                        action="delete"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  ไม่พบข้อมูลลูกค้า
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

      {selectedCustomer && (
        <>
          <ConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="ยืนยันการลบข้อมูลลูกค้า"
            description={`คุณต้องการลบข้อมูลลูกค้า "${selectedCustomer.nickname}" หรือไม่?`}
            onConfirm={() => deleteCustomer(selectedCustomer.id)}
            successMessage="ลบข้อมูลลูกค้าเรียบร้อย"
            errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า"
          />

          <UpdateCustomerDialog
            open={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            customer={selectedCustomer}
          />
        </>
      )}
    </>
  );
}
