import type { Metadata } from "next";
import { requireOwner } from "@/lib/session";
import { TransactionPeriod } from "@/modules/transaction/types/transaction";
import { getTransactionSummary } from "@/modules/transaction/queries/get-transaction-summary";
import {
  listTransactions,
  parseTransactionPage,
} from "@/modules/transaction/queries/list-transactions";
import { listAllTransactionCategories } from "@/modules/transaction-category/queries/list-transaction-categories";
import { TransactionFilter } from "@/modules/transaction/components/TransactionFilter";
import { TransactionSummaryCards } from "@/modules/transaction/components/TransactionSummaryCards";
import { TransactionsBoard } from "@/modules/transaction/components/TransactionsBoard";
import { CreateTransactionDialog } from "@/modules/transaction/components/CreateTransactionDialog";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";

export const metadata: Metadata = {
  title: "จัดการบัญชี",
  description: "จัดการรายรับ-รายจ่ายของร้าน",
};

export default async function AccountingPage(props: {
  searchParams: Promise<{
    period?: string;
    categoryId?: string;
    date?: string;
    page?: string;
  }>;
}) {
  await requireOwner();

  const searchParams = await props.searchParams;
  const period = (searchParams.period as TransactionPeriod) || "MONTHLY";
  const categoryId = searchParams.categoryId;
  const date = searchParams.date;
  const page = parseTransactionPage(searchParams.page);

  // ดึงข้อมูลแบบขนาน
  const [summary, transactions, categoriesResult] = await Promise.all([
    getTransactionSummary(period, categoryId, date),
    listTransactions(period, categoryId, date, { page }),
    listAllTransactionCategories(),
  ]);

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <>
      <SiteHeader title="จัดการบัญชี" />
      <BackOfficeContainer>
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-end">
            <Suspense>
              <TransactionFilter categories={categories} />
            </Suspense>
          </div>
          {/* Summary Cards */}
          <TransactionSummaryCards summary={summary} />
          {/* Table Section */}
          <div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  รายการเคลื่อนไหวล่าสุด
                </span>
              </div>
              <div className="hidden lg:block">
                <CreateTransactionDialog categories={categories} />
              </div>
            </div>
            <TransactionsBoard
              transactionData={transactions}
              categories={categories}
            />
          </div>
        </div>
      </BackOfficeContainer>
    </>
  );
}
