"use client";

import { Separator } from "@/components/ui/separator";
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
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
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
      <main className="mx-auto p-5 max-w-6xl h-svh">
        <header className="mb-2">
          <h1 className="font-bold text-2xl">จัดการลูกค้า</h1>
        </header>
        <Separator className="mb-5" />
        <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
          <div className="flex items-center gap-3">
          </div>
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
              {customers.map((customer) => (
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

                    <Button variant="outline" size="icon" aria-label="ดูรายละเอียด" asChild>
                      <Link href={`/customers/${customer.id}`}>
                        <EyeIcon className="size-3.5" />
                      </Link>
                    </Button>

                    {/* Edit user */}
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

                    {/* Delete user */}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      {selectedCustomer && (
        <>
        <DeleteCustomerDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          customer={{
            nickname: selectedCustomer.nickname,
            id: selectedCustomer.id,
          }}
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
