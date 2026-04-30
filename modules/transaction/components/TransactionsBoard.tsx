"use client";

import { useState } from "react";
import { ManagementPagination } from "@/components/shared/ManagementListControls";
import { TransactionCategory } from "@/modules/transaction-category/types/transaction-category";
import type { ListTransactionsResult } from "../queries/list-transactions";
import { Transaction } from "../types/transaction";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { TransactionsTable } from "./TransactionsTable";
import { UpdateTransactionDialog } from "./UpdateTransactionDialog";

interface TransactionsBoardProps {
  categories: TransactionCategory[];
  transactionData: ListTransactionsResult;
}

export function TransactionsBoard({
  categories,
  transactionData,
}: TransactionsBoardProps) {
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  return (
    <div className="mt-6">
      <TransactionsTable
        transactions={transactionData.transactions}
        onEdit={setTransactionToEdit}
        onDelete={setTransactionToDelete}
      />

      <ManagementPagination
        page={transactionData.page}
        pageSize={transactionData.pageSize}
        total={transactionData.total}
        totalPages={transactionData.totalPages}
      />

      <UpdateTransactionDialog
        transaction={transactionToEdit}
        categories={categories}
        onClose={() => setTransactionToEdit(null)}
      />

      <DeleteTransactionDialog
        transaction={transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
      />
    </div>
  );
}
