"use client";

import { useState } from "react";
import { Transaction } from "../types/transaction";
import { TransactionCategory } from "@/modules/transaction-category/types/transaction-category";
import { TransactionsTable } from "./TransactionsTable";
import { UpdateTransactionDialog } from "./UpdateTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";

interface TransactionsBoardProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
}

export function TransactionsBoard({
  transactions,
  categories,
}: TransactionsBoardProps) {
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  return (
    <div className="mt-6">
      <TransactionsTable
        transactions={transactions}
        onEdit={setTransactionToEdit}
        onDelete={setTransactionToDelete}
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
