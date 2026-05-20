import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionSummary } from "../types/transaction";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TransactionSummaryCardsProps {
  summary: TransactionSummary;
}

export function TransactionSummaryCards({ summary }: TransactionSummaryCardsProps) {
  const isNetProfitPositive = summary.netProfit >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* รายรับรวม */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">รายรับรวม</CardTitle>
          <div className="bg-emerald-500/10 p-2 rounded-full">
            <TrendingUp className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      {/* รายจ่ายรวม */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">รายจ่ายรวม</CardTitle>
          <div className="bg-destructive/10 p-2 rounded-full">
            <TrendingDown className="text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(summary.totalExpense)}
          </div>
        </CardContent>
      </Card>

      {/* กำไรสุทธิ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">กำไรสุทธิ</CardTitle>
          <div className={`${isNetProfitPositive ? "bg-emerald-500/10" : "bg-destructive/10"} p-2 rounded-full`}>
            <DollarSign className={isNetProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isNetProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {formatCurrency(summary.netProfit)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
