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
import { PencilIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreatePetBreedDialog } from "./CreatePetBreedDialog";
import { PetBreed } from "../types/pet-breed";
import { UpdatePetBreedDialog } from "./UpdatePetBreedDialog";
import { DeletePetBreedDialog } from "./DeletePetBreedDialog";

export function PetBreedManagement({ petBreeds }: { petBreeds: PetBreed[] }) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPetBreed, setSelectedPetBreed] = useState<PetBreed | null>(
    null,
  );  

  return (
    <>
      <main className="mx-auto p-5 max-w-6xl h-svh">
        <header className="mb-2">
          <h1 className="font-bold text-2xl">จัดการพันธุ์สัตว์</h1>
        </header>
        <Separator className="mb-5" />
        <div className="justify-between items-center gap-3 grid grid-cols-2 mb-5">
          <div className="flex items-center gap-3">
            {/* <InputGroup className="py-5">
              <InputGroupInput
                placeholder="ค้นหาด้วยชื่อสายพันธุ์"
                className="text-sm"
              />
              <InputGroupAddon>
                <SearchIcon className="size-3.5" />
              </InputGroupAddon>
            </InputGroup> */}
          </div>
          <div className="flex justify-end">
            <CreatePetBreedDialog />
          </div>
        </div>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>ชื่อสายพันธุ์</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {petBreeds && petBreeds.length > 0 ? (
                petBreeds.map((petBreed) => (
                  <TableRow key={petBreed.id}>
                    <TableCell>{petBreed.name}</TableCell>
                    <TableCell>
                      {petBreed.type === "CAT"
                        ? "แมว"
                        : petBreed.type === "DOG"
                          ? "หมา"
                          : "อื่นๆ"}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="แก้ไขข้อมูล"
                        onClick={() => {
                          setSelectedPetBreed(petBreed);
                          setIsUpdateDialogOpen(true);
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="ลบข้อมูล"
                        onClick={() => {
                          setSelectedPetBreed(petBreed);
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
                  <TableCell colSpan={3} className="py-10 text-center">
                    ไม่มีข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {selectedPetBreed && petBreeds && petBreeds.length > 0 && (
        <>
        <UpdatePetBreedDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          petBreed={selectedPetBreed}
        />

        <DeletePetBreedDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          petBreed={selectedPetBreed}
        />
        </>
      )}
    </>
  );
}
