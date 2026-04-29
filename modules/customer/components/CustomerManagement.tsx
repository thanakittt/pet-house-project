"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";
import { CreateCustomerDialog } from "@/modules/customer/components/CreateCustomerDialog";
import { Customer } from "../types/customer";
import { Button } from "@/components/ui/button";
import { UpdateCustomerDialog } from "./UpdateCustomerDialog";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteCustomer } from "../actions/delete-customer";
import Link from "next/link";

interface CustomerManagementProps {
  customers: Customer[];
}

export default function CustomerManagement({
  customers,
}: CustomerManagementProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  return (
    <>
      <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
        <div className="flex items-center gap-3"></div>
        <div className="flex justify-end">
          <CreateCustomerDialog />
        </div>
      </div>
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
                  <TableCell>{customer.nickname}</TableCell>
                  <TableCell>
                    {customer.userId === null ? "Walk-in" : "Online"}
                  </TableCell>
                  <TableCell>{customer.walkInPhoneNumber}</TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleDateString("th-TH")}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {/* ดูรายละเอียดลูกค้า */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ดูรายละเอียด"
                      asChild
                    >
                      <Link href={`/back-office/customers/${customer.id}`}>
                        <EyeIcon className="size-3.5" />
                      </Link>
                    </Button>

                    {/* แก้ไขข้อมูลลูกค้า */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="แก้ไขข้อมูล"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                    </Button>

                    {/* ลบข้อมูลลูกค้า */}
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="ลบข้อมูล"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
