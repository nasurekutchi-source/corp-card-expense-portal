import { NextRequest, NextResponse } from "next/server";
import {
  getTransactions,
  getExpenses,
  getExpenseReports,
  getStore,
} from "@/lib/repository";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "transactions";

  let csv = "";
  let filename = "";

  switch (type) {
    case "spend-summary": {
      const expenses = await getExpenses();
      const categoryMap = new Map<string, { count: number; total: number }>();
      expenses.forEach((e) => {
        const cat = e.category || "Other";
        const existing = categoryMap.get(cat) || { count: 0, total: 0 };
        categoryMap.set(cat, {
          count: existing.count + 1,
          total: existing.total + e.amount,
        });
      });
      csv = "Category,Transaction Count,Total Amount (INR)\n";
      Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([cat, data]) => {
          csv += `"${cat}",${data.count},${data.total.toFixed(2)}\n`;
        });
      filename = "spend-summary";
      break;
    }

    case "transactions": {
      const txns = await getTransactions();
      csv =
        "Transaction ID,Date,Card Last 4,Employee,Merchant,MCC Category,Amount (INR),Status,Channel,City\n";
      txns.forEach((t) => {
        csv += `"${t.id}","${t.timestamp}","${t.cardLast4}","${t.employeeName}","${t.merchantName}","${t.mccCategory}",${t.amount.toFixed(2)},"${t.status}","${t.channel}","${t.location?.city || ""}"\n`;
      });
      filename = "transaction-detail";
      break;
    }

    case "budget": {
      const store = await getStore();
      csv =
        "Department,Division,Budget (INR),Utilized (INR),Utilization %\n";
      store.departments.forEach((dept) => {
        const div = store.divisions.find((d) => d.id === dept.divisionId);
        const deptEmps = store.employees.filter(
          (e) => e.departmentId === dept.id
        );
        const empIds = new Set(deptEmps.map((e) => e.id));
        const spent = store.transactions
          .filter((t) => empIds.has(t.employeeId) && t.status === "SETTLED")
          .reduce((sum, t) => sum + t.amount, 0);
        const util =
          dept.budget > 0
            ? ((spent / dept.budget) * 100).toFixed(1)
            : "0.0";
        csv += `"${dept.name}","${div?.name || ""}",${dept.budget.toFixed(2)},${spent.toFixed(2)},${util}%\n`;
      });
      filename = "budget-vs-actual";
      break;
    }

    case "gst": {
      const expenses = await getExpenses();
      csv =
        "Expense ID,Employee,Merchant,Amount (INR),GSTIN,CGST,SGST,IGST,Total GST\n";
      expenses
        .filter((e) => e.gstDetails)
        .forEach((e) => {
          const g = e.gstDetails;
          const totalGst = (g?.cgst || 0) + (g?.sgst || 0) + (g?.igst || 0);
          csv += `"${e.id}","${e.employeeName}","${e.merchantName}",${e.amount.toFixed(2)},"${g?.gstin || ""}",${(g?.cgst || 0).toFixed(2)},${(g?.sgst || 0).toFixed(2)},${(g?.igst || 0).toFixed(2)},${totalGst.toFixed(2)}\n`;
        });
      filename = "gst-summary";
      break;
    }

    case "employee-expense": {
      const expenses = await getExpenses();
      const empMap = new Map<
        string,
        { name: string; count: number; total: number; categories: Set<string> }
      >();
      expenses.forEach((e) => {
        const existing = empMap.get(e.employeeId) || {
          name: e.employeeName,
          count: 0,
          total: 0,
          categories: new Set<string>(),
        };
        existing.count++;
        existing.total += e.amount;
        existing.categories.add(e.category);
        empMap.set(e.employeeId, existing);
      });
      csv = "Employee,Expense Count,Total Amount (INR),Categories\n";
      Array.from(empMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([, data]) => {
          csv += `"${data.name}",${data.count},${data.total.toFixed(2)},"${Array.from(data.categories).join(", ")}"\n`;
        });
      filename = "employee-expense";
      break;
    }

    case "ap-export": {
      const reports = (await getExpenseReports()).filter(
        (r) =>
          r.status === "APPROVED" ||
          r.status === "PROCESSING" ||
          r.status === "PAID"
      );
      csv =
        "Report Number,Employee,Department,Amount (INR),Status,Submitted Date,Approved Date\n";
      reports.forEach((r) => {
        csv += `"${r.reportNumber}","${r.employeeName}","${r.department}",${r.totalAmount.toFixed(2)},"${r.status}","${r.submittedAt || ""}","${r.approvedAt || ""}"\n`;
      });
      filename = "ap-export";
      break;
    }

    default:
      return NextResponse.json(
        { error: "Unknown export type" },
        { status: 400 }
      );
  }

  const now = new Date().toISOString().split("T")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${now}.csv"`,
    },
  });
}
