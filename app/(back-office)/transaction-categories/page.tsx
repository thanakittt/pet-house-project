import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";
import { TransactionCategoryManagement } from "@/modules/transaction-category/components/TransactionCategoryManagement";
import { listTransactionCategories } from "@/modules/transaction-category/queries/list-transaction-categories";

export default async function TransactionCategoriesPage() {
  // ป้องกัน route — ต้องเป็น staff เท่านั้น
  await requireStaff();

  // ดึงข้อมูลหมวดหมู่ธุรกรรมทั้งหมด
  const transactionCategories = await listTransactionCategories();

  if (!transactionCategories.success) {
    throw new Error(transactionCategories.error);
  }

  return (
    <>
      <SiteHeader title="จัดการหมวดหมู่ธุรกรรม" />
      <div className="p-6">
        <TransactionCategoryManagement
          transactionCategories={transactionCategories.data}
        />
      </div>
    </>
  );
}
