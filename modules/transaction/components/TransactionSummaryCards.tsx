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
          <div className="bg-green-100 p-2 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalIncome)}
          </div>
        </CardContent>
      </Card>

      {/* รายจ่ายรวม */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">รายจ่ายรวม</CardTitle>
          <div className="bg-red-100 p-2 rounded-full">
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalExpense)}
          </div>
        </CardContent>
      </Card>

      {/* กำไรสุทธิ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm md:text-base font-medium">กำไรสุทธิ</CardTitle>
          <div className={`${isNetProfitPositive ? "bg-green-100" : "bg-red-100"} p-2 rounded-full`}>
            <DollarSign className={`h-4 w-4 ${isNetProfitPositive ? "text-green-600" : "text-red-600"}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isNetProfitPositive ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(summary.netProfit)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
