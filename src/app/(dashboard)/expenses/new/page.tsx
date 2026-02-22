"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { getCostCenters, getTransactions, getActivePolicies, getExpenses } from "@/lib/store";
import type { Transaction, Policy, CostCenter } from "@/lib/store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TYPES,
  GST_SLABS,
  TDS_SECTIONS,
  MCC_CATEGORIES,
} from "@/lib/constants";
import type { ExpenseCategory } from "@/lib/constants";
import { useModuleConfig } from "@/components/providers/module-config-provider";
import { toast } from "sonner";
import {
  ArrowLeft,
  Receipt,
  Camera,
  Upload,
  Sparkles,
  IndianRupee,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Shield,
  XCircle,
  CreditCard,
  PenLine,
  ChevronDown,
  ChevronUp,
  Loader2,
  Tag,
  X,
  Plus,
  Building2,
  Percent,
} from "lucide-react";

// ---------------------------------------------------------------------------
// MCC to EXPENSE_CATEGORIES mapping
// ---------------------------------------------------------------------------
const MCC_TO_CATEGORY: Record<string, { cat: string; sub: string }> = {};
Object.entries(MCC_CATEGORIES).forEach(([mcc, meta]) => {
  const l = meta.label;
  if (l === "Hotels") MCC_TO_CATEGORY[mcc] = { cat: "TRAVEL", sub: "TRAVEL_HOTEL" };
  else if (l === "Airlines") MCC_TO_CATEGORY[mcc] = { cat: "TRAVEL", sub: "TRAVEL_AIR" };
  else if (l === "Car Rental") MCC_TO_CATEGORY[mcc] = { cat: "TRAVEL", sub: "TRAVEL_CAR_RENTAL" };
  else if (l === "Restaurants" || l === "Fast Food") MCC_TO_CATEGORY[mcc] = { cat: "MEALS", sub: "MEALS_BUSINESS" };
  else if (l === "Software") MCC_TO_CATEGORY[mcc] = { cat: "TECHNOLOGY", sub: "TECH_SOFTWARE" };
  else if (l === "Office Equipment") MCC_TO_CATEGORY[mcc] = { cat: "OFFICE", sub: "OFFICE_SUPPLIES" };
  else if (l === "Business Services") MCC_TO_CATEGORY[mcc] = { cat: "PROFESSIONAL", sub: "PROF_CONSULTING" };
  else if (l === "Medical" || l === "Health Services") MCC_TO_CATEGORY[mcc] = { cat: "EMPLOYEE", sub: "EMP_WELLNESS" };
  else if (l === "Groceries") MCC_TO_CATEGORY[mcc] = { cat: "MISC", sub: "MISC_OTHER" };
  else if (l === "Gas Station") MCC_TO_CATEGORY[mcc] = { cat: "TRAVEL", sub: "TRAVEL_GROUND" };
  else MCC_TO_CATEGORY[mcc] = { cat: "MISC", sub: "MISC_OTHER" };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCategoryByCode(code: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.code === code);
}

function glCodeForSub(catCode: string, subCode: string): string {
  const cat = getCategoryByCode(catCode);
  if (!cat) return "4990-001";
  const sub = cat.subcategories.find((s) => s.code === subCode);
  return sub?.glPrefix ? `${sub.glPrefix}-001` : "4990-001";
}

// Currencies for Indian corporates
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED", "JPY"] as const;

// ---------------------------------------------------------------------------
// Policy check types
// ---------------------------------------------------------------------------
interface PolicyCheck {
  policy: string;
  status: "pass" | "warn" | "fail";
  message: string;
  severity: string;
}

// ---------------------------------------------------------------------------
// Allocation entry
// ---------------------------------------------------------------------------
interface Allocation {
  costCenterId: string;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  expenseType: string;
  merchantName: string;
  amount: string;
  currency: string;
  date: string;
  categoryCode: string;
  subcategoryCode: string;
  description: string;
  glCode: string;
  project: string;
  supplierGstin: string;
  hsnSacCode: string;
  gstSlab: number;
  placeOfSupply: string;
  tdsApplicable: boolean;
  tdsSection: string;
  pan: string;
  attendees: string;
  hasReceipt: boolean;
  receiptFilename: string;
  transactionId: string | null;
  cardId: string;
  tags: string[];
}

const initialFormState: FormState = {
  expenseType: "CARD",
  merchantName: "",
  amount: "",
  currency: "INR",
  date: new Date().toISOString().split("T")[0],
  categoryCode: "TRAVEL",
  subcategoryCode: "TRAVEL_HOTEL",
  description: "",
  glCode: "4120-001",
  project: "",
  supplierGstin: "",
  hsnSacCode: "",
  gstSlab: 18,
  placeOfSupply: "same",
  tdsApplicable: false,
  tdsSection: "",
  pan: "",
  attendees: "",
  hasReceipt: false,
  receiptFilename: "",
  transactionId: null,
  cardId: "",
  tags: [],
};

// =========================================================================
// Component
// =========================================================================
export default function NewExpensePage() {
  const router = useRouter();
  const { config } = useModuleConfig();
  const [activeTab, setActiveTab] = useState("manual");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [showGst, setShowGst] = useState(false);
  const [showTds, setShowTds] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [txnSearch, setTxnSearch] = useState("");
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [splitMode, setSplitMode] = useState(false);

  // Duplicate detection state
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // GSTIN validation state (CIGNET GSP integration)
  const [gstinValid, setGstinValid] = useState<boolean | null>(null);
  const [gstinData, setGstinData] = useState<any>(null);
  const [gstinChecking, setGstinChecking] = useState(false);

  // Receipt upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [ocrFields, setOcrFields] = useState<Record<string, any> | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<Record<string, number> | null>(null);

  // Load reference data
  useEffect(() => {
    const cc = getCostCenters();
    setCostCenters(cc);
    if (cc.length > 0) {
      setAllocations([{ costCenterId: cc[0].id, percentage: 100 }]);
    }
    const allTxns = getTransactions();
    const existingExpenses = getExpenses();
    const linkedIds = new Set(existingExpenses.map((e) => e.transactionId).filter(Boolean));
    setTransactions(
      allTxns.filter((t) => !linkedIds.has(t.id) && t.status === "SETTLED").slice(0, 50)
    );
    setPolicies(getActivePolicies());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced duplicate detection when amount + merchant change
  useEffect(() => {
    if (!form.amount || !form.merchantName || parseFloat(form.amount) === 0) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const params = new URLSearchParams({
          amount: form.amount,
          merchant: form.merchantName,
          date: form.date || new Date().toISOString(),
        });
        const res = await fetch(`/api/v1/expenses/duplicates?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDuplicates(data);
        }
      } catch {
        // silently ignore — duplicate check is best-effort
      }
      setCheckingDuplicates(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [form.amount, form.merchantName, form.date]);

  // Debounced GSTIN validation via CIGNET GSP
  useEffect(() => {
    const gstin = form.supplierGstin;
    if (!gstin || gstin.length < 15) {
      setGstinValid(null);
      setGstinData(null);
      return;
    }
    const timer = setTimeout(async () => {
      setGstinChecking(true);
      try {
        const res = await fetch(`/api/v1/gstin?gstin=${gstin}`);
        const data = await res.json();
        setGstinValid(data.valid === true);
        setGstinData(data.valid ? data.data : null);
      } catch {
        setGstinValid(null);
      }
      setGstinChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.supplierGstin]);

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------
  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "categoryCode" && typeof value === "string") {
        const cat = getCategoryByCode(value);
        if (cat && cat.subcategories.length > 0) {
          next.subcategoryCode = cat.subcategories[0].code;
          next.glCode = glCodeForSub(value, cat.subcategories[0].code);
        }
      }
      if (field === "subcategoryCode" && typeof value === "string") {
        next.glCode = glCodeForSub(prev.categoryCode, value);
      }
      return next;
    });
  }, []);

  const amountNum = parseFloat(form.amount) || 0;

  // GST calculations
  const gstAmount = useMemo(() => Math.round(amountNum * (form.gstSlab / 100) * 100) / 100, [amountNum, form.gstSlab]);
  const cgst = useMemo(() => (form.placeOfSupply === "same" ? Math.round((gstAmount / 2) * 100) / 100 : 0), [gstAmount, form.placeOfSupply]);
  const sgst = useMemo(() => (form.placeOfSupply === "same" ? Math.round((gstAmount / 2) * 100) / 100 : 0), [gstAmount, form.placeOfSupply]);
  const igst = useMemo(() => (form.placeOfSupply === "different" ? gstAmount : 0), [gstAmount, form.placeOfSupply]);

  // TDS calculation
  const tdsRate = useMemo(() => {
    if (!form.tdsApplicable || !form.tdsSection) return 0;
    const sec = TDS_SECTIONS.find((s) => s.code === form.tdsSection);
    return sec ? sec.rate : 0;
  }, [form.tdsApplicable, form.tdsSection]);
  const tdsAmount = useMemo(() => Math.round(amountNum * (tdsRate / 100) * 100) / 100, [amountNum, tdsRate]);

  // -----------------------------------------------------------------------
  // Policy validation
  // -----------------------------------------------------------------------
  const policyChecks = useMemo((): PolicyCheck[] => {
    const checks: PolicyCheck[] = [];
    const displayCategory = `${getCategoryByCode(form.categoryCode)?.label || ""} - ${
      getCategoryByCode(form.categoryCode)?.subcategories.find((s) => s.code === form.subcategoryCode)?.label || ""
    }`;

    for (const policy of policies) {
      const rules = policy.rules as Record<string, unknown>;
      if (policy.type === "CATEGORY" && rules.maxAmount) {
        const maxAmount = rules.maxAmount as number;
        if (amountNum > 0 && amountNum > maxAmount) {
          checks.push({
            policy: policy.name,
            status: policy.severity === "HARD" ? "fail" : "warn",
            message: `Amount exceeds limit of \u20B9${maxAmount.toLocaleString("en-IN")}`,
            severity: policy.severity,
          });
        } else if (amountNum > 0) {
          checks.push({
            policy: policy.name,
            status: "pass",
            message: `Within \u20B9${maxAmount.toLocaleString("en-IN")} limit`,
            severity: policy.severity,
          });
        }
      }
      if (policy.type === "RECEIPT" && rules.threshold) {
        const threshold = rules.threshold as number;
        if (amountNum > threshold) {
          checks.push({
            policy: policy.name,
            status: form.hasReceipt ? "pass" : "fail",
            message: form.hasReceipt ? "Receipt attached" : `Receipt required for expenses > \u20B9${threshold}`,
            severity: policy.severity,
          });
        } else if (amountNum > 0) {
          checks.push({ policy: policy.name, status: "pass", message: `Below \u20B9${threshold} threshold`, severity: policy.severity });
        }
      }
      if (policy.type === "CATEGORY" && rules.requiresApproval) {
        checks.push({ policy: policy.name, status: "warn", message: "Manager approval will be required", severity: policy.severity });
      }
    }

    // Budget check
    if (amountNum > 0 && allocations.length > 0) {
      for (const alloc of allocations) {
        const cc = costCenters.find((c) => c.id === alloc.costCenterId);
        if (cc && cc.budget > 0) {
          const allocAmount = amountNum * (alloc.percentage / 100);
          const utilPct = Math.round(((cc.utilized + allocAmount) / cc.budget) * 100);
          checks.push({
            policy: `Budget: ${cc.name}`,
            status: utilPct > 90 ? "warn" : "pass",
            message: utilPct > 90 ? `Will be ${utilPct}% utilized` : `At ${utilPct}% after this expense`,
            severity: "SOFT",
          });
        }
      }
    }
    // Suppress unused variable warning
    void displayCategory;
    return checks;
  }, [policies, form.categoryCode, form.subcategoryCode, form.hasReceipt, amountNum, allocations, costCenters]);

  const overallPolicyStatus = useMemo(() => {
    if (policyChecks.some((c) => c.status === "fail" && c.severity === "HARD")) return "HARD_VIOLATION";
    if (policyChecks.some((c) => c.status === "fail" || c.status === "warn")) return "SOFT_VIOLATION";
    return "COMPLIANT";
  }, [policyChecks]);

  // -----------------------------------------------------------------------
  // Receipt upload — real file upload to /api/v1/receipts with OCR
  // -----------------------------------------------------------------------
  const handleReceiptUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      // Show client-side preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to API
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/receipts", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const receipt = await res.json();

      setReceiptId(receipt.id);
      setOcrFields(receipt.ocrData);
      setOcrConfidence(receipt.ocrConfidence);

      // Auto-fill form fields from OCR data
      setForm((prev) => ({
        ...prev,
        hasReceipt: true,
        receiptFilename: file.name,
        merchantName: receipt.ocrData.merchantName || prev.merchantName,
        amount: receipt.ocrData.amount ? String(receipt.ocrData.amount) : prev.amount,
        date: receipt.ocrData.date || prev.date,
        currency: receipt.ocrData.currency || prev.currency,
        supplierGstin: receipt.ocrData.gstin || prev.supplierGstin,
        categoryCode: receipt.ocrData.category || prev.categoryCode,
        subcategoryCode: receipt.ocrData.subcategory || prev.subcategoryCode,
        glCode: receipt.ocrData.category && receipt.ocrData.subcategory
          ? glCodeForSub(receipt.ocrData.category, receipt.ocrData.subcategory)
          : prev.glCode,
      }));

      const fieldCount = Object.keys(receipt.ocrData).length;
      const confidence = Math.round((receipt.ocrConfidence?.overall || 0) * 100);
      toast.success(`Receipt uploaded — OCR extracted ${fieldCount} fields (${confidence}% confidence)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Receipt upload failed");
      setReceiptPreview(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const clearReceipt = useCallback(() => {
    setForm((p: FormState) => ({ ...p, hasReceipt: false, receiptFilename: "" }));
    setReceiptId(null);
    setReceiptPreview(null);
    setOcrFields(null);
    setOcrConfidence(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // -----------------------------------------------------------------------
  // Transaction selection
  // -----------------------------------------------------------------------
  const selectTransaction = useCallback((txn: Transaction) => {
    const mapped = MCC_TO_CATEGORY[txn.mcc] || { cat: "MISC", sub: "MISC_OTHER" };
    setSelectedTxnId(txn.id);
    setForm((prev) => ({
      ...prev,
      transactionId: txn.id,
      merchantName: txn.merchantName,
      amount: txn.amount.toFixed(2),
      date: txn.timestamp.split("T")[0],
      categoryCode: mapped.cat,
      subcategoryCode: mapped.sub,
      glCode: glCodeForSub(mapped.cat, mapped.sub),
      expenseType: "CARD",
      cardId: txn.cardId,
      hasReceipt: txn.hasReceipt,
      receiptFilename: txn.hasReceipt ? "transaction_receipt.jpg" : "",
    }));
    setActiveTab("manual");
    toast.success(`Transaction from ${txn.merchantName} loaded`);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!txnSearch.trim()) return transactions;
    const s = txnSearch.toLowerCase();
    return transactions.filter(
      (t) =>
        t.merchantName.toLowerCase().includes(s) ||
        t.employeeName.toLowerCase().includes(s) ||
        t.mccCategory.toLowerCase().includes(s) ||
        t.cardLast4.includes(s)
    );
  }, [transactions, txnSearch]);

  // -----------------------------------------------------------------------
  // Tags management
  // -----------------------------------------------------------------------
  const addTag = useCallback(() => {
    const val = tagInput.trim();
    if (val && !form.tags.includes(val)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, val] }));
    }
    setTagInput("");
  }, [tagInput, form.tags]);

  const removeTag = useCallback((tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  // -----------------------------------------------------------------------
  // Allocation management
  // -----------------------------------------------------------------------
  const addAllocation = useCallback(() => {
    setAllocations((prev) => {
      const usedIds = new Set(prev.map((a) => a.costCenterId));
      const available = costCenters.find((c) => !usedIds.has(c.id));
      if (!available) return prev;
      return [...prev, { costCenterId: available.id, percentage: 0 }];
    });
  }, [costCenters]);

  const updateAllocation = useCallback((idx: number, field: keyof Allocation, value: string | number) => {
    setAllocations((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }, []);

  const removeAllocation = useCallback((idx: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const allocationTotal = useMemo(() => allocations.reduce((sum, a) => sum + a.percentage, 0), [allocations]);

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------
  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];
    if (!form.merchantName.trim()) errors.push("Merchant name is required");
    if (!form.amount || amountNum <= 0) errors.push("Amount must be greater than 0");
    if (!form.date) errors.push("Date is required");
    if (!form.categoryCode) errors.push("Category is required");
    if (splitMode && Math.abs(allocationTotal - 100) > 0.01) errors.push("Cost center allocation must total 100%");
    if (!splitMode && allocations.length === 0) errors.push("Cost center is required");
    return errors;
  }, [form, amountNum, splitMode, allocationTotal, allocations.length]);

  // -----------------------------------------------------------------------
  // Submit / Save
  // -----------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (asDraft: boolean) => {
      if (!asDraft) {
        const errors = validateForm();
        if (errors.length > 0) {
          errors.forEach((e) => toast.error(e));
          return;
        }
      }
      setSubmitting(true);
      try {
        const cat = getCategoryByCode(form.categoryCode);
        const sub = cat?.subcategories.find((s) => s.code === form.subcategoryCode);
        const categoryLabel = `${cat?.label || ""} - ${sub?.label || ""}`;

        const payload = {
          type: form.expenseType,
          merchantName: form.merchantName,
          amount: amountNum,
          originalCurrency: form.currency,
          date: new Date(form.date).toISOString(),
          category: categoryLabel,
          businessPurpose: form.description,
          costCenterId: allocations[0]?.costCenterId || "",
          glCode: form.glCode,
          hasReceipt: form.hasReceipt,
          receiptId: receiptId || undefined,
          transactionId: form.transactionId,
          policyStatus: asDraft ? "COMPLIANT" : overallPolicyStatus,
          employeeId: "emp-5",
          employeeName: "Vikram Singh",
          gstDetails: config.gstCompliance
            ? { gstin: form.supplierGstin, cgst, sgst, igst }
            : { gstin: "", cgst: 0, sgst: 0, igst: 0 },
        };

        const res = await fetch("/api/v1/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create expense");
        }
        toast.success(asDraft ? "Expense saved as draft" : "Expense submitted successfully");
        router.push("/expenses");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create expense");
      } finally {
        setSubmitting(false);
      }
    },
    [form, amountNum, overallPolicyStatus, cgst, sgst, igst, validateForm, router, allocations, config.gstCompliance, receiptId]
  );

  // -----------------------------------------------------------------------
  // Active subcategories
  // -----------------------------------------------------------------------
  const activeCat = getCategoryByCode(form.categoryCode);
  const subcategories = activeCat?.subcategories || [];

  // Shared select class
  const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Create Expense" description="Add a new expense manually or from a card transaction">
        <Button variant="outline" asChild>
          <Link href="/expenses">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================================================================= */}
        {/* Main Form Area (left 2 cols)                                      */}
        {/* ================================================================= */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1 gap-2">
                <PenLine className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="transaction" className="flex-1 gap-2">
                <CreditCard className="w-4 h-4" />
                From Transaction
              </TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/* Tab 1 : Manual Entry                                          */}
            {/* ============================================================= */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              {/* Linked transaction banner */}
              {form.transactionId && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg px-4 py-3">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-blue-700 dark:text-blue-300">Linked to card transaction</span>
                    <span className="text-blue-600/70 ml-2">{form.transactionId}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800"
                    onClick={() => { setForm((p) => ({ ...p, transactionId: null, cardId: "" })); setSelectedTxnId(null); }}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* ---- Receipt Upload ---- */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                  />

                  {!form.hasReceipt ? (
                    /* --- Upload area --- */
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleReceiptUpload(file);
                      }}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-2" />
                          <p className="font-medium text-sm">Uploading &amp; extracting data...</p>
                          <p className="text-xs text-muted-foreground mt-1">Running OCR on your receipt</p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                          <p className="font-medium text-sm">Upload receipt for auto-fill</p>
                          <p className="text-xs text-muted-foreground mt-1">Drag &amp; drop, click to browse, or use camera</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Supports JPEG, PNG, WebP, HEIC, PDF (max 5MB)</p>
                          <div className="flex justify-center gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                              <Upload className="w-3 h-3 mr-1" /> Browse
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                              <Camera className="w-3 h-3 mr-1" /> Camera
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* --- Receipt uploaded success state --- */
                    <div className="space-y-3">
                      <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          {receiptPreview && receiptPreview.startsWith("data:image") ? (
                            <img
                              src={receiptPreview}
                              alt="Receipt"
                              className="w-12 h-12 object-cover rounded border"
                            />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Receipt uploaded</p>
                            <p className="text-xs text-emerald-600/60 truncate">
                              {form.receiptFilename}
                              {ocrFields && <> &mdash; OCR extracted {Object.keys(ocrFields).length} fields</>}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0">
                            <Sparkles className="w-3 h-3 mr-0.5" />AI Extracted
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 shrink-0" onClick={clearReceipt}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* OCR Confidence Bars */}
                      {ocrConfidence && (
                        <div className="bg-slate-50 dark:bg-slate-500/5 border border-slate-200 dark:border-slate-500/20 rounded-lg p-3">
                          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> OCR Confidence Scores
                          </p>
                          <div className="space-y-1.5">
                            {Object.entries(ocrConfidence)
                              .filter(([key]) => key !== "overall")
                              .map(([key, rawVal]) => {
                                const val = rawVal as number;
                                return (
                                <div key={key} className="flex items-center gap-2 text-[11px]">
                                  <span className="w-24 text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        val >= 0.95
                                          ? "bg-emerald-500"
                                          : val >= 0.9
                                          ? "bg-blue-500"
                                          : val >= 0.85
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${Math.round(val * 100)}%` }}
                                    />
                                  </div>
                                  <span className="w-10 text-right font-medium">{Math.round(val * 100)}%</span>
                                </div>
                                );
                              })}
                            <div className="flex items-center gap-2 text-[11px] pt-1 border-t mt-1">
                              <span className="w-24 font-medium">Overall</span>
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    ocrConfidence.overall >= 0.95 ? "bg-emerald-500" : ocrConfidence.overall >= 0.9 ? "bg-blue-500" : "bg-amber-500"
                                  }`}
                                  style={{ width: `${Math.round(ocrConfidence.overall * 100)}%` }}
                                />
                              </div>
                              <span className="w-10 text-right font-bold">{Math.round(ocrConfidence.overall * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Re-upload button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          clearReceipt();
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" /> Upload Different Receipt
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ---- Expense Details ---- */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Expense Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expense Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Expense Type <span className="text-red-500">*</span></label>
                      <select className={selectCls} value={form.expenseType}
                        onChange={(e) => updateField("expenseType", e.target.value)}>
                        {Object.entries(EXPENSE_TYPES).map(([key, value]) => (
                          <option key={key} value={value}>{key.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>

                    {/* Merchant */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Merchant Name <span className="text-red-500">*</span></label>
                      <Input value={form.merchantName} onChange={(e) => updateField("merchantName", e.target.value)}
                        placeholder="Enter merchant name" className="h-9" />
                    </div>

                    {/* Amount + Currency */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Amount <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <select className={`${selectCls} w-20 shrink-0`} value={form.currency}
                          onChange={(e) => updateField("currency", e.target.value)}>
                          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {form.currency === "INR" ? "\u20B9" : form.currency === "USD" ? "$" : form.currency === "EUR" ? "\u20AC" : form.currency === "GBP" ? "\u00A3" : ""}
                          </span>
                          <Input type="number" className="pl-7 h-9" value={form.amount}
                            onChange={(e) => updateField("amount", e.target.value)}
                            placeholder="0.00" min="0" step="0.01" />
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Date <span className="text-red-500">*</span></label>
                      <Input type="date" className="h-9" value={form.date}
                        onChange={(e) => updateField("date", e.target.value)} />
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Category <span className="text-red-500">*</span></label>
                      <select className={selectCls} value={form.categoryCode}
                        onChange={(e) => updateField("categoryCode", e.target.value)}>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.code} value={cat.code}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Subcategory <span className="text-red-500">*</span></label>
                      <select className={selectCls} value={form.subcategoryCode}
                        onChange={(e) => updateField("subcategoryCode", e.target.value)}>
                        {subcategories.map((sub) => (
                          <option key={sub.code} value={sub.code}>{sub.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* GL Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">GL Code</label>
                      <Input value={form.glCode} onChange={(e) => updateField("glCode", e.target.value)} className="h-9" />
                    </div>

                    {/* Project */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Project (optional)</label>
                      <Input value={form.project} onChange={(e) => updateField("project", e.target.value)}
                        placeholder="Project name or code" className="h-9" />
                    </div>

                    {/* Description / Business Purpose */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium">Business Purpose / Description</label>
                      <textarea className={`${selectCls} min-h-[72px] py-2`} rows={3}
                        value={form.description} onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Describe the business purpose of this expense" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ---- Cost Center Allocation ---- */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Cost Center Allocation
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Split</span>
                      <Switch checked={splitMode} onCheckedChange={(v) => {
                        setSplitMode(v);
                        if (!v && allocations.length > 1) {
                          setAllocations([{ ...allocations[0], percentage: 100 }]);
                        }
                      }} />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allocations.map((alloc, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select className={`${selectCls} flex-1`} value={alloc.costCenterId}
                          onChange={(e) => updateAllocation(idx, "costCenterId", e.target.value)}>
                          {costCenters.map((cc) => (
                            <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                          ))}
                        </select>
                        {splitMode && (
                          <>
                            <div className="relative w-24 shrink-0">
                              <Input type="number" className="h-9 pr-7" value={alloc.percentage}
                                onChange={(e) => updateAllocation(idx, "percentage", parseFloat(e.target.value) || 0)}
                                min="0" max="100" />
                              <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            {allocations.length > 1 && (
                              <Button variant="ghost" size="sm" onClick={() => removeAllocation(idx)} className="text-red-500 shrink-0 h-9 w-9 p-0">
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {splitMode && (
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={addAllocation} disabled={allocations.length >= costCenters.length}>
                          <Plus className="w-3 h-3 mr-1" /> Add Split
                        </Button>
                        <span className={`text-xs font-medium ${Math.abs(allocationTotal - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}`}>
                          Total: {allocationTotal}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ---- Tags ---- */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag (e.g. Q4, client-visit, urgent)"
                      className="h-9" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
                    <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()} className="shrink-0 h-9">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ---- GST Details (shown when gstCompliance module is on) ---- */}
              {config.gstCompliance && (
                <Card>
                  <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowGst(!showGst)}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" /> GST Compliance
                      <span className="ml-auto">{showGst ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                    </CardTitle>
                  </CardHeader>
                  {showGst && (
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Supplier GSTIN</label>
                          <div className="relative">
                            <Input value={form.supplierGstin} onChange={(e) => updateField("supplierGstin", e.target.value)}
                              placeholder="e.g. 27AABCU9603R1ZM" className="h-9 pr-8" />
                            {gstinChecking && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                            )}
                            {!gstinChecking && gstinValid === true && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                            )}
                            {!gstinChecking && gstinValid === false && (
                              <XCircle className="w-3.5 h-3.5 text-red-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          {gstinValid === true && gstinData && (
                            <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded px-2.5 py-1.5 text-[11px] space-y-0.5">
                              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified via CIGNET
                              </div>
                              <p className="text-emerald-600/80 dark:text-emerald-400/70">{gstinData.tradeName || gstinData.legalName}</p>
                              <p className="text-emerald-600/60 dark:text-emerald-400/50">{gstinData.stateName} ({gstinData.registrationType})</p>
                            </div>
                          )}
                          {gstinValid === false && form.supplierGstin.length >= 15 && (
                            <p className="text-[11px] text-red-500 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Invalid GSTIN format
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">HSN/SAC Code</label>
                          <Input value={form.hsnSacCode} onChange={(e) => updateField("hsnSacCode", e.target.value)}
                            placeholder="e.g. 9963" className="h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">GST Slab</label>
                          <div className="flex gap-1">
                            {GST_SLABS.map((slab) => (
                              <Button key={slab} variant={form.gstSlab === slab ? "default" : "outline"} size="sm"
                                onClick={() => updateField("gstSlab", slab)} className="flex-1 text-xs h-9">
                                {slab}%
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Place of Supply</label>
                          <select className={selectCls} value={form.placeOfSupply}
                            onChange={(e) => updateField("placeOfSupply", e.target.value)}>
                            <option value="same">Same State (CGST + SGST)</option>
                            <option value="different">Different State (IGST)</option>
                          </select>
                        </div>
                      </div>
                      {amountNum > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="grid grid-cols-3 gap-4 text-center">
                            {form.placeOfSupply === "same" ? (
                              <>
                                <div><p className="text-xs text-muted-foreground">CGST ({form.gstSlab / 2}%)</p><p className="text-sm font-medium">{"\u20B9"}{cgst.toLocaleString("en-IN")}</p></div>
                                <div><p className="text-xs text-muted-foreground">SGST ({form.gstSlab / 2}%)</p><p className="text-sm font-medium">{"\u20B9"}{sgst.toLocaleString("en-IN")}</p></div>
                              </>
                            ) : (
                              <><div><p className="text-xs text-muted-foreground">IGST ({form.gstSlab}%)</p><p className="text-sm font-medium">{"\u20B9"}{igst.toLocaleString("en-IN")}</p></div><div /></>
                            )}
                            <div><p className="text-xs text-muted-foreground">Total GST</p><p className="text-sm font-bold">{"\u20B9"}{gstAmount.toLocaleString("en-IN")}</p></div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* ---- TDS Section (optional, collapsible) ---- */}
              <Card>
                <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowTds(!showTds)}>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    TDS Deduction
                    <Badge variant="outline" className="text-[9px] font-normal">Optional</Badge>
                    <span className="ml-auto">{showTds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                  </CardTitle>
                </CardHeader>
                {showTds && (
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium">TDS Applicable</label>
                        <Switch checked={form.tdsApplicable} onCheckedChange={(v) => updateField("tdsApplicable", v)} />
                      </div>
                      {form.tdsApplicable && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">TDS Section</label>
                            <select className={selectCls} value={form.tdsSection}
                              onChange={(e) => updateField("tdsSection", e.target.value)}>
                              <option value="">Select section</option>
                              {TDS_SECTIONS.map((sec) => (
                                <option key={sec.code} value={sec.code}>{sec.label} ({sec.rate}%)</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">PAN of Deductee</label>
                            <Input value={form.pan} onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                              placeholder="e.g. ABCDE1234F" maxLength={10} className="h-9" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium">TDS Amount</label>
                            <Input value={tdsAmount > 0 ? `\u20B9${tdsAmount.toLocaleString("en-IN")}` : ""} placeholder="Auto-calculated" disabled className="h-9" />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ---- Attendees ---- */}
              {(form.categoryCode === "MEALS" || form.categoryCode === "MARKETING") && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" /> Attendees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea className={`${selectCls} min-h-[60px] py-2`} rows={2}
                      value={form.attendees} onChange={(e) => updateField("attendees", e.target.value)}
                      placeholder="Names of attendees, separated by commas (for meals / entertainment expenses)" />
                    {form.attendees && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {form.attendees.split(",").filter((a) => a.trim()).length} attendee(s) listed
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Duplicate detection warning */}
              {duplicates.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          Potential Duplicate{duplicates.length > 1 ? "s" : ""} Detected
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          {duplicates.length} similar expense{duplicates.length > 1 ? "s" : ""} found. Please review before submitting.
                        </p>
                        <div className="mt-2 space-y-1">
                          {duplicates.map((dup: any) => (
                            <div key={dup.expenseId} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5 border border-amber-100">
                              <div>
                                <span className="font-medium">{dup.expense.merchantName}</span>
                                <span className="text-muted-foreground ml-2">{"\u20B9"}{dup.expense.amount.toLocaleString("en-IN")}</span>
                                <span className="text-muted-foreground ml-2">{new Date(dup.expense.date).toLocaleDateString("en-IN")}</span>
                              </div>
                              <Badge variant={dup.matchScore >= 80 ? "destructive" : "outline"} className="text-[9px]">
                                {dup.matchScore}% match
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hard violation warning */}
              {overallPolicyStatus === "HARD_VIOLATION" && amountNum > 0 && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Policy Violation Detected</p>
                    <p className="text-xs text-red-600/70">Hard policy violation. You can still save as draft for review.</p>
                  </div>
                </div>
              )}

              {/* ---- Action Buttons ---- */}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" asChild><Link href="/expenses">Cancel</Link></Button>
                <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={submitting}
                  style={{ backgroundColor: "#0d3b66" }} className="hover:opacity-90">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  Submit Expense
                </Button>
              </div>
            </TabsContent>

            {/* ============================================================= */}
            {/* Tab 2 : From Transaction                                      */}
            {/* ============================================================= */}
            <TabsContent value="transaction" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Unmatched Card Transactions
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a settled transaction without an existing expense to pre-fill the form.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)}
                      placeholder="Search by merchant, employee, category, or card last 4..." className="h-9" />
                  </div>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No unmatched transactions found</p>
                      <p className="text-xs mt-1">All card transactions have been matched to expenses</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filteredTransactions.map((txn) => {
                        const isSel = selectedTxnId === txn.id;
                        return (
                          <div key={txn.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSel ? "border-[#0d3b66] bg-blue-50 dark:bg-blue-500/10" : "border-border hover:border-primary/30 hover:bg-accent/50"
                            }`}
                            onClick={() => selectTransaction(txn)}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{txn.merchantName}</p>
                                <Badge variant="outline" className="text-[9px] shrink-0">{txn.mccCategory}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>{new Date(txn.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                <span>****{txn.cardLast4}</span>
                                <span>{txn.employeeName}</span>
                                {txn.hasReceipt && (
                                  <Badge variant="outline" className="text-[8px]"><Receipt className="w-2.5 h-2.5 mr-0.5" />Receipt</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold">{"\u20B9"}{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px] text-muted-foreground">{txn.currency}</p>
                            </div>
                            {isSel && <CheckCircle2 className="w-5 h-5 text-[#0d3b66] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {filteredTransactions.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Showing {filteredTransactions.length} unmatched transaction{filteredTransactions.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ================================================================= */}
        {/* Right Sidebar                                                     */}
        {/* ================================================================= */}
        <div className="space-y-4">
          {/* Policy Validation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" /> Policy Validation
                {amountNum > 0 && (
                  <Badge variant="outline" className={`ml-auto text-[9px] ${
                    overallPolicyStatus === "COMPLIANT"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : overallPolicyStatus === "SOFT_VIOLATION"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {overallPolicyStatus === "COMPLIANT" ? "Compliant" : overallPolicyStatus === "SOFT_VIOLATION" ? "Soft Violation" : "Hard Violation"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policyChecks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Enter an amount and category to see real-time policy checks.</p>
              ) : (
                <div className="space-y-2">
                  {policyChecks.map((check, i) => (
                    <div key={`${check.policy}-${i}`} className="flex items-start gap-2 text-xs">
                      {check.status === "pass" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      ) : check.status === "warn" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{check.policy}</p>
                        <p className="text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t">
                <Badge variant="outline" className="text-[9px]"><Sparkles className="w-3 h-3 mr-0.5" />Real-time policy validation</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Expense Summary */}
          {amountNum > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Expense Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Amount</span>
                    <span className="font-medium">{"\u20B9"}{amountNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {config.gstCompliance && gstAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST ({form.gstSlab}%)</span>
                      <span className="font-medium">{"\u20B9"}{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {tdsAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TDS Deduction</span>
                      <span className="font-medium text-red-600">-{"\u20B9"}{tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span>{"\u20B9"}{(amountNum + (config.gstCompliance ? gstAmount : 0) - tdsAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="pt-2">
                      <p className="text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {form.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>- Upload receipt for automatic OCR extraction</p>
                <p>- Use &ldquo;From Transaction&rdquo; tab to link card transactions</p>
                <p>- Split costs across multiple cost centers with the Split toggle</p>
                <p>- Add tags for easier filtering and reporting</p>
                {config.gstCompliance && <p>- Ensure valid GSTIN for ITC claims</p>}
                <p>- Expenses above {"\u20B9"}500 require receipt attachment</p>
                <p>- Hard violations can be saved as draft for review</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
