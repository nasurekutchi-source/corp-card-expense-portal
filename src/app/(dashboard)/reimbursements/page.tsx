"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getExpenseReports, getEmployees } from "@/lib/store";
import { formatDate, formatINRCompact } from "@/lib/utils";
import {
  Banknote,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Building2,
  CreditCard,
  Send,
  RefreshCw,
  IndianRupee,
  Landmark,
} from "lucide-react";

const reimbursements = getExpenseReports()
  .filter((r) => ["APPROVED", "PROCESSING", "PAID"].includes(r.status))
  .map((report, i) => {
    const emp = getEmployees().find((e) => e.id === report.employeeId);
    const tdsRate = i % 3 === 0 ? 10 : 0;
    const tdsAmount = Math.round(report.totalAmount * (tdsRate / 100));
    const rStatus = report.status as string;
    return {
      id: `reimb-${i + 1}`,
      reportId: report.id,
      reportNumber: report.reportNumber,
      employeeName: report.employeeName,
      employeeNumber: emp?.employeeNumber || "",
      department: report.department,
      grossAmount: report.totalAmount,
      tdsAmount,
      netAmount: report.totalAmount - tdsAmount,
      status: rStatus === "PAID" ? "PAID" : rStatus === "PROCESSING" ? "PROCESSING" : "PENDING" as const,
      paymentMethod: i % 2 === 0 ? "NEFT" : "IMPS",
      utr: rStatus === "PAID" ? `UTR${String(10000000 + i * 12345).slice(-10)}` : null,
      bankAccount: `XXXX${String(1000 + i).slice(-4)}`,
      ifsc: "SBIN0001234",
      bankName: ["State Bank of India", "HDFC Bank", "ICICI Bank"][i % 3],
      initiatedAt: rStatus === "APPROVED" ? null : "2026-02-19T10:00:00Z",
      paidAt: rStatus === "PAID" ? "2026-02-20T14:30:00Z" : null,
    };
  });

const paymentProfiles = getEmployees().slice(0, 5).map((emp, i) => ({
  id: `pp-${i + 1}`,
  employeeName: `${emp.firstName} ${emp.lastName}`,
  employeeNumber: emp.employeeNumber,
  type: i % 4 === 3 ? "UPI" : "BANK_ACCOUNT",
  bankName: ["State Bank of India", "HDFC Bank", "ICICI Bank", "Kotak Bank", "Axis Bank"][i],
  accountNumber: `XXXX${String(4000 + i).slice(-4)}`,
  ifsc: `${["SBIN", "HDFC", "ICIC", "KKBK", "UTIB"][i]}0001234`,
  upiVpa: i % 4 === 3 ? `${emp.firstName.toLowerCase()}@upi` : null,
  isPrimary: true,
  status: "VERIFIED",
}));

export default function ReimbursementsPage() {
  const stats = {
    pending: reimbursements.filter((r) => r.status === "PENDING").length,
    processing: reimbursements.filter((r) => r.status === "PROCESSING").length,
    paid: reimbursements.filter((r) => r.status === "PAID").length,
    totalPending: reimbursements.filter((r) => r.status !== "PAID").reduce((s, r) => s + r.netAmount, 0),
    totalPaid: reimbursements.filter((r) => r.status === "PAID").reduce((s, r) => s + r.netAmount, 0),
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Reimbursements" description="Track reimbursement status and payment profiles">
        <Button variant="outline">
          <Download className="w-4 h-4" />
          NEFT File
        </Button>
        <Button>
          <Send className="w-4 h-4" />
          Process Payments
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatINRCompact(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatINRCompact(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reimbursements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reimbursements">Reimbursement Queue</TabsTrigger>
          <TabsTrigger value="profiles">Payment Profiles</TabsTrigger>
        </TabsList>

        {/* Reimbursements */}
        <TabsContent value="reimbursements" className="space-y-3">
          {reimbursements.map((reimb) => (
            <Card key={reimb.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div className={`w-2 h-14 rounded-full ${
                    reimb.status === "PAID" ? "bg-emerald-500" :
                    reimb.status === "PROCESSING" ? "bg-blue-500" :
                    "bg-amber-500"
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{reimb.reportNumber}</p>
                      <StatusBadge status={reimb.status} />
                      {reimb.paymentMethod && (
                        <Badge variant="outline" className="text-[9px]">{reimb.paymentMethod}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{reimb.employeeName} ({reimb.employeeNumber})</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Landmark className="w-3 h-3" />
                        {reimb.bankName} &middot; A/C {reimb.bankAccount}
                      </span>
                      {reimb.utr && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono text-emerald-600">{reimb.utr}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount breakdown */}
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex justify-between gap-4">
                        <span>Gross</span>
                        <CurrencyDisplay amount={reimb.grossAmount} compact className="text-xs" />
                      </div>
                      {reimb.tdsAmount > 0 && (
                        <div className="flex justify-between gap-4 text-red-500">
                          <span>TDS</span>
                          <span>-<CurrencyDisplay amount={reimb.tdsAmount} compact className="text-xs inline" /></span>
                        </div>
                      )}
                    </div>
                    <div className="border-t mt-1 pt-1">
                      <CurrencyDisplay amount={reimb.netAmount} compact className="text-lg font-bold" />
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    {reimb.status === "PENDING" && (
                      <Button size="sm">
                        <Send className="w-3 h-3 mr-1" />
                        Initiate
                      </Button>
                    )}
                    {reimb.status === "PROCESSING" && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Check Status
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pipeline */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-[10px]">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Approved</span>
                  </div>
                  <div className={`h-px flex-1 ${reimb.status !== "PENDING" ? "bg-blue-500" : "bg-border"}`} />
                  <div className="flex items-center gap-1">
                    {reimb.status !== "PENDING" ? (
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Initiated</span>
                  </div>
                  <div className={`h-px flex-1 ${reimb.status === "PROCESSING" ? "bg-blue-500 animate-pulse" : reimb.status === "PAID" ? "bg-emerald-500" : "bg-border"}`} />
                  <div className="flex items-center gap-1">
                    {reimb.status === "PROCESSING" ? (
                      <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                    ) : reimb.status === "PAID" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Processing</span>
                  </div>
                  <div className={`h-px flex-1 ${reimb.status === "PAID" ? "bg-emerald-500" : "bg-border"}`} />
                  <div className="flex items-center gap-1">
                    {reimb.status === "PAID" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Paid</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment Profiles */}
        <TabsContent value="profiles" className="space-y-3">
          {paymentProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {profile.type === "UPI" ? (
                      <CreditCard className="w-5 h-5 text-primary" />
                    ) : (
                      <Landmark className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{profile.employeeName}</p>
                      <Badge variant="success" className="text-[9px]">{profile.status}</Badge>
                      {profile.isPrimary && (
                        <Badge variant="outline" className="text-[9px]">Primary</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {profile.type === "UPI" ? (
                        <span>UPI: {profile.upiVpa}</span>
                      ) : (
                        <>
                          <span>{profile.bankName}</span>
                          <span>&middot;</span>
                          <span>A/C: {profile.accountNumber}</span>
                          <span>&middot;</span>
                          <span>IFSC: {profile.ifsc}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{profile.type === "UPI" ? "UPI" : "Bank Account"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
