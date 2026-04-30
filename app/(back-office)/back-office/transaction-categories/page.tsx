import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";
import { TransactionCategoryManagement } from "@/modules/transaction-category/components/TransactionCategoryManagement";
import {
  listTransactionCategories,
  parseTransactionCategoryPage,
  parseTransactionCategoryTypeFilter,
} from "@/modules/transaction-category/queries/list-transaction-categories";

type TransactionCategoriesPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
  }>;
};

export default async function TransactionCategoriesPage({
  searchParams,
}: TransactionCategoriesPageProps) {
  await requireStaff();

  const query = await searchParams;
  const transactionCategories = await listTransactionCategories({
    page: parseTransactionCategoryPage(query.page),
    q: query.q,
    type: parseTransactionCategoryTypeFilter(query.type),
  });

  if (!transactionCategories.success) {
    throw new Error(transactionCategories.error);
  }

  return (
    <>
      <SiteHeader title="จัดการหมวดหมู่ธุรกรรม" />
      <div className="p-6">
        <TransactionCategoryManagement {...transactionCategories.data} />
      </div>
    </>
  );
}
