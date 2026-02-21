"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { getCostCenters } from "@/lib/store";
import { GST_SLABS, TDS_SECTIONS } from "@/lib/constants";
import {
  ArrowLeft,
  Receipt,
  Camera,
  Upload,
  Sparkles,
  IndianRupee,
  Building2,
  Tag,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from "lucide-react";

export default function NewExpensePage() {
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [gstSlab, setGstSlab] = useState(18);
  const [amount, setAmount] = useState("");

  const amountNum = parseFloat(amount) || 0;
  const gstAmount = Math.round(amountNum * (gstSlab / 100) * 100) / 100;
  const cgst = Math.round(gstAmount / 2 * 100) / 100;
  const sgst = Math.round(gstAmount / 2 * 100) / 100;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Create Expense" description="Add a new expense manually or from a receipt">
        <Button variant="outline" asChild>
          <Link href="/expenses">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Receipt Upload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!receiptUploaded ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setReceiptUploaded(true)}
                >
                  <Camera className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-sm">Upload receipt for auto-fill</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag & drop, click to browse, or use camera
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Upload className="w-3 h-3 mr-1" />
                      Browse Files
                    </Button>
                    <Button variant="outline" size="sm">
                      <Camera className="w-3 h-3 mr-1" />
                      Camera
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Receipt scanned successfully</p>
                      <p className="text-xs text-emerald-600/60 dark:text-emerald-400/60">OCR extracted 5 fields with 94% confidence</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      AI Extracted
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-white/50 dark:bg-white/5 rounded px-2 py-1">
                      <span className="text-muted-foreground">Merchant: </span>
                      <span className="font-medium">Taj Hotels Mumbai</span>
                    </div>
                    <div className="bg-white/50 dark:bg-white/5 rounded px-2 py-1">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">₹12,500.00</span>
                    </div>
                    <div className="bg-white/50 dark:bg-white/5 rounded px-2 py-1">
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-medium">20 Feb 2026</span>
                    </div>
                    <div className="bg-white/50 dark:bg-white/5 rounded px-2 py-1">
                      <span className="text-muted-foreground">GSTIN: </span>
                      <span className="font-medium">27AABCU9603R1ZM</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Merchant Name</label>
                  <Input defaultValue={receiptUploaded ? "Taj Hotels Mumbai" : ""} placeholder="Enter merchant name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Amount (₹)</label>
                  <Input
                    type="number"
                    value={amount || (receiptUploaded ? "12500" : "")}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Date</label>
                  <Input type="date" defaultValue={receiptUploaded ? "2026-02-20" : ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Category</label>
                  <div className="flex items-center gap-2">
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option>Travel - Hotel</option>
                      <option>Travel - Air</option>
                      <option>Travel - Ground</option>
                      <option>Meals & Entertainment</option>
                      <option>Office Supplies</option>
                      <option>Software & Subscriptions</option>
                      <option>Client Entertainment</option>
                      <option>Training & Development</option>
                    </select>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      <Sparkles className="w-3 h-3 mr-0.5" />
                      AI
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Cost Center</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {getCostCenters().map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name} ({cc.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">GL Code</label>
                  <Input defaultValue="4100-001" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium">Business Purpose</label>
                  <Input placeholder="Describe the business purpose of this expense" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium">Attendees</label>
                  <Input placeholder="Names of attendees (for entertainment expenses)" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GST Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                GST Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Supplier GSTIN</label>
                  <Input defaultValue={receiptUploaded ? "27AABCU9603R1ZM" : ""} placeholder="e.g. 27AABCU9603R1ZM" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">HSN/SAC Code</label>
                  <Input placeholder="e.g. 9963" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">GST Slab</label>
                  <div className="flex gap-1">
                    {GST_SLABS.map((slab) => (
                      <Button
                        key={slab}
                        variant={gstSlab === slab ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGstSlab(slab)}
                        className="flex-1 text-xs"
                      >
                        {slab}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Place of Supply</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Same State (CGST + SGST)</option>
                    <option>Different State (IGST)</option>
                  </select>
                </div>
              </div>
              {amountNum > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">CGST ({gstSlab / 2}%)</p>
                      <p className="text-sm font-medium">₹{cgst.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SGST ({gstSlab / 2}%)</p>
                      <p className="text-sm font-medium">₹{sgst.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total GST</p>
                      <p className="text-sm font-bold">₹{gstAmount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TDS */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">TDS Deduction (if applicable)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">TDS Section</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Not Applicable</option>
                    {TDS_SECTIONS.map((sec) => (
                      <option key={sec.code} value={sec.code}>
                        {sec.label} ({sec.rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">PAN of Deductee</label>
                  <Input placeholder="e.g. ABCDE1234F" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">TDS Amount</label>
                  <Input placeholder="Auto-calculated" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" asChild>
              <Link href="/expenses">Cancel</Link>
            </Button>
            <Button variant="outline">Save as Draft</Button>
            <Button>
              <CheckCircle2 className="w-4 h-4" />
              Submit Expense
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Policy Check */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                AI Policy Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { policy: "Hotel Rate Limit (₹15,000)", status: "pass", message: "Within limit" },
                  { policy: "Receipt Required (> ₹500)", status: receiptUploaded ? "pass" : "fail", message: receiptUploaded ? "Receipt attached" : "No receipt" },
                  { policy: "MCC Policy", status: "pass", message: "Category allowed" },
                  { policy: "Budget Check", status: "warn", message: "Budget 68% utilized" },
                ].map((check) => (
                  <div key={check.policy} className="flex items-start gap-2 text-xs">
                    {check.status === "pass" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : check.status === "warn" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{check.policy}</p>
                      <p className="text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <Badge variant="outline" className="text-[9px]">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  AI Policy Agent validates on submit
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Upload receipt for automatic OCR extraction</p>
                <p>• Ensure GSTIN is valid for ITC claims</p>
                <p>• Add attendees for entertainment expenses</p>
                <p>• Business purpose is mandatory for all expenses</p>
                <p>• Expenses above ₹500 require receipt</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
