"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  FileText,
  CreditCard,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Check,
  Clock,
  AlertCircle,
  IndianRupee,
  Shield,
  Mail,
  Smartphone,
  Key,
  X,
  ArrowLeft,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface CompanyInfo {
  legalName: string;
  tradingName: string;
  entityType: string;
  cin: string;
  pan: string;
  gstin: string;
  tan: string;
  industry: string;
  incorporationDate: string;
  employeeCountRange: string;
  estimatedMonthlySpend: string;
  registeredAddress: string;
  communicationAddress: string;
  sameAsRegistered: boolean;
  website: string;
  emailDomain: string;
  primaryPhone: string;
}

interface KYBDocument {
  id: string;
  type: string;
  required: boolean;
  status: "PENDING" | "UPLOADED" | "VERIFIED";
  fileName: string;
}

interface CreditFacility {
  overallCreditLimit: string;
  allocationMethod: "POOL" | "INDIVIDUAL";
  cardNetwork: string;
  cardProductTier: string;
  liabilityModel: "CORPORATE" | "INDIVIDUAL" | "JOINT";
  billingCycleLength: string;
  billingCycleStartDate: string;
  paymentDueDateOffset: string;
  minimumDue: string;
  paymentTerms: string;
  paymentMethods: string[];
  latePaymentFee: string;
  overLimitFee: string;
  annualFeePerCard: string;
  cardIssuanceFee: string;
  virtualCardFee: string;
  forexMarkup: string;
  cashAdvanceFee: string;
  defaultPerTransactionLimit: string;
  defaultDailyLimit: string;
  defaultMonthlyLimit: string;
  internationalTxn: boolean;
  ecommerceTxn: boolean;
  atmWithdrawals: boolean;
  blockedMCC: string[];
}

interface AdminInfo {
  fullName: string;
  email: string;
  mobile: string;
  designation: string;
  department: string;
  credentialMethod: "EMAIL_INVITE" | "TEMP_PASSWORD";
  mfaRequired: boolean;
  mfaMethod: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Company Info", icon: Building2 },
  { number: 2, label: "KYB Documents", icon: FileText },
  { number: 3, label: "Credit & Billing", icon: CreditCard },
  { number: 4, label: "Company Admin", icon: UserPlus },
  { number: 5, label: "Review & Activate", icon: CheckCircle2 },
];

const ENTITY_TYPES = [
  "Private Limited",
  "Public Limited",
  "LLP",
  "Partnership",
  "Sole Proprietorship",
  "Government Body",
];

const INDUSTRIES = [
  "IT/Technology",
  "Manufacturing",
  "Financial Services",
  "Healthcare",
  "Retail",
  "FMCG",
  "Infrastructure",
  "Government",
  "Education",
  "Other",
];

const EMPLOYEE_RANGES = ["1-50", "51-200", "201-500", "501-2000", "2000+"];

const INITIAL_KYB_DOCS: KYBDocument[] = [
  { id: "coi", type: "Certificate of Incorporation (COI)", required: true, status: "PENDING", fileName: "" },
  { id: "moa", type: "Memorandum of Association (MOA)", required: true, status: "PENDING", fileName: "" },
  { id: "aoa", type: "Articles of Association (AOA)", required: true, status: "PENDING", fileName: "" },
  { id: "pan", type: "Company PAN Card", required: true, status: "PENDING", fileName: "" },
  { id: "gst", type: "GST Registration Certificate", required: true, status: "PENDING", fileName: "" },
  { id: "board_res", type: "Board Resolution for Card Program", required: true, status: "PENDING", fileName: "" },
  { id: "financials", type: "Audited Financials (last 2 years)", required: true, status: "PENDING", fileName: "" },
  { id: "bank_stmt", type: "Bank Statements (last 6 months)", required: true, status: "PENDING", fileName: "" },
  { id: "ubo", type: "UBO Declaration", required: true, status: "PENDING", fileName: "" },
];

const CARD_NETWORKS = ["Visa", "Mastercard", "RuPay", "Diners Club"];
const CARD_TIERS = ["Standard", "Gold", "Platinum", "Signature"];
const PAYMENT_TERMS_OPTIONS = ["Net 15", "Net 21", "Net 30", "Net 45"];
const PAYMENT_METHOD_OPTIONS = ["NEFT", "RTGS", "IMPS", "Auto-debit"];
const MCC_BLOCKED_OPTIONS = ["Gambling", "Alcohol", "Jewelry", "Adult Entertainment"];
const MFA_METHODS = ["SMS OTP", "Authenticator App", "Email OTP"];

// ──────────────────────────────────────────────
// Helper components
// ──────────────────────────────────────────────

function FormLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-sm font-medium">
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormField({
  children,
  label,
  required,
  hint,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <FormLabel required={required} hint={hint}>
        {label}
      </FormLabel>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="">{placeholder || "Select..."}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export default function CompanyOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    legalName: "",
    tradingName: "",
    entityType: "",
    cin: "",
    pan: "",
    gstin: "",
    tan: "",
    industry: "",
    incorporationDate: "",
    employeeCountRange: "",
    estimatedMonthlySpend: "",
    registeredAddress: "",
    communicationAddress: "",
    sameAsRegistered: false,
    website: "",
    emailDomain: "",
    primaryPhone: "",
  });

  // Step 2 state
  const [kybDocuments, setKybDocuments] = useState<KYBDocument[]>(
    INITIAL_KYB_DOCS.map((d) => ({ ...d }))
  );

  // Step 3 state
  const [creditFacility, setCreditFacility] = useState<CreditFacility>({
    overallCreditLimit: "",
    allocationMethod: "POOL",
    cardNetwork: "Visa",
    cardProductTier: "Platinum",
    liabilityModel: "CORPORATE",
    billingCycleLength: "30 days",
    billingCycleStartDate: "1st of month",
    paymentDueDateOffset: "21 days",
    minimumDue: "5% of outstanding",
    paymentTerms: "Net 30",
    paymentMethods: ["NEFT", "RTGS"],
    latePaymentFee: "500",
    overLimitFee: "1000",
    annualFeePerCard: "2500",
    cardIssuanceFee: "500",
    virtualCardFee: "0",
    forexMarkup: "3.5",
    cashAdvanceFee: "2.5",
    defaultPerTransactionLimit: "100000",
    defaultDailyLimit: "200000",
    defaultMonthlyLimit: "500000",
    internationalTxn: false,
    ecommerceTxn: true,
    atmWithdrawals: false,
    blockedMCC: ["Gambling"],
  });

  // Step 4 state
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    fullName: "",
    email: "",
    mobile: "",
    designation: "",
    department: "",
    credentialMethod: "EMAIL_INVITE",
    mfaRequired: true,
    mfaMethod: "SMS OTP",
  });

  // Step 3: Fee section expanded
  const [feeExpanded, setFeeExpanded] = useState(false);

  // helpers
  function updateCompanyInfo(field: keyof CompanyInfo, value: string | boolean) {
    setCompanyInfo((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "sameAsRegistered" && value === true) {
        next.communicationAddress = next.registeredAddress;
      }
      return next;
    });
  }

  function updateCreditFacility(field: keyof CreditFacility, value: unknown) {
    setCreditFacility((prev) => ({ ...prev, [field]: value }));
  }

  function updateAdminInfo(field: keyof AdminInfo, value: string | boolean) {
    setAdminInfo((prev) => ({ ...prev, [field]: value }));
  }

  function handleDocUpload(docId: string) {
    setKybDocuments((docs) =>
      docs.map((d) =>
        d.id === docId
          ? { ...d, status: "UPLOADED" as const, fileName: `${d.type.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.pdf` }
          : d
      )
    );
    toast.success("Document uploaded (demo mode)");
  }

  function togglePaymentMethod(method: string) {
    setCreditFacility((prev) => {
      const methods = prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods: methods };
    });
  }

  function toggleBlockedMCC(mcc: string) {
    setCreditFacility((prev) => {
      const blocked = prev.blockedMCC.includes(mcc)
        ? prev.blockedMCC.filter((m) => m !== mcc)
        : [...prev.blockedMCC, mcc];
      return { ...prev, blockedMCC: blocked };
    });
  }

  function getStatementDate() {
    if (creditFacility.billingCycleStartDate === "1st of month") {
      return creditFacility.billingCycleLength === "30 days"
        ? "Statement generated on 1st of next month"
        : "Statement generated on 15th of next month";
    }
    if (creditFacility.billingCycleStartDate === "15th of month") {
      return creditFacility.billingCycleLength === "30 days"
        ? "Statement generated on 15th of next month"
        : "Statement generated on 1st of month after next";
    }
    return `Statement generated ${creditFacility.billingCycleLength} after account creation + 1 day`;
  }

  function getGracePeriod() {
    return creditFacility.paymentDueDateOffset;
  }

  function handleActivate() {
    toast.success(
      "Company program activated successfully! The company admin will receive an email invitation within 5 minutes.",
      { duration: 5000 }
    );
    setTimeout(() => {
      router.push("/admin/companies");
    }, 1500);
  }

  const uploadedCount = kybDocuments.filter(
    (d) => d.status === "UPLOADED" || d.status === "VERIFIED"
  ).length;

  // ──────────────────────────────────────────────
  // Step 1: Company Information
  // ──────────────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0d3b66]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Legal Name" required>
                <Input
                  placeholder="e.g., TechNova Solutions Pvt Ltd"
                  value={companyInfo.legalName}
                  onChange={(e) => updateCompanyInfo("legalName", e.target.value)}
                />
              </FormField>
              <FormField label="Trading Name / DBA">
                <Input
                  placeholder="e.g., TechNova"
                  value={companyInfo.tradingName}
                  onChange={(e) =>
                    updateCompanyInfo("tradingName", e.target.value)
                  }
                />
              </FormField>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Entity Type" required>
                <SelectField
                  value={companyInfo.entityType}
                  onChange={(v) => updateCompanyInfo("entityType", v)}
                  options={ENTITY_TYPES}
                  placeholder="Select entity type..."
                />
              </FormField>
              <FormField
                label="CIN - Corporate Identity Number"
                required
                hint="21-character alphanumeric, e.g., U72200KA2018PTC123456"
              >
                <Input
                  placeholder="U72200KA2018PTC123456"
                  value={companyInfo.cin}
                  onChange={(e) => updateCompanyInfo("cin", e.target.value)}
                  maxLength={21}
                />
              </FormField>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="PAN"
                required
                hint="10-character, e.g., ABCDE1234F"
              >
                <Input
                  placeholder="ABCDE1234F"
                  value={companyInfo.pan}
                  onChange={(e) =>
                    updateCompanyInfo("pan", e.target.value.toUpperCase())
                  }
                  maxLength={10}
                />
              </FormField>
              <FormField
                label="GSTIN"
                required
                hint="15-character, e.g., 29ABCDE1234F1Z5"
              >
                <Input
                  placeholder="29ABCDE1234F1Z5"
                  value={companyInfo.gstin}
                  onChange={(e) =>
                    updateCompanyInfo("gstin", e.target.value.toUpperCase())
                  }
                  maxLength={15}
                />
              </FormField>
              <FormField label="TAN" hint="10-character">
                <Input
                  placeholder="DELA12345A"
                  value={companyInfo.tan}
                  onChange={(e) =>
                    updateCompanyInfo("tan", e.target.value.toUpperCase())
                  }
                  maxLength={10}
                />
              </FormField>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Industry / Sector" required>
                <SelectField
                  value={companyInfo.industry}
                  onChange={(v) => updateCompanyInfo("industry", v)}
                  options={INDUSTRIES}
                  placeholder="Select industry..."
                />
              </FormField>
              <FormField label="Date of Incorporation" required>
                <Input
                  type="date"
                  value={companyInfo.incorporationDate}
                  onChange={(e) =>
                    updateCompanyInfo("incorporationDate", e.target.value)
                  }
                />
              </FormField>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Employee Count Range" required>
                <SelectField
                  value={companyInfo.employeeCountRange}
                  onChange={(v) => updateCompanyInfo("employeeCountRange", v)}
                  options={EMPLOYEE_RANGES}
                  placeholder="Select range..."
                />
              </FormField>
              <FormField label="Estimated Monthly Card Spend (INR)" required>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g., 5000000"
                    value={companyInfo.estimatedMonthlySpend}
                    onChange={(e) =>
                      updateCompanyInfo("estimatedMonthlySpend", e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </FormField>
            </div>

            {/* Addresses */}
            <FormField label="Registered Address" required>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Full registered address..."
                value={companyInfo.registeredAddress}
                onChange={(e) =>
                  updateCompanyInfo("registeredAddress", e.target.value)
                }
              />
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel required>Communication Address</FormLabel>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companyInfo.sameAsRegistered}
                    onChange={(e) =>
                      updateCompanyInfo("sameAsRegistered", e.target.checked)
                    }
                    className="rounded border-input"
                  />
                  Same as registered address
                </label>
              </div>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Communication address..."
                value={
                  companyInfo.sameAsRegistered
                    ? companyInfo.registeredAddress
                    : companyInfo.communicationAddress
                }
                onChange={(e) =>
                  updateCompanyInfo("communicationAddress", e.target.value)
                }
                disabled={companyInfo.sameAsRegistered}
              />
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Website URL">
                <Input
                  placeholder="https://www.technova.com"
                  value={companyInfo.website}
                  onChange={(e) => updateCompanyInfo("website", e.target.value)}
                />
              </FormField>
              <FormField
                label="Company Email Domain"
                required
                hint="e.g., @technova.com"
              >
                <Input
                  placeholder="@technova.com"
                  value={companyInfo.emailDomain}
                  onChange={(e) =>
                    updateCompanyInfo("emailDomain", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Primary Phone" required>
                <Input
                  placeholder="+91 80 1234 5678"
                  value={companyInfo.primaryPhone}
                  onChange={(e) =>
                    updateCompanyInfo("primaryPhone", e.target.value)
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Step 2: KYB Documents
  // ──────────────────────────────────────────────
  function renderStep2() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0d3b66]" />
              KYB Document Checklist
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Upload all required documents for Know Your Business (KYB)
              verification. All documents must be in PDF format.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="info">
                {uploadedCount} of {kybDocuments.length} uploaded
              </Badge>
              {uploadedCount === kybDocuments.length && (
                <Badge variant="success">All documents uploaded</Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 w-[40%]">
                      Document Type
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-3 w-[15%]">
                      Required
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-3 w-[15%]">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 w-[20%]">
                      File
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground p-3 w-[10%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kybDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">
                            {doc.type}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {doc.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {doc.status === "PENDING" && (
                          <Badge variant="warning" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {doc.status === "UPLOADED" && (
                          <Badge variant="info" className="text-xs">
                            <Upload className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                        {doc.status === "VERIFIED" && (
                          <Badge variant="success" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {doc.fileName ? (
                          <span className="text-xs text-muted-foreground">
                            {doc.fileName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            No file
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {doc.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocUpload(doc.id)}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => {
                              setKybDocuments((docs) =>
                                docs.map((d) =>
                                  d.id === doc.id
                                    ? { ...d, status: "PENDING" as const, fileName: "" }
                                    : d
                                )
                              );
                              toast.info("Document removed");
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Drag-drop zone */}
            <div className="mt-6 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-[#0d3b66]/40 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Drag and drop documents here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                PDF, JPG, PNG up to 10MB each
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  const pending = kybDocuments.find(
                    (d) => d.status === "PENDING"
                  );
                  if (pending) {
                    handleDocUpload(pending.id);
                  } else {
                    toast.info("All documents have been uploaded");
                  }
                }}
              >
                Browse Files
              </Button>
            </div>

            {/* UBO note */}
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  UBO Declaration Note
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Ultimate Beneficial Owner (UBO) declaration is required for
                  entities with shareholders holding 10% or more. This must
                  include identity proof and address proof of all UBOs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Step 3: Credit Facility & Billing
  // ──────────────────────────────────────────────
  function renderStep3() {
    return (
      <div className="space-y-6">
        {/* Credit Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0d3b66]" />
              Credit Facility Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Overall Credit Limit (INR)" required>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g., 5000000"
                    value={creditFacility.overallCreditLimit}
                    onChange={(e) =>
                      updateCreditFacility(
                        "overallCreditLimit",
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
                {creditFacility.overallCreditLimit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatINR(Number(creditFacility.overallCreditLimit))}
                  </p>
                )}
              </FormField>
              <FormField label="Credit Limit Allocation Method" required>
                <div className="flex gap-4 mt-1">
                  {[
                    {
                      value: "POOL" as const,
                      label: "Pool-based",
                      desc: "Shared limit across all cards",
                    },
                    {
                      value: "INDIVIDUAL" as const,
                      label: "Individual-based",
                      desc: "Separate limit per card",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        creditFacility.allocationMethod === opt.value
                          ? "border-[#0d3b66] bg-[#0d3b66]/5"
                          : "border-input hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="allocationMethod"
                        value={opt.value}
                        checked={
                          creditFacility.allocationMethod === opt.value
                        }
                        onChange={() =>
                          updateCreditFacility("allocationMethod", opt.value)
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Card Network" required>
                <SelectField
                  value={creditFacility.cardNetwork}
                  onChange={(v) => updateCreditFacility("cardNetwork", v)}
                  options={CARD_NETWORKS}
                />
              </FormField>
              <FormField label="Card Product Tier" required>
                <SelectField
                  value={creditFacility.cardProductTier}
                  onChange={(v) => updateCreditFacility("cardProductTier", v)}
                  options={CARD_TIERS}
                />
              </FormField>
            </div>

            <FormField label="Liability Model" required>
              <div className="flex gap-4 mt-1">
                {[
                  {
                    value: "CORPORATE" as const,
                    label: "Corporate Liability",
                    desc: "Company is solely responsible for all card payments",
                  },
                  {
                    value: "INDIVIDUAL" as const,
                    label: "Individual Liability",
                    desc: "Cardholder is responsible for their own charges",
                  },
                  {
                    value: "JOINT" as const,
                    label: "Joint & Several",
                    desc: "Both company and cardholder share liability",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-start gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      creditFacility.liabilityModel === opt.value
                        ? "border-[#0d3b66] bg-[#0d3b66]/5"
                        : "border-input hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="liabilityModel"
                      value={opt.value}
                      checked={creditFacility.liabilityModel === opt.value}
                      onChange={() =>
                        updateCreditFacility("liabilityModel", opt.value)
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>
          </CardContent>
        </Card>

        {/* Billing Cycle — visually prominent */}
        <Card className="border-2 border-[#0d3b66]/30 shadow-md">
          <CardHeader className="bg-[#0d3b66]/5 border-b border-[#0d3b66]/10">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0d3b66]">
              <IndianRupee className="w-5 h-5" />
              Billing Cycle Configuration
              <Badge variant="info" className="ml-2 text-xs">
                Key Configuration
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the billing cycle, payment terms, and statement
              generation for this corporate program.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Billing Cycle Length" required>
                <SelectField
                  value={creditFacility.billingCycleLength}
                  onChange={(v) =>
                    updateCreditFacility("billingCycleLength", v)
                  }
                  options={["30 days", "45 days"]}
                />
              </FormField>
              <FormField label="Billing Cycle Start Date" required>
                <SelectField
                  value={creditFacility.billingCycleStartDate}
                  onChange={(v) =>
                    updateCreditFacility("billingCycleStartDate", v)
                  }
                  options={[
                    "1st of month",
                    "15th of month",
                    "Account creation date",
                  ]}
                />
              </FormField>
            </div>

            {/* Auto-computed fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Statement Generation (auto-computed)
                </p>
                <p className="text-sm font-medium">{getStatementDate()}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Grace Period (auto-computed)
                </p>
                <p className="text-sm font-medium">{getGracePeriod()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Payment Due Date Offset"
                required
                hint="Days after statement generation"
              >
                <SelectField
                  value={creditFacility.paymentDueDateOffset}
                  onChange={(v) =>
                    updateCreditFacility("paymentDueDateOffset", v)
                  }
                  options={[
                    "15 days",
                    "21 days",
                    "25 days",
                  ]}
                />
              </FormField>
              <FormField label="Minimum Due" required>
                <SelectField
                  value={creditFacility.minimumDue}
                  onChange={(v) => updateCreditFacility("minimumDue", v)}
                  options={[
                    "5% of outstanding",
                    "10% of outstanding",
                    "Full balance",
                  ]}
                />
              </FormField>
            </div>

            {/* Payment Terms */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Payment Terms</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Payment Terms" required>
                  <SelectField
                    value={creditFacility.paymentTerms}
                    onChange={(v) => updateCreditFacility("paymentTerms", v)}
                    options={PAYMENT_TERMS_OPTIONS}
                  />
                </FormField>
                <FormField label="Payment Method" required hint="Select all applicable">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => togglePaymentMethod(method)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                          creditFacility.paymentMethods.includes(method)
                            ? "bg-[#0d3b66] text-white border-[#0d3b66]"
                            : "bg-background text-foreground border-input hover:bg-muted"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label="Late Payment Fee (INR)">
                  <Input
                    type="number"
                    value={creditFacility.latePaymentFee}
                    onChange={(e) =>
                      updateCreditFacility("latePaymentFee", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Over-limit Fee (INR)">
                  <Input
                    type="number"
                    value={creditFacility.overLimitFee}
                    onChange={(e) =>
                      updateCreditFacility("overLimitFee", e.target.value)
                    }
                  />
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Structure — expandable */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setFeeExpanded(!feeExpanded)}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#0d3b66]" />
                Fee Structure
              </span>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  feeExpanded ? "rotate-90" : ""
                }`}
              />
            </CardTitle>
          </CardHeader>
          {feeExpanded && (
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Annual Fee per Card (INR)">
                  <Input
                    type="number"
                    value={creditFacility.annualFeePerCard}
                    onChange={(e) =>
                      updateCreditFacility(
                        "annualFeePerCard",
                        e.target.value
                      )
                    }
                  />
                </FormField>
                <FormField label="Card Issuance Fee (INR)">
                  <Input
                    type="number"
                    value={creditFacility.cardIssuanceFee}
                    onChange={(e) =>
                      updateCreditFacility(
                        "cardIssuanceFee",
                        e.target.value
                      )
                    }
                  />
                </FormField>
                <FormField label="Virtual Card Fee (INR)">
                  <Input
                    type="number"
                    value={creditFacility.virtualCardFee}
                    onChange={(e) =>
                      updateCreditFacility("virtualCardFee", e.target.value)
                    }
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Forex Markup (%)" hint="Applied on international transactions">
                  <Input
                    type="number"
                    step="0.1"
                    value={creditFacility.forexMarkup}
                    onChange={(e) =>
                      updateCreditFacility("forexMarkup", e.target.value)
                    }
                  />
                </FormField>
                <FormField label="Cash Advance Fee (%)" hint="Applied on ATM withdrawals">
                  <Input
                    type="number"
                    step="0.1"
                    value={creditFacility.cashAdvanceFee}
                    onChange={(e) =>
                      updateCreditFacility("cashAdvanceFee", e.target.value)
                    }
                  />
                </FormField>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Card Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0d3b66]" />
              Card Controls (Program Defaults)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              These defaults apply to all cards issued under this program.
              Individual card limits can be customized later.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Default Per-Transaction Limit (INR)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={creditFacility.defaultPerTransactionLimit}
                    onChange={(e) =>
                      updateCreditFacility(
                        "defaultPerTransactionLimit",
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
              </FormField>
              <FormField label="Default Daily Limit (INR)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={creditFacility.defaultDailyLimit}
                    onChange={(e) =>
                      updateCreditFacility(
                        "defaultDailyLimit",
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
              </FormField>
              <FormField label="Default Monthly Limit (INR)">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={creditFacility.defaultMonthlyLimit}
                    onChange={(e) =>
                      updateCreditFacility(
                        "defaultMonthlyLimit",
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
              </FormField>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  field: "internationalTxn" as const,
                  label: "International Transactions",
                  desc: "Allow transactions outside India",
                },
                {
                  field: "ecommerceTxn" as const,
                  label: "E-commerce Transactions",
                  desc: "Allow online/CNP transactions",
                },
                {
                  field: "atmWithdrawals" as const,
                  label: "ATM Withdrawals",
                  desc: "Allow cash advances at ATMs",
                },
              ].map((toggle) => (
                <div
                  key={toggle.field}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{toggle.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {toggle.desc}
                    </p>
                  </div>
                  <Switch
                    checked={creditFacility[toggle.field] as boolean}
                    onCheckedChange={(checked) =>
                      updateCreditFacility(toggle.field, checked)
                    }
                  />
                </div>
              ))}
            </div>

            {/* Blocked MCC */}
            <FormField
              label="Blocked MCC Categories"
              hint="Transactions at these merchant categories will be declined"
            >
              <div className="flex flex-wrap gap-2 mt-1">
                {MCC_BLOCKED_OPTIONS.map((mcc) => (
                  <button
                    key={mcc}
                    type="button"
                    onClick={() => toggleBlockedMCC(mcc)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1 ${
                      creditFacility.blockedMCC.includes(mcc)
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    }`}
                  >
                    {creditFacility.blockedMCC.includes(mcc) && (
                      <X className="w-3 h-3" />
                    )}
                    {mcc}
                  </button>
                ))}
              </div>
            </FormField>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Step 4: Company Admin Creation
  // ──────────────────────────────────────────────
  function renderStep4() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0d3b66]" />
              Company Admin Details
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create the primary administrator for this company. They will
              manage users, cards, and settings for their organization.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Admin Full Name" required>
                <Input
                  placeholder="e.g., Priya Sharma"
                  value={adminInfo.fullName}
                  onChange={(e) => updateAdminInfo("fullName", e.target.value)}
                />
              </FormField>
              <FormField label="Admin Email" required>
                <Input
                  type="email"
                  placeholder={`e.g., admin${companyInfo.emailDomain || "@company.com"}`}
                  value={adminInfo.email}
                  onChange={(e) => updateAdminInfo("email", e.target.value)}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Admin Mobile Number" required>
                <Input
                  placeholder="+91 98765 43210"
                  value={adminInfo.mobile}
                  onChange={(e) => updateAdminInfo("mobile", e.target.value)}
                />
              </FormField>
              <FormField label="Admin Designation" required>
                <Input
                  placeholder="e.g., VP Finance"
                  value={adminInfo.designation}
                  onChange={(e) =>
                    updateAdminInfo("designation", e.target.value)
                  }
                />
              </FormField>
              <FormField label="Admin Department">
                <Input
                  placeholder="e.g., Finance"
                  value={adminInfo.department}
                  onChange={(e) =>
                    updateAdminInfo("department", e.target.value)
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Credential Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-[#0d3b66]" />
              Credential Delivery Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  value: "EMAIL_INVITE" as const,
                  label: "Email Invite",
                  icon: Mail,
                  recommended: true,
                  desc: "Sends a secure registration link. Admin sets their own password.",
                },
                {
                  value: "TEMP_PASSWORD" as const,
                  label: "Temporary Password",
                  icon: Smartphone,
                  recommended: false,
                  desc: "System generates a temp password, sent via separate SMS + email.",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    adminInfo.credentialMethod === opt.value
                      ? "border-[#0d3b66] bg-[#0d3b66]/5"
                      : "border-input hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="credentialMethod"
                    value={opt.value}
                    checked={adminInfo.credentialMethod === opt.value}
                    onChange={() =>
                      updateAdminInfo("credentialMethod", opt.value)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <opt.icon className="w-4 h-4 text-[#0d3b66]" />
                      <span className="text-sm font-medium">{opt.label}</span>
                      {opt.recommended && (
                        <Badge variant="success" className="text-[10px]">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {opt.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Preview */}
            {adminInfo.email && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      {adminInfo.credentialMethod === "EMAIL_INVITE"
                        ? "Email Invite Preview"
                        : "Credential Delivery Preview"}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      An invitation email will be sent to{" "}
                      <strong>{adminInfo.email}</strong> with instructions to
                      set up their account. They will be assigned the{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">
                        COMPANY_ADMIN
                      </code>{" "}
                      role with full access to manage their organization.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MFA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0d3b66]" />
              MFA Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">MFA Required</p>
                <p className="text-xs text-muted-foreground">
                  Require multi-factor authentication for this admin
                </p>
              </div>
              <Switch
                checked={adminInfo.mfaRequired}
                onCheckedChange={(checked) =>
                  updateAdminInfo("mfaRequired", checked)
                }
              />
            </div>
            {adminInfo.mfaRequired && (
              <FormField label="MFA Method" required>
                <SelectField
                  value={adminInfo.mfaMethod}
                  onChange={(v) => updateAdminInfo("mfaMethod", v)}
                  options={MFA_METHODS}
                />
              </FormField>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Step 5: Review & Activate
  // ──────────────────────────────────────────────
  function renderStep5() {
    return (
      <div className="space-y-6">
        {/* Company Info Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0d3b66]" />
              Company Information
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => setCurrentStep(1)}
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <ReviewField label="Legal Name" value={companyInfo.legalName} />
              <ReviewField
                label="Trading Name"
                value={companyInfo.tradingName || "N/A"}
              />
              <ReviewField label="Entity Type" value={companyInfo.entityType} />
              <ReviewField label="CIN" value={companyInfo.cin} />
              <ReviewField label="PAN" value={companyInfo.pan} />
              <ReviewField label="GSTIN" value={companyInfo.gstin} />
              <ReviewField label="TAN" value={companyInfo.tan || "N/A"} />
              <ReviewField label="Industry" value={companyInfo.industry} />
              <ReviewField
                label="Incorporation Date"
                value={
                  companyInfo.incorporationDate
                    ? new Date(
                        companyInfo.incorporationDate
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"
                }
              />
              <ReviewField
                label="Employee Count"
                value={companyInfo.employeeCountRange}
              />
              <ReviewField
                label="Est. Monthly Spend"
                value={
                  companyInfo.estimatedMonthlySpend
                    ? formatINR(Number(companyInfo.estimatedMonthlySpend))
                    : "N/A"
                }
              />
              <ReviewField
                label="Email Domain"
                value={companyInfo.emailDomain}
              />
              <ReviewField label="Phone" value={companyInfo.primaryPhone} />
              <ReviewField
                label="Website"
                value={companyInfo.website || "N/A"}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYB Documents Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0d3b66]" />
              KYB Documents
              <Badge
                variant={
                  uploadedCount === kybDocuments.length ? "success" : "warning"
                }
                className="ml-2"
              >
                {uploadedCount} of {kybDocuments.length} uploaded
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => setCurrentStep(2)}
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {kybDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  {doc.status === "UPLOADED" || doc.status === "VERIFIED" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span
                    className={
                      doc.status === "PENDING"
                        ? "text-muted-foreground"
                        : ""
                    }
                  >
                    {doc.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credit Facility Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0d3b66]" />
              Credit Facility & Billing
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => setCurrentStep(3)}
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <ReviewField
                label="Credit Limit"
                value={
                  creditFacility.overallCreditLimit
                    ? formatINR(Number(creditFacility.overallCreditLimit))
                    : "Not set"
                }
              />
              <ReviewField
                label="Allocation Method"
                value={
                  creditFacility.allocationMethod === "POOL"
                    ? "Pool-based"
                    : "Individual-based"
                }
              />
              <ReviewField
                label="Card Network"
                value={creditFacility.cardNetwork}
              />
              <ReviewField
                label="Card Tier"
                value={creditFacility.cardProductTier}
              />
              <ReviewField
                label="Liability Model"
                value={
                  creditFacility.liabilityModel === "CORPORATE"
                    ? "Corporate Liability"
                    : creditFacility.liabilityModel === "INDIVIDUAL"
                    ? "Individual Liability"
                    : "Joint & Several"
                }
              />
              <ReviewField
                label="Billing Cycle"
                value={`${creditFacility.billingCycleLength} from ${creditFacility.billingCycleStartDate}`}
              />
              <ReviewField
                label="Payment Due"
                value={`${creditFacility.paymentDueDateOffset} after statement`}
              />
              <ReviewField
                label="Minimum Due"
                value={creditFacility.minimumDue}
              />
              <ReviewField
                label="Payment Terms"
                value={creditFacility.paymentTerms}
              />
              <ReviewField
                label="Payment Methods"
                value={creditFacility.paymentMethods.join(", ")}
              />
              <ReviewField
                label="Per-Txn Limit"
                value={
                  creditFacility.defaultPerTransactionLimit
                    ? formatINR(
                        Number(creditFacility.defaultPerTransactionLimit)
                      )
                    : "Not set"
                }
              />
              <ReviewField
                label="Monthly Limit"
                value={
                  creditFacility.defaultMonthlyLimit
                    ? formatINR(Number(creditFacility.defaultMonthlyLimit))
                    : "Not set"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Admin Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#0d3b66]" />
              Company Admin
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => setCurrentStep(4)}
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <ReviewField label="Name" value={adminInfo.fullName} />
              <ReviewField label="Email" value={adminInfo.email} />
              <ReviewField label="Mobile" value={adminInfo.mobile} />
              <ReviewField label="Designation" value={adminInfo.designation} />
              <ReviewField
                label="Department"
                value={adminInfo.department || "N/A"}
              />
              <ReviewField
                label="Credential Delivery"
                value={
                  adminInfo.credentialMethod === "EMAIL_INVITE"
                    ? "Email Invite"
                    : "Temporary Password"
                }
              />
              <ReviewField
                label="MFA"
                value={
                  adminInfo.mfaRequired
                    ? `Required (${adminInfo.mfaMethod})`
                    : "Not required"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Activation note */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Ready to Activate
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                The company admin will receive an email invitation within 5
                minutes. The program will be active once KYB verification is
                complete. You can track the KYB status from the Company
                Management dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Onboard New Company"
        description="Create a new corporate card program for a client"
      >
        <Button variant="outline" asChild>
          <a href="/admin/companies">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </a>
        </Button>
      </PageHeader>

      {/* Step Indicator */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((step, idx) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => setCurrentStep(step.number)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep === step.number
                    ? "bg-[#0d3b66] border-[#0d3b66] text-white shadow-lg shadow-[#0d3b66]/20"
                    : currentStep > step.number
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-background border-muted-foreground/30 text-muted-foreground group-hover:border-[#0d3b66]/50"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  currentStep === step.number
                    ? "text-[#0d3b66]"
                    : currentStep > step.number
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-18px] ${
                  currentStep > step.number
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </div>
        {currentStep < 5 ? (
          <Button onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}>
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleActivate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            Activate Company Program
          </Button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Review field helper for Step 5
// ──────────────────────────────────────────────
function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "Not provided"}</p>
    </div>
  );
}
