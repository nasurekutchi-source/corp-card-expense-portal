// =============================================================================
// Mutable Server-Side In-Memory Data Store
// =============================================================================
// Singleton store that holds all entity data in-memory.
// Initializes with demo data, supports CRUD, bulk import, and reset.
// Stats and analytics are COMPUTED from actual data, never hardcoded.
// Module-level state persists for the lifetime of the Node.js process.
// =============================================================================

import { generateId } from "./utils";
import { EXPENSE_CATEGORIES } from "./constants";
import {
  demoBankInstitutions,
  demoPrograms,
  demoEnterprises,
  demoCompanies,
  demoDivisions,
  demoDepartments,
  demoCostCenters,
  demoEmployees,
  demoCards,
  demoTransactions,
  demoExpenseReports,  // still used by buildDemoReimbursements (kept for reference)
  demoPolicies,
  demoCardControlPolicies,
  doaAuthorityLevels as demoDoaAuthorityLevels,
  doaApprovalMatrix as demoDoaApprovalMatrix,
  demoCardStatements,
  demoCorporateStatements,
  demoPaymentCycles,
  demoPaymentApportionments,
  demoWorkflowRequests,
  demoDisputes,
  demoDetectedSubscriptions,
  demoScheduledCardActions,
} from "./demo-data";

// =============================================================================
// Type Definitions
// =============================================================================

export interface BankInstitution {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  bankId: string;
  status: string;
  description: string;
}

export interface Enterprise {
  id: string;
  name: string;
  status: string;
}

export interface Company {
  id: string;
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  cin: string;
  baseCurrency: string;
  enterpriseId: string;
  programId: string;
}

export interface Division {
  id: string;
  name: string;
  code: string;
  companyId: string;
  budget: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  divisionId: string;
  budget: number;
  glCodePrefix: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  glCode: string;
  budget: number;
  utilized: number;
  departmentId: string;
  companyId: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  costCenterId: string;
  level: string;
  pan: string;
  status: string;
}

export interface SpendLimits {
  perTransaction: number;
  daily: number;
  monthly: number;
}

export interface Card {
  id: string;
  last4Digits: string;
  type: string;
  status: string;
  network: string;
  employeeId: string;
  employeeName: string;
  department: string;
  spendLimits: SpendLimits;
  expiryDate: string;
  issuedDate: string;
  utilizationPercent: number;
}

export interface TransactionLocation {
  city: string;
  country: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  eventType: string;
  amount: number;
  currency: string;
  billingAmount: number;
  billingCurrency: string;
  merchantName: string;
  mcc: string;
  mccCategory: string;
  status: string;
  authCode: string;
  channel: string;
  location: TransactionLocation;
  timestamp: string;
  hasReceipt: boolean;
  gstAmount: number;
}

export interface GstDetails {
  gstin: string;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface Expense {
  id: string;
  transactionId: string | null;
  amount: number;
  originalCurrency: string;
  category: string;
  glCode: string;
  costCenterId: string;
  costCenterName: string;
  policyStatus: string;
  businessPurpose: string;
  type: string;
  employeeId: string;
  employeeName: string;
  merchantName: string;
  date: string;
  hasReceipt: boolean;
  gstDetails: GstDetails;
  status?: string;
}

export interface ExpenseReport {
  id: string;
  reportNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  expenseCount: number;
  period: string;
  submittedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  policyScore: number;
}

export interface Approval {
  id: string;
  entityType: string;
  entityId: string;
  reportNumber: string;
  employeeName: string;
  department: string;
  amount: number;
  expenseCount: number;
  status: string;
  level: number;
  submittedAt: string | null;
  dueAt: string;
  policyScore: number;
}

export interface Policy {
  id: string;
  name: string;
  type: string;
  rules: Record<string, unknown>;
  severity: string;
  isActive: boolean;
  version: number;
}

export interface CardControlPolicy {
  id: string;
  nodeId: string;
  nodeType: "company" | "division" | "department";
  nodeName: string;
  spendLimits: {
    perTransaction: number;
    daily: number;
    monthly: number;
  };
  channelControls: {
    pos: boolean;
    ecommerce: boolean;
    contactless: boolean;
    mobileWallet: boolean;
    atm: boolean;
  };
  geographicControls: {
    internationalAllowed: boolean;
    domesticOnly: boolean;
  };
  mccRestrictions: string[];
  isOverride: boolean;
  inheritedFrom?: string;
}

export interface DoaAuthorityLevel {
  id: string;
  name: string;
  maxAmount: number;
  allowedCategories: string[];
}

export interface DoaApprovalRule {
  id: string;
  amountRange: string;
  category: string;
  approvers: string;
}

export interface ApprovalChainStep {
  role: string;
  level: number;
}

export interface ApprovalChainRule {
  id: string;
  name: string;
  amountMin: number;
  amountMax: number;       // 0 = unlimited
  category: string;        // "ALL" or specific category code
  approverChain: ApprovalChainStep[];  // ordered list
  isActive: boolean;
}

// =============================================================================
// Statement Types
// =============================================================================

export interface CardStatement {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  statementPeriod: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  minimumDue: number;
  dueDate: string;
  status: string;
  transactionCount: number;
  generatedAt: string;
  pdfUrl: string | null;
}

export interface CorporateStatement {
  id: string;
  companyId: string;
  companyName: string;
  statementPeriod: string;
  totalCards: number;
  totalTransactions: number;
  totalAmount: number;
  totalGst: number;
  dueDate: string;
  status: string;
  generatedAt: string;
  pdfUrl: string | null;
}

// =============================================================================
// Payment Cycle Types
// =============================================================================

export interface PaymentCycle {
  id: string;
  companyId: string;
  companyName: string;
  statementPeriod: string;
  dueDate: string;
  totalDue: number;
  status: string;
  paymentRef: string;
  paymentDate: string | null;
  paymentMode: string | null;
  apportionmentStatus: string;
  cardCount: number;
}

export interface PaymentApportionment {
  id: string;
  paymentCycleId: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  costCenterName: string;
  amount: number;
  status: string;
}

// =============================================================================
// Workflow Request Types
// =============================================================================

export interface WorkflowApprovalStep {
  name: string;
  role: string;
  status: string;
  date: string | null;
}

export interface WorkflowComment {
  author: string;
  text: string;
  date: string;
}

export interface WorkflowRequest {
  id: string;
  type: string;
  requestorId: string;
  requestorName: string;
  department: string;
  status: string;
  details: Record<string, unknown>;
  currentApprover: string;
  approvalChain: WorkflowApprovalStep[];
  createdAt: string;
  updatedAt: string;
  comments: WorkflowComment[];
}

// =============================================================================
// Dispute Types
// =============================================================================

export interface Dispute {
  id: string;
  transactionId: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  description: string;
  status: string;
  provisionalCreditAmount: number | null;
  provisionalCreditDate: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// =============================================================================
// Subscription Detection Types
// =============================================================================

export interface DetectedSubscription {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  merchantName: string;
  mcc: string;
  frequency: string;
  lastChargeDate: string;
  lastChargeAmount: number;
  avgAmount: number;
  totalCharges: number;
  isActive: boolean;
  detectedAt: string;
}

// =============================================================================
// Scheduled Card Action Types
// =============================================================================

export interface ScheduledCardAction {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  actionType: string;
  scheduledDate: string;
  recurrence: string;
  status: string;
  details: Record<string, unknown>;
  createdAt: string;
}

// =============================================================================
// Receipt Types
// =============================================================================

export interface Receipt {
  id: string;
  expenseId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  base64Data: string;
  uploadedAt: string;
  ocrData: Record<string, any>;
  ocrConfidence: Record<string, number>;
  ocrStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  source: "UPLOAD" | "CAMERA" | "EMAIL";
}

// =============================================================================
// Reimbursement Types
// =============================================================================

export interface Reimbursement {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  expenseReportId: string;
  reportNumber: string;
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
  status: "PENDING" | "INITIATED" | "PROCESSING" | "PAID" | "FAILED";
  paymentMethod: string;
  paymentRef: string;
  bankAccount: string;
  ifscCode: string;
  bankName: string;
  initiatedAt: string | null;
  processedAt: string | null;
  paidAt: string | null;
  failureReason: string | null;
}

// =============================================================================
// Payment Profile Types (Employee Bank/UPI Details for Reimbursements)
// =============================================================================

export interface PaymentProfile {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "BANK_ACCOUNT" | "UPI";
  accountNumber: string;         // masked for display, full for payment
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: "SAVINGS" | "CURRENT";
  upiVpa: string | null;         // e.g. "name@upi" — only for UPI type
  isPrimary: boolean;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "FAILED";
  addedAt: string;
  verifiedAt: string | null;
}

// -- Computed types --

export interface DashboardStats {
  totalSpendMTD: number;
  totalSpendYTD: number;
  activeCards: number;
  totalCards: number;
  pendingApprovals: number;
  policyComplianceScore: number;
  totalEmployees: number;
  cardLimitTotal: number;
  cardLimitUtilized: number;
  limitUtilizationPercent: number;
  expenseModuleEnabled: boolean;
  totalTransactionsMTD: number;
  avgTransactionValue: number;
  disputeRate: number;
  spendTrendPercent: number;
  totalSpendLastMonth: number;
  overdueApprovals: number;
}

export interface CategorySpend {
  name: string;
  value: number;
  color: string;
}

export interface MonthlySpend {
  month: string;
  amount: number;
}

export interface TopSpender {
  name: string;
  department: string;
  amount: number;
}

export interface DepartmentSpend {
  name: string;
  division: string;
  spend: number;
  limit: number;
  cards: number;
  color: string;
}

export interface Analytics {
  spendByCategory: CategorySpend[];
  spendByMonth: MonthlySpend[];
  topSpenders: TopSpender[];
  hierarchySpend: DepartmentSpend[];
}

export interface EmployeeDashboardData {
  myCards: {
    last4: string;
    type: string;
    network: string;
    status: string;
    limit: number;
    spent: number;
    available: number;
  }[];
  myRecentTransactions: {
    merchant: string;
    amount: number;
    date: string;
    status: string;
    hasReceipt: boolean;
  }[];
  missingReceipts: number;
  pendingExpenses: number;
  totalSpendMTD: number;
  totalSpendLastMonth: number;
}

// -- Filter types --

export interface CardFilters {
  status?: string;
  employeeId?: string;
  type?: string;
  search?: string;
}

export interface TransactionFilters {
  status?: string;
  employeeId?: string;
  cardId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  category?: string;
}

export interface EmployeeFilters {
  status?: string;
  departmentId?: string;
  search?: string;
  level?: string;
}

export interface ExpenseFilters {
  employeeId?: string;
  category?: string;
  policyStatus?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ExpenseReportFilters {
  status?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ApprovalFilters {
  status?: string;
  search?: string;
}

export interface ExpenseCategorySubcategory {
  code: string;
  label: string;
  glPrefix?: string;
}

export interface ExpenseCategoryConfig {
  id: string;
  code: string;
  label: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  subcategories: ExpenseCategorySubcategory[];
}

// =============================================================================
// Audit Log Types
// =============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  entityType: string; // "EXPENSE" | "EXPENSE_REPORT" | "APPROVAL" | "CARD" | "EMPLOYEE" | "REIMBURSEMENT" | etc
  entityId: string;
  action: string; // "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "INITIATE" | etc
  userId: string;
  userName: string;
  changes: Record<string, { old: any; new: any }> | null;
  metadata: Record<string, any> | null;
  ipAddress: string;
}

// =============================================================================
// GSTIN Cache Types (CIGNET GSP Integration)
// =============================================================================

export interface GstinRecord {
  id: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED" | "SUSPENDED";
  stateCode: string;
  stateName: string;
  registrationType: string; // "Regular" | "Composition" | "SEZ" | "Casual"
  lastVerified: string;
  validatedVia: "CIGNET" | "MANUAL" | "CACHE";
  address: string;
  einvoiceEnabled: boolean;
}

// =============================================================================
// Escalation Config Types
// =============================================================================

export interface EscalationConfig {
  enabled: boolean;
  slaHours: number; // Hours before escalation triggers
  escalateTo: "SKIP_LEVEL" | "FINANCE" | "ADMIN"; // Who to escalate to
  maxEscalations: number; // Max times an approval can be escalated
  notifyOriginalApprover: boolean;
}

// -- Store aggregate --

export interface Store {
  bankInstitutions: BankInstitution[];
  programs: Program[];
  enterprises: Enterprise[];
  companies: Company[];
  divisions: Division[];
  departments: Department[];
  costCenters: CostCenter[];
  employees: Employee[];
  cards: Card[];
  transactions: Transaction[];
  expenses: Expense[];
  expenseReports: ExpenseReport[];
  approvals: Approval[];
  policies: Policy[];
  cardControlPolicies: CardControlPolicy[];
  doaAuthorityLevels: DoaAuthorityLevel[];
  doaApprovalMatrix: DoaApprovalRule[];
  approvalChainRules: ApprovalChainRule[];
  cardStatements: CardStatement[];
  corporateStatements: CorporateStatement[];
  paymentCycles: PaymentCycle[];
  paymentApportionments: PaymentApportionment[];
  workflowRequests: WorkflowRequest[];
  disputes: Dispute[];
  detectedSubscriptions: DetectedSubscription[];
  scheduledCardActions: ScheduledCardAction[];
  expenseCategories: ExpenseCategoryConfig[];
  receipts: Receipt[];
  reimbursements: Reimbursement[];
  auditLog: AuditLogEntry[];
  gstinCache: GstinRecord[];
  paymentProfiles: PaymentProfile[];
}

// =============================================================================
// Deep Clone Helper
// =============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// Build Default Expense Categories from Constants
// =============================================================================

function buildDefaultExpenseCategories(): ExpenseCategoryConfig[] {
  return EXPENSE_CATEGORIES.map((cat, index) => ({
    id: `exp-cat-${cat.code.toLowerCase()}`,
    code: cat.code,
    label: cat.label,
    icon: cat.icon,
    color: cat.color,
    isActive: true,
    sortOrder: index,
    subcategories: cat.subcategories.map((sub) => ({
      code: sub.code,
      label: sub.label,
      glPrefix: sub.glPrefix,
    })),
  }));
}

// =============================================================================
// Build Demo Reimbursements from Expense Reports
// =============================================================================

function buildDemoReimbursements(): Reimbursement[] {
  const reports = deepClone(demoExpenseReports) as any[];
  const employees = deepClone(demoEmployees) as any[];
  const departments = deepClone(demoDepartments) as any[];
  const banks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra"];
  const ifscCodes = ["HDFC0001234", "ICIC0005678", "SBIN0009012", "UTIB0003456", "KKBK0007890"];

  return reports
    .filter((r: any) => ["APPROVED", "PROCESSING", "PAID"].includes(r.status))
    .map((r: any, i: number) => {
      const emp = employees.find((e: any) => e.id === r.employeeId);
      const dept = emp ? departments.find((d: any) => d.id === emp.departmentId) : null;
      const tds = i % 3 === 0 ? Math.round(r.totalAmount * 0.1) : 0;
      const statusMap: Record<string, "PENDING" | "INITIATED" | "PROCESSING" | "PAID"> = {
        APPROVED: "PENDING",
        PROCESSING: "PROCESSING",
        PAID: "PAID",
      };
      return {
        id: `reimb-${i + 1}`,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: dept?.name || r.department || "",
        expenseReportId: r.id,
        reportNumber: r.reportNumber,
        grossAmount: r.totalAmount,
        tdsAmount: tds,
        netAmount: r.totalAmount - tds,
        status: statusMap[r.status] || "PENDING",
        paymentMethod: ["NEFT", "IMPS", "UPI"][i % 3],
        paymentRef: r.status === "PAID" ? `NEFT${Date.now()}${i}` : "",
        bankAccount: `XXXX${String(1000 + i * 111).slice(-4)}`,
        ifscCode: ifscCodes[i % ifscCodes.length],
        bankName: banks[i % banks.length],
        initiatedAt: ["PROCESSING", "PAID"].includes(statusMap[r.status] || "") ? "2026-02-19T10:00:00Z" : null,
        processedAt: statusMap[r.status] === "PAID" ? "2026-02-20T14:00:00Z" : null,
        paidAt: statusMap[r.status] === "PAID" ? "2026-02-21T09:00:00Z" : null,
        failureReason: null,
      };
    });
}

// =============================================================================
// Build Demo GSTIN Cache (CIGNET GSP Integration)
// =============================================================================

function buildDemoGstinCache(): GstinRecord[] {
  return [
    { id: "gstin-1", gstin: "27AABCU9603R1ZM", legalName: "Bharat Financial Services India Private Limited", tradeName: "BFS India Ltd", status: "ACTIVE", stateCode: "27", stateName: "Maharashtra", registrationType: "Regular", lastVerified: "2026-02-20T00:00:00Z", validatedVia: "CIGNET", address: "Mumbai, Maharashtra", einvoiceEnabled: true },
    { id: "gstin-2", gstin: "29AADCB2230Q2ZG", legalName: "BFS Digital Solutions Private Limited", tradeName: "BFS Digital", status: "ACTIVE", stateCode: "29", stateName: "Karnataka", registrationType: "Regular", lastVerified: "2026-02-20T00:00:00Z", validatedVia: "CIGNET", address: "Bangalore, Karnataka", einvoiceEnabled: true },
    { id: "gstin-3", gstin: "07AACCF8274K1Z8", legalName: "BFS Capital Markets Limited", tradeName: "BFS Capital", status: "ACTIVE", stateCode: "07", stateName: "Delhi", registrationType: "Regular", lastVerified: "2026-02-20T00:00:00Z", validatedVia: "CIGNET", address: "New Delhi, Delhi", einvoiceEnabled: true },
    { id: "gstin-4", gstin: "27AABCT1234R1ZM", legalName: "Taj Hotels & Resorts", tradeName: "IHCL", status: "ACTIVE", stateCode: "27", stateName: "Maharashtra", registrationType: "Regular", lastVerified: "2026-02-18T00:00:00Z", validatedVia: "CIGNET", address: "Mumbai, Maharashtra", einvoiceEnabled: true },
    { id: "gstin-5", gstin: "07AABCI5678S1ZN", legalName: "InterGlobe Aviation Ltd", tradeName: "IndiGo Airlines", status: "ACTIVE", stateCode: "07", stateName: "Delhi", registrationType: "Regular", lastVerified: "2026-02-15T00:00:00Z", validatedVia: "CIGNET", address: "Gurgaon, Haryana", einvoiceEnabled: true },
    { id: "gstin-6", gstin: "29AABCU9012T1ZP", legalName: "Uber India Systems Pvt Ltd", tradeName: "Uber India", status: "ACTIVE", stateCode: "29", stateName: "Karnataka", registrationType: "Regular", lastVerified: "2026-02-10T00:00:00Z", validatedVia: "CIGNET", address: "Bangalore, Karnataka", einvoiceEnabled: false },
    { id: "gstin-7", gstin: "29AABCB3456U1ZQ", legalName: "Bundl Technologies Pvt Ltd", tradeName: "Swiggy", status: "ACTIVE", stateCode: "29", stateName: "Karnataka", registrationType: "Regular", lastVerified: "2026-02-12T00:00:00Z", validatedVia: "CIGNET", address: "Bangalore, Karnataka", einvoiceEnabled: true },
    { id: "gstin-8", gstin: "27AABCA7890V1ZR", legalName: "Amazon Seller Services Pvt Ltd", tradeName: "Amazon India", status: "ACTIVE", stateCode: "27", stateName: "Maharashtra", registrationType: "Regular", lastVerified: "2026-02-14T00:00:00Z", validatedVia: "CIGNET", address: "Mumbai, Maharashtra", einvoiceEnabled: true },
    { id: "gstin-9", gstin: "27AABCW2345W1ZS", legalName: "WeWork India Management Pvt Ltd", tradeName: "WeWork India", status: "ACTIVE", stateCode: "27", stateName: "Maharashtra", registrationType: "Regular", lastVerified: "2026-02-16T00:00:00Z", validatedVia: "CIGNET", address: "Mumbai, Maharashtra", einvoiceEnabled: true },
    { id: "gstin-10", gstin: "27AABCS6789X1ZT", legalName: "Tata Starbucks Pvt Ltd", tradeName: "Starbucks India", status: "ACTIVE", stateCode: "27", stateName: "Maharashtra", registrationType: "Regular", lastVerified: "2026-02-08T00:00:00Z", validatedVia: "CIGNET", address: "Mumbai, Maharashtra", einvoiceEnabled: true },
  ];
}

// =============================================================================
// Build Demo Payment Profiles
// =============================================================================

function buildDemoPaymentProfiles(): PaymentProfile[] {
  const employees = deepClone(demoEmployees) as any[];
  const banks = [
    { name: "State Bank of India", ifsc: "SBIN0001234", branch: "Mumbai Main" },
    { name: "HDFC Bank", ifsc: "HDFC0005678", branch: "BKC Branch" },
    { name: "ICICI Bank", ifsc: "ICIC0009012", branch: "Andheri East" },
    { name: "Axis Bank", ifsc: "UTIB0003456", branch: "Lower Parel" },
    { name: "Kotak Mahindra Bank", ifsc: "KKBK0007890", branch: "Nariman Point" },
  ];

  return employees.slice(0, 10).map((emp: any, i: number) => {
    const bank = banks[i % banks.length];
    return {
      id: `pp-${i + 1}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      type: "BANK_ACCOUNT" as const,
      accountNumber: `XXXX${String(4000 + i * 111).slice(-4)}`,
      accountHolderName: `${emp.firstName} ${emp.lastName}`,
      ifscCode: bank.ifsc,
      bankName: bank.name,
      branchName: bank.branch,
      accountType: "SAVINGS" as const,
      upiVpa: i % 3 === 0 ? `${emp.firstName.toLowerCase()}@upi` : null,
      isPrimary: true,
      status: "VERIFIED" as const,
      addedAt: "2026-01-15T10:00:00Z",
      verifiedAt: "2026-01-16T14:00:00Z",
    };
  });
}

// =============================================================================
// Build Initial Store from Demo Data
// =============================================================================

function buildInitialStore(): Store {
  return {
    bankInstitutions: deepClone(demoBankInstitutions) as BankInstitution[],
    programs: deepClone(demoPrograms) as Program[],
    enterprises: deepClone(demoEnterprises) as Enterprise[],
    companies: deepClone(demoCompanies) as Company[],
    divisions: deepClone(demoDivisions) as Division[],
    departments: deepClone(demoDepartments) as Department[],
    costCenters: deepClone(demoCostCenters) as CostCenter[],
    employees: deepClone(demoEmployees) as Employee[],
    cards: deepClone(demoCards) as Card[],
    transactions: deepClone(demoTransactions) as Transaction[],
    expenses: [],
    expenseReports: [],
    approvals: [],
    policies: deepClone(demoPolicies) as Policy[],
    cardControlPolicies: deepClone(demoCardControlPolicies) as CardControlPolicy[],
    doaAuthorityLevels: deepClone(demoDoaAuthorityLevels) as DoaAuthorityLevel[],
    doaApprovalMatrix: deepClone(demoDoaApprovalMatrix) as DoaApprovalRule[],
    approvalChainRules: [
      {
        id: "acr-1",
        name: "Standard - Manager Only",
        amountMin: 0,
        amountMax: 50000,
        category: "ALL",
        approverChain: [{ role: "DEPT_MANAGER", level: 1 }],
        isActive: true,
      },
      {
        id: "acr-2",
        name: "Mid-Range - Manager + Finance",
        amountMin: 50001,
        amountMax: 200000,
        category: "ALL",
        approverChain: [
          { role: "DEPT_MANAGER", level: 1 },
          { role: "FINANCE_CONTROLLER", level: 2 },
        ],
        isActive: true,
      },
      {
        id: "acr-3",
        name: "High Value - Full Chain",
        amountMin: 200001,
        amountMax: 0,
        category: "ALL",
        approverChain: [
          { role: "DEPT_MANAGER", level: 1 },
          { role: "FINANCE_CONTROLLER", level: 2 },
          { role: "COMPANY_ADMIN", level: 3 },
        ],
        isActive: true,
      },
    ],
    cardStatements: deepClone(demoCardStatements) as CardStatement[],
    corporateStatements: deepClone(demoCorporateStatements) as CorporateStatement[],
    paymentCycles: deepClone(demoPaymentCycles) as PaymentCycle[],
    paymentApportionments: deepClone(demoPaymentApportionments) as PaymentApportionment[],
    workflowRequests: deepClone(demoWorkflowRequests) as WorkflowRequest[],
    disputes: deepClone(demoDisputes) as Dispute[],
    detectedSubscriptions: deepClone(demoDetectedSubscriptions) as DetectedSubscription[],
    scheduledCardActions: deepClone(demoScheduledCardActions) as ScheduledCardAction[],
    expenseCategories: buildDefaultExpenseCategories(),
    receipts: [],
    reimbursements: [],
    auditLog: [],
    gstinCache: buildDemoGstinCache(),
    paymentProfiles: buildDemoPaymentProfiles(),
  };
}

// =============================================================================
// Singleton Module-Level State
// =============================================================================

let store: Store = buildInitialStore();

// =============================================================================
// Module Configuration (persists in-memory)
// =============================================================================

export interface ModuleConfig {
  cardPortal: boolean;
  expenseManagement: boolean;
  ocrReceipts: boolean;
  aiAssistant: boolean;
  mileageTracking: boolean;
  perDiem: boolean;
  teamsIntegration: boolean;
  apExport: boolean;
  virtualCardIssuance: boolean;
  rbiLrs: boolean;
  gstCompliance: boolean;
  paymentMode: "REALTIME" | "BATCH";
}

let moduleConfig: ModuleConfig = {
  cardPortal: true,
  expenseManagement: false,
  ocrReceipts: true,
  aiAssistant: true,
  mileageTracking: false,
  perDiem: false,
  teamsIntegration: true,
  apExport: true,
  virtualCardIssuance: true,
  rbiLrs: false,
  gstCompliance: false,
  paymentMode: "BATCH" as const,
};

export function getModuleConfig(): ModuleConfig {
  return { ...moduleConfig };
}

export function updateModuleConfig(updates: Partial<ModuleConfig>): ModuleConfig {
  moduleConfig = { ...moduleConfig, ...updates };
  return { ...moduleConfig };
}

// =============================================================================
// Store Access & Reset
// =============================================================================

export function getStore(): Store {
  return store;
}

export function resetStore(): void {
  store = buildInitialStore();
}

export function exportStore() {
  return {
    ...store,
    analytics: getAnalytics(),
    stats: getStats(),
    exportedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Bank/Institution CRUD (Level 1 - read-only in UI, but CRUD available)
// =============================================================================

export function getBankInstitutions(): BankInstitution[] {
  return store.bankInstitutions;
}

export function getBankInstitution(id: string): BankInstitution | undefined {
  return store.bankInstitutions.find((b) => b.id === id);
}

export function addBankInstitution(data: Partial<BankInstitution>): BankInstitution {
  const bank: BankInstitution = {
    id: data.id || `bank-${generateId()}`,
    name: "",
    code: "",
    status: "ACTIVE",
    ...data,
  };
  store.bankInstitutions.push(bank);
  return bank;
}

export function updateBankInstitution(id: string, updates: Partial<BankInstitution>): BankInstitution | null {
  const idx = store.bankInstitutions.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  store.bankInstitutions[idx] = { ...store.bankInstitutions[idx], ...updates, id };
  return store.bankInstitutions[idx];
}

// =============================================================================
// Program CRUD (Level 2)
// =============================================================================

export function getPrograms(): Program[] {
  return store.programs;
}

export function getProgram(id: string): Program | undefined {
  return store.programs.find((p) => p.id === id);
}

export function addProgram(data: Partial<Program>): Program {
  const program: Program = {
    id: data.id || `prog-${generateId()}`,
    name: "",
    code: "",
    bankId: "",
    status: "ACTIVE",
    description: "",
    ...data,
  };
  store.programs.push(program);
  return program;
}

export function updateProgram(id: string, updates: Partial<Program>): Program | null {
  const idx = store.programs.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.programs[idx] = { ...store.programs[idx], ...updates, id };
  return store.programs[idx];
}

// =============================================================================
// Enterprise CRUD
// =============================================================================

export function getEnterprises(): Enterprise[] {
  return store.enterprises;
}

export function getEnterprise(id: string): Enterprise | undefined {
  return store.enterprises.find((e) => e.id === id);
}

export function addEnterprise(data: Partial<Enterprise>): Enterprise {
  const enterprise: Enterprise = {
    name: data.name || "",
    status: data.status || "ACTIVE",
    ...data,
    id: data.id || `ent-${generateId()}`,
  } as Enterprise;
  store.enterprises.push(enterprise);
  return enterprise;
}

export function updateEnterprise(id: string, updates: Partial<Enterprise>): Enterprise | null {
  const idx = store.enterprises.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  store.enterprises[idx] = { ...store.enterprises[idx], ...updates, id };
  return store.enterprises[idx];
}

export function deleteEnterprise(id: string): boolean {
  const idx = store.enterprises.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.enterprises.splice(idx, 1);
  return true;
}

export function bulkImportEnterprises(items: Partial<Enterprise>[]): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;
  items.forEach((item, i) => {
    try {
      if (!item.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      addEnterprise(item);
      imported++;
    } catch (e) { errors.push(`Row ${i + 1}: ${(e as Error).message}`); }
  });
  return { imported, errors };
}

// =============================================================================
// Company CRUD
// =============================================================================

export function getCompanies(): Company[] {
  return store.companies;
}

export function getCompany(id: string): Company | undefined {
  return store.companies.find((c) => c.id === id);
}

export function addCompany(data: Partial<Company>): Company {
  const company: Company = {
    id: data.id || `comp-${generateId()}`,
    name: "",
    legalName: "",
    gstin: "",
    pan: "",
    cin: "",
    baseCurrency: "INR",
    enterpriseId: "",
    programId: "",
    ...data,
  };
  store.companies.push(company);
  return company;
}

export function updateCompany(id: string, updates: Partial<Company>): Company | null {
  const idx = store.companies.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.companies[idx] = { ...store.companies[idx], ...updates, id };
  return store.companies[idx];
}

export function deleteCompany(id: string): boolean {
  const idx = store.companies.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.companies.splice(idx, 1);
  return true;
}

export function bulkImportCompanies(items: Partial<Company>[]): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;
  items.forEach((item, i) => {
    try {
      if (!item.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      if (!item.enterpriseId) { errors.push(`Row ${i + 1}: enterpriseId is required`); return; }
      addCompany(item);
      imported++;
    } catch (e) { errors.push(`Row ${i + 1}: ${(e as Error).message}`); }
  });
  return { imported, errors };
}

// =============================================================================
// Division CRUD
// =============================================================================

export function getDivisions(): Division[] {
  return store.divisions;
}

export function getDivision(id: string): Division | undefined {
  return store.divisions.find((d) => d.id === id);
}

export function addDivision(data: Partial<Division>): Division {
  const division: Division = {
    id: data.id || `div-${generateId()}`,
    name: "",
    code: "",
    companyId: "",
    budget: 0,
    ...data,
  };
  store.divisions.push(division);
  return division;
}

export function updateDivision(id: string, updates: Partial<Division>): Division | null {
  const idx = store.divisions.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  store.divisions[idx] = { ...store.divisions[idx], ...updates, id };
  return store.divisions[idx];
}

export function deleteDivision(id: string): boolean {
  const idx = store.divisions.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  store.divisions.splice(idx, 1);
  return true;
}

export function bulkImportDivisions(items: Partial<Division>[]): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;
  items.forEach((item, i) => {
    try {
      if (!item.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      if (!item.companyId) { errors.push(`Row ${i + 1}: companyId is required`); return; }
      addDivision(item);
      imported++;
    } catch (e) { errors.push(`Row ${i + 1}: ${(e as Error).message}`); }
  });
  return { imported, errors };
}

// =============================================================================
// Department CRUD
// =============================================================================

export function getDepartments(): Department[] {
  return store.departments;
}

export function getDepartment(id: string): Department | undefined {
  return store.departments.find((d) => d.id === id);
}

export function addDepartment(data: Partial<Department>): Department {
  const department: Department = {
    id: data.id || `dept-${generateId()}`,
    name: "",
    code: "",
    divisionId: "",
    budget: 0,
    glCodePrefix: "",
    ...data,
  };
  store.departments.push(department);
  return department;
}

export function updateDepartment(id: string, updates: Partial<Department>): Department | null {
  const idx = store.departments.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  store.departments[idx] = { ...store.departments[idx], ...updates, id };
  return store.departments[idx];
}

export function deleteDepartment(id: string): boolean {
  const idx = store.departments.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  store.departments.splice(idx, 1);
  return true;
}

export function bulkImportDepartments(items: Partial<Department>[]): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;
  items.forEach((item, i) => {
    try {
      if (!item.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      if (!item.divisionId) { errors.push(`Row ${i + 1}: divisionId is required`); return; }
      addDepartment(item);
      imported++;
    } catch (e) { errors.push(`Row ${i + 1}: ${(e as Error).message}`); }
  });
  return { imported, errors };
}

// =============================================================================
// Cost Center CRUD
// =============================================================================

export function getCostCenters(): CostCenter[] {
  return store.costCenters;
}

export function getCostCenter(id: string): CostCenter | undefined {
  return store.costCenters.find((c) => c.id === id);
}

export function addCostCenter(data: Partial<CostCenter>): CostCenter {
  const costCenter: CostCenter = {
    id: data.id || `cc-${generateId()}`,
    code: "",
    name: "",
    glCode: "",
    budget: 0,
    utilized: 0,
    departmentId: "",
    companyId: "",
    ...data,
  };
  store.costCenters.push(costCenter);
  return costCenter;
}

export function updateCostCenter(id: string, updates: Partial<CostCenter>): CostCenter | null {
  const idx = store.costCenters.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.costCenters[idx] = { ...store.costCenters[idx], ...updates, id };
  return store.costCenters[idx];
}

export function deleteCostCenter(id: string): boolean {
  const idx = store.costCenters.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.costCenters.splice(idx, 1);
  return true;
}

export function bulkImportCostCenters(items: Partial<CostCenter>[]): { imported: number; errors: string[] } {
  const errors: string[] = [];
  let imported = 0;
  items.forEach((item, i) => {
    try {
      if (!item.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      if (!item.code) { errors.push(`Row ${i + 1}: code is required`); return; }
      if (!item.companyId) { errors.push(`Row ${i + 1}: companyId is required`); return; }
      addCostCenter(item);
      imported++;
    } catch (e) { errors.push(`Row ${i + 1}: ${(e as Error).message}`); }
  });
  return { imported, errors };
}

// =============================================================================
// Employee CRUD
// =============================================================================

export function getEmployees(filters?: EmployeeFilters): Employee[] {
  let result = store.employees;
  if (!filters) return result;
  if (filters.status) {
    result = result.filter((e) => e.status === filters.status);
  }
  if (filters.departmentId) {
    result = result.filter((e) => e.departmentId === filters.departmentId);
  }
  if (filters.level) {
    result = result.filter((e) => e.level === filters.level);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.firstName.toLowerCase().includes(s) ||
        e.lastName.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.employeeNumber.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getEmployee(id: string): Employee | undefined {
  return store.employees.find((e) => e.id === id);
}

/** @deprecated Use getEmployee(id) instead */
export function getEmployeeById(id: string): Employee | null {
  return store.employees.find((e) => e.id === id) || null;
}

export function getEmployeeByEmail(email: string): Employee | undefined {
  return store.employees.find((e) => e.email === email);
}

export function addEmployee(data: Partial<Employee>): Employee {
  // Auto-generate employee number if not provided
  let employeeNumber = data.employeeNumber;
  if (!employeeNumber) {
    const maxNum = store.employees
      .map((e) => parseInt(e.employeeNumber.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
    employeeNumber = `BFS${String(maxNum + 1).padStart(3, "0")}`;
  }
  const employee: Employee = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    departmentId: "",
    costCenterId: "",
    level: "STAFF",
    pan: "",
    status: "ACTIVE",
    ...data,
    id: data.id || `emp-${generateId()}`,
    employeeNumber,
  };
  store.employees.push(employee);
  return employee;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const idx = store.employees.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  store.employees[idx] = { ...store.employees[idx], ...updates, id };
  return store.employees[idx];
}

export function deleteEmployee(id: string): boolean {
  const idx = store.employees.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.employees.splice(idx, 1);
  return true;
}

export function bulkImportEmployees(
  records: Partial<Employee>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (!record.firstName) { errors.push(`Row ${i + 1}: firstName is required`); return; }
      if (!record.lastName) { errors.push(`Row ${i + 1}: lastName is required`); return; }
      if (!record.email) { errors.push(`Row ${i + 1}: email is required`); return; }
      addEmployee(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Card CRUD
// =============================================================================

export function getCards(filters?: CardFilters): Card[] {
  let result = store.cards;
  if (!filters) return result;
  if (filters.status) {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters.employeeId) {
    result = result.filter((c) => c.employeeId === filters.employeeId);
  }
  if (filters.type) {
    result = result.filter((c) => c.type === filters.type);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.employeeName.toLowerCase().includes(s) ||
        c.last4Digits.includes(s) ||
        c.department.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getCard(id: string): Card | undefined {
  return store.cards.find((c) => c.id === id);
}

/** @deprecated Use getCard(id) instead */
export function getCardById(id: string): Card | null {
  return store.cards.find((c) => c.id === id) || null;
}

export function getCardsByEmployee(employeeId: string): Card[] {
  return store.cards.filter((c) => c.employeeId === employeeId);
}

export function addCard(data: Partial<Card>): Card {
  // Auto-generate last4 if not provided
  const last4Digits = data.last4Digits || String(Math.floor(Math.random() * 9000) + 1000);
  // Resolve employee name and department if employeeId is provided
  let employeeName = data.employeeName || "";
  let department = data.department || "";
  if (data.employeeId && !data.employeeName) {
    const emp = getEmployee(data.employeeId);
    if (emp) {
      employeeName = `${emp.firstName} ${emp.lastName}`;
      if (!data.department) {
        const dept = getDepartment(emp.departmentId);
        department = dept?.name || "";
      }
    }
  }
  const card: Card = {
    type: "VIRTUAL",
    status: "ACTIVE",
    network: "VISA",
    employeeId: "",
    spendLimits: { perTransaction: 50000, daily: 100000, monthly: 500000 },
    expiryDate: new Date(new Date().getFullYear() + 3, 11, 31).toISOString().split("T")[0],
    issuedDate: new Date().toISOString().split("T")[0],
    utilizationPercent: 0,
    ...data,
    id: data.id || `card-${generateId()}`,
    last4Digits,
    employeeName,
    department,
  };
  store.cards.push(card);
  return card;
}

export function updateCard(id: string, updates: Partial<Card>): Card | null {
  const idx = store.cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.cards[idx] = { ...store.cards[idx], ...updates, id };
  return store.cards[idx];
}

export function deleteCard(id: string): boolean {
  const idx = store.cards.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.cards.splice(idx, 1);
  return true;
}

export function bulkImportCards(
  records: Partial<Card>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (!record.employeeId) { errors.push(`Row ${i + 1}: employeeId is required`); return; }
      addCard(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Transaction CRUD
// =============================================================================

export function getTransactions(filters?: TransactionFilters): Transaction[] {
  let result = store.transactions;
  if (!filters) return result;
  if (filters.status) {
    result = result.filter((t) => t.status === filters.status);
  }
  if (filters.employeeId) {
    result = result.filter((t) => t.employeeId === filters.employeeId);
  }
  if (filters.cardId) {
    result = result.filter((t) => t.cardId === filters.cardId);
  }
  if (filters.dateFrom) {
    result = result.filter((t) => t.timestamp >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((t) => t.timestamp <= filters.dateTo!);
  }
  if (filters.category) {
    result = result.filter((t) => t.mccCategory === filters.category);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.merchantName.toLowerCase().includes(s) ||
        t.employeeName.toLowerCase().includes(s) ||
        t.mccCategory.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getTransaction(id: string): Transaction | undefined {
  return store.transactions.find((t) => t.id === id);
}

export function getTransactionsByCard(cardId: string): Transaction[] {
  return store.transactions.filter((t) => t.cardId === cardId);
}

export function getTransactionsByEmployee(employeeId: string): Transaction[] {
  return store.transactions.filter((t) => t.employeeId === employeeId);
}

export function addTransaction(data: Partial<Transaction>): Transaction {
  // Resolve card info
  let cardLast4 = data.cardLast4 || "";
  let employeeId = data.employeeId || "";
  let employeeName = data.employeeName || "";
  if (data.cardId && !data.cardLast4) {
    const card = getCard(data.cardId);
    if (card) {
      cardLast4 = card.last4Digits;
      if (!data.employeeId) employeeId = card.employeeId;
      if (!data.employeeName) employeeName = card.employeeName;
    }
  }
  // Auto-calculate billing amount and GST
  const amount = data.amount || 0;
  const billingAmount = data.billingAmount ?? amount;
  const gstAmount = data.gstAmount ?? Math.round(amount * 0.18 * 100) / 100;
  // Auto-generate auth code
  const authCode = data.authCode || `A${generateId().slice(0, 6).toUpperCase()}`;

  const txn: Transaction = {
    cardId: "",
    eventType: "AUTH",
    currency: "INR",
    billingCurrency: "INR",
    merchantName: "",
    mcc: "",
    mccCategory: "",
    status: "PENDING",
    channel: "ECOM",
    location: { city: "Mumbai", country: "IN" },
    timestamp: new Date().toISOString(),
    hasReceipt: false,
    ...data,
    id: data.id || `txn-${generateId()}`,
    cardLast4,
    employeeId,
    employeeName,
    amount,
    billingAmount,
    gstAmount,
    authCode,
  };
  store.transactions.push(txn);
  // Keep sorted by timestamp descending
  store.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return txn;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
  const idx = store.transactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  store.transactions[idx] = { ...store.transactions[idx], ...updates, id };
  return store.transactions[idx];
}

export function deleteTransaction(id: string): boolean {
  const idx = store.transactions.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  store.transactions.splice(idx, 1);
  return true;
}

export function bulkImportTransactions(
  records: Partial<Transaction>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (!record.cardId) { errors.push(`Row ${i + 1}: cardId is required`); return; }
      if (record.amount == null) { errors.push(`Row ${i + 1}: amount is required`); return; }
      if (!record.merchantName) { errors.push(`Row ${i + 1}: merchantName is required`); return; }
      addTransaction(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Expense CRUD
// =============================================================================

export function getExpenses(filters?: ExpenseFilters): Expense[] {
  let result = store.expenses;
  if (!filters) return result;
  if (filters.employeeId) {
    result = result.filter((e) => e.employeeId === filters.employeeId);
  }
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.policyStatus) {
    result = result.filter((e) => e.policyStatus === filters.policyStatus);
  }
  if (filters.type) {
    result = result.filter((e) => e.type === filters.type);
  }
  if (filters.dateFrom) {
    result = result.filter((e) => e.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((e) => e.date <= filters.dateTo!);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(s) ||
        e.merchantName.toLowerCase().includes(s) ||
        e.category.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getExpense(id: string): Expense | undefined {
  return store.expenses.find((e) => e.id === id);
}

export function getExpensesByEmployee(employeeId: string): Expense[] {
  return store.expenses.filter((e) => e.employeeId === employeeId);
}

export function addExpense(data: Partial<Expense>): Expense {
  // Auto-populate from transaction if linked
  let amount = data.amount || 0;
  let employeeId = data.employeeId || "";
  let employeeName = data.employeeName || "";
  let merchantName = data.merchantName || "";
  let date = data.date || new Date().toISOString();
  let hasReceipt = data.hasReceipt ?? false;
  if (data.transactionId) {
    const txn = getTransaction(data.transactionId);
    if (txn) {
      if (!data.amount) amount = txn.amount;
      if (!data.employeeId) employeeId = txn.employeeId;
      if (!data.employeeName) employeeName = txn.employeeName;
      if (!data.merchantName) merchantName = txn.merchantName;
      if (!data.date) date = txn.timestamp;
      if (data.hasReceipt == null) hasReceipt = txn.hasReceipt;
    }
  }
  // Auto-compute GST
  let gstDetails = data.gstDetails || { gstin: "", cgst: 0, sgst: 0, igst: 0 };
  if (amount && gstDetails.cgst === 0 && gstDetails.sgst === 0 && gstDetails.igst === 0) {
    gstDetails = {
      gstin: gstDetails.gstin || "",
      cgst: Math.round(amount * 0.09 * 100) / 100,
      sgst: Math.round(amount * 0.09 * 100) / 100,
      igst: 0,
    };
  }
  // Resolve cost center name
  let costCenterName = data.costCenterName || "";
  if (data.costCenterId && !data.costCenterName) {
    const cc = getCostCenter(data.costCenterId);
    costCenterName = cc?.name || "";
  }
  const expense: Expense = {
    transactionId: data.transactionId || null,
    originalCurrency: "INR",
    category: "",
    glCode: "",
    costCenterId: "",
    policyStatus: "COMPLIANT",
    businessPurpose: "",
    type: "CARD",
    ...data,
    id: data.id || `exp-${generateId()}`,
    amount,
    employeeId,
    employeeName,
    merchantName,
    date,
    hasReceipt,
    costCenterName,
    gstDetails,
  };
  store.expenses.push(expense);
  addAuditLogEntry({
    entityType: "EXPENSE",
    entityId: expense.id,
    action: "CREATE",
    userName: expense.employeeName || "System",
    metadata: { amount: expense.amount, merchantName: expense.merchantName, category: expense.category },
  });
  return expense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const idx = store.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const old = { ...store.expenses[idx] };
  store.expenses[idx] = { ...store.expenses[idx], ...updates, id };
  addAuditLogEntry({
    entityType: "EXPENSE",
    entityId: id,
    action: "UPDATE",
    userName: "System",
    changes: Object.keys(updates).reduce((acc, key) => {
      acc[key] = { old: (old as any)[key], new: (updates as any)[key] };
      return acc;
    }, {} as Record<string, { old: any; new: any }>),
  });
  return store.expenses[idx];
}

export function deleteExpense(id: string): boolean {
  const idx = store.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.expenses.splice(idx, 1);
  return true;
}

export function bulkImportExpenses(
  records: Partial<Expense>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (record.amount == null) { errors.push(`Row ${i + 1}: amount is required`); return; }
      if (!record.category) { errors.push(`Row ${i + 1}: category is required`); return; }
      if (!record.employeeId) { errors.push(`Row ${i + 1}: employeeId is required`); return; }
      addExpense(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Expense Report CRUD
// =============================================================================

export function getExpenseReports(filters?: ExpenseReportFilters): ExpenseReport[] {
  let result = store.expenseReports;
  if (!filters) return result;
  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }
  if (filters.employeeId) {
    result = result.filter((r) => r.employeeId === filters.employeeId);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(s) ||
        r.reportNumber.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getExpenseReport(id: string): ExpenseReport | undefined {
  return store.expenseReports.find((r) => r.id === id);
}

export function getExpenseReportsByEmployee(employeeId: string): ExpenseReport[] {
  return store.expenseReports.filter((r) => r.employeeId === employeeId);
}

export function addExpenseReport(data: Partial<ExpenseReport>): ExpenseReport {
  // Auto-generate report number
  const maxNum = store.expenseReports
    .map((r) => {
      const match = r.reportNumber.match(/EXP-\d+-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .reduce((max, n) => Math.max(max, n), 0);
  const year = new Date().getFullYear();
  const reportNumber = data.reportNumber || `EXP-${year}-${String(maxNum + 1).padStart(4, "0")}`;
  // Resolve employee info
  let employeeName = data.employeeName || "";
  let department = data.department || "";
  if (data.employeeId && !data.employeeName) {
    const emp = getEmployee(data.employeeId);
    if (emp) {
      employeeName = `${emp.firstName} ${emp.lastName}`;
      if (!data.department) {
        const dept = getDepartment(emp.departmentId);
        department = dept?.name || "";
      }
    }
  }
  const report: ExpenseReport = {
    employeeId: "",
    title: "",
    status: "DRAFT",
    totalAmount: 0,
    currency: "INR",
    expenseCount: 0,
    period: `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    submittedAt: null,
    approvedAt: null,
    paidAt: null,
    policyScore: 100,
    ...data,
    id: data.id || `rpt-${generateId()}`,
    reportNumber,
    employeeName,
    department,
  };
  store.expenseReports.push(report);
  addAuditLogEntry({
    entityType: "EXPENSE_REPORT",
    entityId: report.id,
    action: "CREATE",
    userName: report.employeeName || "System",
    metadata: { reportNumber: report.reportNumber, totalAmount: report.totalAmount, status: report.status },
  });
  return report;
}

export function updateExpenseReport(id: string, updates: Partial<ExpenseReport>): ExpenseReport | null {
  const idx = store.expenseReports.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.expenseReports[idx] = { ...store.expenseReports[idx], ...updates, id };
  return store.expenseReports[idx];
}

export function deleteExpenseReport(id: string): boolean {
  const idx = store.expenseReports.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.expenseReports.splice(idx, 1);
  return true;
}

export function bulkImportExpenseReports(
  records: Partial<ExpenseReport>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (!record.employeeId) { errors.push(`Row ${i + 1}: employeeId is required`); return; }
      if (!record.title) { errors.push(`Row ${i + 1}: title is required`); return; }
      addExpenseReport(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Approval CRUD
// =============================================================================

export function getApprovals(filters?: ApprovalFilters): Approval[] {
  let result = store.approvals;
  if (!filters) return result;
  if (filters.status) {
    result = result.filter((a) => a.status === filters.status);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.employeeName.toLowerCase().includes(s) ||
        a.reportNumber.toLowerCase().includes(s) ||
        a.department.toLowerCase().includes(s)
    );
  }
  return result;
}

export function getApproval(id: string): Approval | undefined {
  return store.approvals.find((a) => a.id === id);
}

export function getPendingApprovals(): Approval[] {
  return store.approvals.filter((a) => a.status === "PENDING");
}

export function addApproval(data: Partial<Approval>): Approval {
  const approval: Approval = {
    id: data.id || `appr-${generateId()}`,
    entityType: "EXPENSE_REPORT",
    entityId: "",
    reportNumber: "",
    employeeName: "",
    department: "",
    amount: 0,
    expenseCount: 0,
    status: "PENDING",
    level: 1,
    submittedAt: null,
    dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    policyScore: 100,
    ...data,
  };
  store.approvals.push(approval);
  return approval;
}

export function updateApproval(
  id: string,
  data: { status: string; comment?: string; reviewedBy?: string }
): Approval | null {
  const idx = store.approvals.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.approvals[idx] = { ...store.approvals[idx], status: data.status };

  // Also update the corresponding expense report status
  const approval = store.approvals[idx];
  const reportIdx = store.expenseReports.findIndex((r) => r.id === approval.entityId);
  if (reportIdx !== -1) {
    if (data.status === "APPROVED") {
      store.expenseReports[reportIdx] = {
        ...store.expenseReports[reportIdx],
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
      };
    } else if (data.status === "REJECTED") {
      store.expenseReports[reportIdx] = {
        ...store.expenseReports[reportIdx],
        status: "REJECTED",
      };
    }
  }

  const auditAction = data.status === "APPROVED" ? "APPROVE" : data.status === "REJECTED" ? "REJECT" : "UPDATE";
  addAuditLogEntry({
    entityType: "APPROVAL",
    entityId: id,
    action: auditAction,
    userName: data.reviewedBy || "System",
    metadata: { status: data.status, comment: data.comment, entityId: approval.entityId, reportNumber: approval.reportNumber },
  });

  return store.approvals[idx];
}

export function deleteApproval(id: string): boolean {
  const idx = store.approvals.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.approvals.splice(idx, 1);
  return true;
}

// =============================================================================
// Policy CRUD
// =============================================================================

export function getPolicies(): Policy[] {
  return store.policies;
}

export function getPolicy(id: string): Policy | undefined {
  return store.policies.find((p) => p.id === id);
}

export function getActivePolicies(): Policy[] {
  return store.policies.filter((p) => p.isActive);
}

export function addPolicy(data: Partial<Policy>): Policy {
  const policy: Policy = {
    id: data.id || `pol-${generateId()}`,
    name: "",
    type: "CATEGORY",
    rules: {},
    severity: "SOFT",
    isActive: true,
    version: 1,
    ...data,
  };
  store.policies.push(policy);
  return policy;
}

export function updatePolicy(id: string, updates: Partial<Policy>): Policy | null {
  const idx = store.policies.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  // Auto-increment version when rules change
  if (updates.rules) {
    updates.version = (store.policies[idx].version || 0) + 1;
  }
  store.policies[idx] = { ...store.policies[idx], ...updates, id };
  return store.policies[idx];
}

export function deletePolicy(id: string): boolean {
  const idx = store.policies.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.policies.splice(idx, 1);
  return true;
}

export function bulkImportPolicies(
  records: Partial<Policy>[]
): { imported: number; errors: string[]; total: number } {
  const errors: string[] = [];
  let imported = 0;
  records.forEach((record, i) => {
    try {
      if (!record.name) { errors.push(`Row ${i + 1}: name is required`); return; }
      addPolicy(record);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: records.length };
}

// =============================================================================
// Card Control Policy CRUD
// =============================================================================

export function getCardControlPolicies(): CardControlPolicy[] {
  return store.cardControlPolicies;
}

export function getCardControlPolicy(id: string): CardControlPolicy | undefined {
  return store.cardControlPolicies.find((p) => p.id === id);
}

export function getCardControlPolicyByNode(nodeId: string): CardControlPolicy | undefined {
  return store.cardControlPolicies.find((p) => p.nodeId === nodeId);
}

export function addCardControlPolicy(data: Partial<CardControlPolicy>): CardControlPolicy {
  const policy: CardControlPolicy = {
    id: data.id || `ccp-${generateId()}`,
    nodeId: "",
    nodeType: "company",
    nodeName: "",
    spendLimits: { perTransaction: 50000, daily: 100000, monthly: 500000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: false, domesticOnly: true },
    mccRestrictions: [],
    isOverride: false,
    ...data,
  };
  // Remove existing policy for same nodeId if present
  const existingIdx = store.cardControlPolicies.findIndex((p) => p.nodeId === policy.nodeId);
  if (existingIdx !== -1) {
    store.cardControlPolicies[existingIdx] = policy;
  } else {
    store.cardControlPolicies.push(policy);
  }
  return policy;
}

export function updateCardControlPolicy(id: string, updates: Partial<CardControlPolicy>): CardControlPolicy | null {
  const idx = store.cardControlPolicies.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.cardControlPolicies[idx] = { ...store.cardControlPolicies[idx], ...updates, id };
  return store.cardControlPolicies[idx];
}

export function deleteCardControlPolicy(id: string): boolean {
  const idx = store.cardControlPolicies.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.cardControlPolicies.splice(idx, 1);
  return true;
}

/**
 * Resolve the effective card control policy for a hierarchy node.
 * Walks up the hierarchy: department -> division -> company, returning the
 * first policy found (closest override), or a default if none exists.
 */
export function getEffectiveCardControlPolicy(
  nodeId: string,
  nodeType: "company" | "division" | "department"
): { policy: CardControlPolicy; source: string; sourceType: string } {
  // Direct policy
  const direct = store.cardControlPolicies.find((p) => p.nodeId === nodeId);
  if (direct) {
    return { policy: direct, source: direct.nodeName, sourceType: direct.nodeType };
  }

  // Walk up: department -> division -> company
  if (nodeType === "department") {
    const dept = store.departments.find((d) => d.id === nodeId);
    if (dept) {
      const divPolicy = store.cardControlPolicies.find((p) => p.nodeId === dept.divisionId);
      if (divPolicy) {
        return { policy: divPolicy, source: divPolicy.nodeName, sourceType: "division" };
      }
      // Try company
      const div = store.divisions.find((d) => d.id === dept.divisionId);
      if (div) {
        const compPolicy = store.cardControlPolicies.find((p) => p.nodeId === div.companyId);
        if (compPolicy) {
          return { policy: compPolicy, source: compPolicy.nodeName, sourceType: "company" };
        }
      }
    }
  }

  if (nodeType === "division") {
    const div = store.divisions.find((d) => d.id === nodeId);
    if (div) {
      const compPolicy = store.cardControlPolicies.find((p) => p.nodeId === div.companyId);
      if (compPolicy) {
        return { policy: compPolicy, source: compPolicy.nodeName, sourceType: "company" };
      }
    }
  }

  // Default fallback
  const fallback: CardControlPolicy = {
    id: "default",
    nodeId: nodeId,
    nodeType: nodeType,
    nodeName: "Default",
    spendLimits: { perTransaction: 50000, daily: 100000, monthly: 500000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: false, domesticOnly: true },
    mccRestrictions: ["Gambling", "Crypto"],
    isOverride: false,
  };
  return { policy: fallback, source: "System Default", sourceType: "default" };
}

// =============================================================================
// DOA Authority Level CRUD
// =============================================================================

export function getDoaAuthorityLevels(): DoaAuthorityLevel[] {
  return store.doaAuthorityLevels;
}

export function getDoaAuthorityLevel(id: string): DoaAuthorityLevel | undefined {
  return store.doaAuthorityLevels.find((l) => l.id === id);
}

export function addDoaAuthorityLevel(data: Partial<DoaAuthorityLevel>): DoaAuthorityLevel {
  const level: DoaAuthorityLevel = {
    id: data.id || `doa-lvl-${generateId()}`,
    name: "",
    maxAmount: 0,
    allowedCategories: ["All"],
    ...data,
  };
  store.doaAuthorityLevels.push(level);
  return level;
}

export function updateDoaAuthorityLevel(id: string, updates: Partial<DoaAuthorityLevel>): DoaAuthorityLevel | null {
  const idx = store.doaAuthorityLevels.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.doaAuthorityLevels[idx] = { ...store.doaAuthorityLevels[idx], ...updates, id };
  return store.doaAuthorityLevels[idx];
}

export function deleteDoaAuthorityLevel(id: string): boolean {
  const idx = store.doaAuthorityLevels.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  store.doaAuthorityLevels.splice(idx, 1);
  return true;
}

// =============================================================================
// DOA Approval Matrix CRUD
// =============================================================================

export function getDoaApprovalMatrix(): DoaApprovalRule[] {
  return store.doaApprovalMatrix;
}

export function getDoaApprovalRule(id: string): DoaApprovalRule | undefined {
  return store.doaApprovalMatrix.find((r) => r.id === id);
}

export function addDoaApprovalRule(data: Partial<DoaApprovalRule>): DoaApprovalRule {
  const rule: DoaApprovalRule = {
    id: data.id || `doa-rule-${generateId()}`,
    amountRange: "",
    category: "All",
    approvers: "",
    ...data,
  };
  store.doaApprovalMatrix.push(rule);
  return rule;
}

export function updateDoaApprovalRule(id: string, updates: Partial<DoaApprovalRule>): DoaApprovalRule | null {
  const idx = store.doaApprovalMatrix.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.doaApprovalMatrix[idx] = { ...store.doaApprovalMatrix[idx], ...updates, id };
  return store.doaApprovalMatrix[idx];
}

export function deleteDoaApprovalRule(id: string): boolean {
  const idx = store.doaApprovalMatrix.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.doaApprovalMatrix.splice(idx, 1);
  return true;
}

// =============================================================================
// Approval Chain Rules CRUD
// =============================================================================

export function getApprovalChainRules(): ApprovalChainRule[] {
  return store.approvalChainRules;
}

export function getApprovalChainRule(id: string): ApprovalChainRule | undefined {
  return store.approvalChainRules.find((r) => r.id === id);
}

export function addApprovalChainRule(data: Partial<ApprovalChainRule>): ApprovalChainRule {
  const rule: ApprovalChainRule = {
    id: data.id || `acr-${generateId()}`,
    name: "",
    amountMin: 0,
    amountMax: 0,
    category: "ALL",
    approverChain: [],
    isActive: true,
    ...data,
  };
  store.approvalChainRules.push(rule);
  return rule;
}

export function updateApprovalChainRule(id: string, updates: Partial<ApprovalChainRule>): ApprovalChainRule | null {
  const idx = store.approvalChainRules.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.approvalChainRules[idx] = { ...store.approvalChainRules[idx], ...updates, id };
  return store.approvalChainRules[idx];
}

export function deleteApprovalChainRule(id: string): boolean {
  const idx = store.approvalChainRules.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.approvalChainRules.splice(idx, 1);
  return true;
}

// =============================================================================
// Hierarchy (nested view + generic add/import — backward compatible)
// =============================================================================

export function getHierarchy() {
  return {
    bankInstitutions: store.bankInstitutions.map((bank) => ({
      ...bank,
      programs: store.programs
        .filter((p) => p.bankId === bank.id)
        .map((prog) => ({
          ...prog,
          companies: store.companies
            .filter((c) => c.programId === prog.id)
            .map((comp) => ({
              ...comp,
              divisions: store.divisions
                .filter((d) => d.companyId === comp.id)
                .map((div) => ({
                  ...div,
                  departments: store.departments
                    .filter((dept) => dept.divisionId === div.id)
                    .map((dept) => ({
                      ...dept,
                      costCenters: store.costCenters.filter((cc) => cc.departmentId === dept.id),
                    })),
                })),
            })),
        })),
    })),
    // Backward compatibility: flat views
    enterprises: store.enterprises,
    costCenters: store.costCenters,
    doaAuthorityLevels: store.doaAuthorityLevels,
    doaApprovalMatrix: store.doaApprovalMatrix,
    hierarchySpend: getAnalytics().hierarchySpend,
  };
}

export function addHierarchyNode(data: {
  type: "bank" | "program" | "enterprise" | "company" | "division" | "department" | "costCenter";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any;
}) {
  switch (data.type) {
    case "bank":
      return addBankInstitution(data.record);
    case "program":
      return addProgram(data.record);
    case "enterprise":
      return addEnterprise(data.record);
    case "company":
      return addCompany(data.record);
    case "division":
      return addDivision(data.record);
    case "department":
      return addDepartment(data.record);
    case "costCenter":
      return addCostCenter(data.record);
  }
}

export function bulkImportHierarchy(
  items: {
    type: "bank" | "program" | "enterprise" | "company" | "division" | "department" | "costCenter";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: any;
  }[]
): { imported: number; errors: string[]; total: number } {
  let imported = 0;
  const errors: string[] = [];
  items.forEach((item, i) => {
    try {
      addHierarchyNode(item);
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  });
  return { imported, errors, total: items.length };
}

// =============================================================================
// Computed: Dashboard Stats (fully derived from store data)
// =============================================================================

export function getStats(): DashboardStats {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Financial year starts April 1 (month index 3)
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const fyStart = new Date(fyStartYear, 3, 1);
  const monthStart = new Date(currentYear, currentMonth, 1);

  // MTD transactions
  const mtdTransactions = store.transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return d >= monthStart && d <= now;
  });
  const totalSpendMTD = mtdTransactions.reduce((sum, t) => sum + t.amount, 0);

  // YTD transactions (financial year)
  const ytdTransactions = store.transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return d >= fyStart && d <= now;
  });
  const totalSpendYTD = ytdTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Card stats
  const totalCards = store.cards.length;
  const activeCards = store.cards.filter((c) => c.status === "ACTIVE").length;

  // Card limits (sum of monthly limits across all cards)
  const cardLimitTotal = store.cards.reduce((sum, c) => sum + (c.spendLimits?.monthly || 0), 0);
  // Average utilization across all cards applied to total limit
  const avgUtilization = totalCards > 0
    ? store.cards.reduce((sum, c) => sum + (c.utilizationPercent || 0), 0) / totalCards
    : 0;
  const cardLimitUtilized = Math.round(cardLimitTotal * avgUtilization / 100);
  const limitUtilizationPercent = cardLimitTotal > 0 ? Math.round((cardLimitUtilized / cardLimitTotal) * 100) : 0;

  // Pending approvals
  const pendingApprovals = store.approvals.filter((a) => a.status === "PENDING").length;

  // Policy compliance score: % of compliant expenses
  const totalExpenses = store.expenses.length;
  const compliantExpenses = store.expenses.filter((e) => e.policyStatus === "COMPLIANT").length;
  const policyComplianceScore = totalExpenses > 0 ? Math.round((compliantExpenses / totalExpenses) * 100) : 100;

  // Employee count (active only)
  const totalEmployees = store.employees.filter((e) => e.status === "ACTIVE").length;

  // MTD transaction count and average
  const totalTransactionsMTD = mtdTransactions.length;
  const avgTransactionValue = totalTransactionsMTD > 0 ? Math.round(totalSpendMTD / totalTransactionsMTD) : 0;

  // Dispute rate: reversed or declined / total
  const reversedCount = store.transactions.filter(
    (t) => t.eventType === "REVERSE" || t.status === "REVERSED"
  ).length;
  const disputeRate = store.transactions.length > 0
    ? Math.round((reversedCount / store.transactions.length) * 1000) / 10
    : 0;

  // Last month spend for trend calculation
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0);
  const lastMonthTxns = store.transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  const totalSpendLastMonth = lastMonthTxns.reduce((sum, t) => sum + t.amount, 0);
  const spendTrendPercent = totalSpendLastMonth > 0
    ? Math.round(((totalSpendMTD - totalSpendLastMonth) / totalSpendLastMonth) * 1000) / 10
    : 0;

  // Overdue approvals (pending > 3 days)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const overdueApprovals = store.approvals.filter((a) => {
    if (a.status !== "PENDING") return false;
    if (!a.submittedAt) return false;
    const submitted = new Date(a.submittedAt);
    return submitted < threeDaysAgo;
  }).length;

  return {
    totalSpendMTD: Math.round(totalSpendMTD),
    totalSpendYTD: Math.round(totalSpendYTD),
    activeCards,
    totalCards,
    pendingApprovals,
    policyComplianceScore,
    totalEmployees,
    cardLimitTotal,
    cardLimitUtilized,
    limitUtilizationPercent,
    expenseModuleEnabled: true,
    totalTransactionsMTD,
    avgTransactionValue,
    disputeRate,
    spendTrendPercent,
    totalSpendLastMonth: Math.round(totalSpendLastMonth),
    overdueApprovals,
  };
}

// =============================================================================
// Computed: Analytics (fully derived from store data)
// =============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  "Travel - Air": "#3b82f6",
  "Travel - Hotel": "#8b5cf6",
  "Meals & Entertainment": "#f97316",
  "Travel - Ground": "#06b6d4",
  "Office Supplies": "#22c55e",
  "Software & Subscriptions": "#7c3aed",
  "Client Entertainment": "#ec4899",
  "Training & Development": "#14b8a6",
  Other: "#64748b",
};

const DEPARTMENT_COLORS: Record<string, string> = {
  "Sales & Marketing": "#3b82f6",
  Operations: "#8b5cf6",
  "Credit Analysis": "#06b6d4",
  "Branch Banking": "#f97316",
  "Product Development": "#22c55e",
  Infrastructure: "#ec4899",
  "Equity Research": "#7c3aed",
  "Risk Management": "#64748b",
};

export function getAnalytics(): Analytics {
  // -- Spend by category (aggregated from expenses) --
  const categoryMap = new Map<string, number>();
  store.expenses.forEach((exp) => {
    const cat = exp.category || "Other";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + exp.amount);
  });
  const spendByCategory: CategorySpend[] = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.value - a.value);

  // -- Spend by month (last 5 months from transactions) --
  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const spendByMonth: MonthlySpend[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const monthAmount = store.transactions
      .filter((t) => t.timestamp.startsWith(monthKey))
      .reduce((sum, t) => sum + t.amount, 0);
    spendByMonth.push({ month: label, amount: Math.round(monthAmount) });
  }

  // -- Top spenders (aggregated by employee from transactions) --
  const employeeSpendMap = new Map<string, { name: string; department: string; amount: number }>();
  store.transactions.forEach((txn) => {
    const existing = employeeSpendMap.get(txn.employeeId);
    if (existing) {
      existing.amount += txn.amount;
    } else {
      const emp = getEmployee(txn.employeeId);
      const dept = emp ? getDepartment(emp.departmentId) : undefined;
      employeeSpendMap.set(txn.employeeId, {
        name: txn.employeeName,
        department: dept?.name || "",
        amount: txn.amount,
      });
    }
  });
  const topSpenders: TopSpender[] = Array.from(employeeSpendMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((s) => ({ ...s, amount: Math.round(s.amount) }));

  // -- Hierarchy spend (by department from transactions) --
  const deptSpendMap = new Map<string, number>();
  const deptCardMap = new Map<string, Set<string>>();
  store.transactions.forEach((txn) => {
    const emp = getEmployee(txn.employeeId);
    if (!emp) return;
    const dept = getDepartment(emp.departmentId);
    if (!dept) return;
    deptSpendMap.set(dept.id, (deptSpendMap.get(dept.id) || 0) + txn.amount);
    if (!deptCardMap.has(dept.id)) deptCardMap.set(dept.id, new Set());
    deptCardMap.get(dept.id)!.add(txn.cardId);
  });

  const hierarchySpend: DepartmentSpend[] = store.departments
    .map((dept) => {
      const division = getDivision(dept.divisionId);
      return {
        name: dept.name,
        division: division?.name || "",
        spend: Math.round(deptSpendMap.get(dept.id) || 0),
        limit: dept.budget,
        cards: deptCardMap.get(dept.id)?.size || 0,
        color: DEPARTMENT_COLORS[dept.name] || "#64748b",
      };
    })
    .sort((a, b) => b.spend - a.spend);

  return {
    spendByCategory,
    spendByMonth,
    topSpenders,
    hierarchySpend,
  };
}

// =============================================================================
// Employee-Specific Dashboard Data (computed)
// =============================================================================

export function getEmployeeDashboard(employeeId: string): EmployeeDashboardData {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const empCards = getCardsByEmployee(employeeId);
  const empTransactions = getTransactionsByEmployee(employeeId);

  // Cards with computed spend
  const myCards = empCards.map((card) => {
    const cardTxns = empTransactions.filter((t) => t.cardId === card.id);
    const mtdSpend = cardTxns
      .filter((t) => new Date(t.timestamp) >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyLimit = card.spendLimits?.monthly || 0;
    return {
      last4: card.last4Digits,
      type: card.type,
      network: card.network,
      status: card.status,
      limit: monthlyLimit,
      spent: Math.round(mtdSpend),
      available: Math.max(0, monthlyLimit - Math.round(mtdSpend)),
    };
  });

  // Recent transactions (last 10)
  const myRecentTransactions = empTransactions.slice(0, 10).map((t) => ({
    merchant: t.merchantName,
    amount: t.amount,
    date: t.timestamp.split("T")[0],
    status: t.status,
    hasReceipt: t.hasReceipt,
  }));

  // Missing receipts (transactions > 500 without receipt)
  const missingReceipts = empTransactions.filter((t) => !t.hasReceipt && t.amount > 500).length;

  // Pending/violating expenses
  const empExpenses = getExpensesByEmployee(employeeId);
  const pendingExpenses = empExpenses.filter(
    (e) => e.policyStatus === "SOFT_VIOLATION" || e.policyStatus === "HARD_VIOLATION"
  ).length;

  // MTD spend
  const totalSpendMTD = empTransactions
    .filter((t) => new Date(t.timestamp) >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  // Last month spend
  const totalSpendLastMonth = empTransactions
    .filter((t) => {
      const d = new Date(t.timestamp);
      return d >= lastMonthStart && d <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    myCards,
    myRecentTransactions,
    missingReceipts,
    pendingExpenses,
    totalSpendMTD: Math.round(totalSpendMTD),
    totalSpendLastMonth: Math.round(totalSpendLastMonth),
  };
}

// =============================================================================
// Card Statement CRUD
// =============================================================================

export interface CardStatementFilters {
  cardId?: string;
  employeeId?: string;
  companyId?: string;
  statementPeriod?: string;
  status?: string;
  search?: string;
}

export function getCardStatements(filters?: CardStatementFilters): CardStatement[] {
  let result = store.cardStatements;
  if (!filters) return result;
  if (filters.cardId) result = result.filter((s) => s.cardId === filters.cardId);
  if (filters.employeeId) result = result.filter((s) => s.employeeId === filters.employeeId);
  if (filters.companyId) result = result.filter((s) => s.companyId === filters.companyId);
  if (filters.statementPeriod) result = result.filter((s) => s.statementPeriod === filters.statementPeriod);
  if (filters.status) result = result.filter((s) => s.status === filters.status);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((st) => st.employeeName.toLowerCase().includes(s) || st.cardLast4.includes(s));
  }
  return result;
}

export function getCardStatement(id: string): CardStatement | undefined {
  return store.cardStatements.find((s) => s.id === id);
}

export function addCardStatement(data: Partial<CardStatement>): CardStatement {
  const stmt: CardStatement = {
    id: data.id || `stmt-${generateId()}`,
    cardId: "", cardLast4: "", employeeId: "", employeeName: "", companyId: "",
    statementPeriod: "", openingBalance: 0, closingBalance: 0, totalDebits: 0,
    totalCredits: 0, minimumDue: 0, dueDate: "", status: "GENERATED",
    transactionCount: 0, generatedAt: new Date().toISOString(), pdfUrl: null,
    ...data,
  };
  store.cardStatements.push(stmt);
  return stmt;
}

export function updateCardStatement(id: string, updates: Partial<CardStatement>): CardStatement | null {
  const idx = store.cardStatements.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.cardStatements[idx] = { ...store.cardStatements[idx], ...updates, id };
  return store.cardStatements[idx];
}

// =============================================================================
// Corporate Statement CRUD
// =============================================================================

export interface CorporateStatementFilters {
  companyId?: string;
  statementPeriod?: string;
  status?: string;
}

export function getCorporateStatements(filters?: CorporateStatementFilters): CorporateStatement[] {
  let result = store.corporateStatements;
  if (!filters) return result;
  if (filters.companyId) result = result.filter((s) => s.companyId === filters.companyId);
  if (filters.statementPeriod) result = result.filter((s) => s.statementPeriod === filters.statementPeriod);
  if (filters.status) result = result.filter((s) => s.status === filters.status);
  return result;
}

export function getCorporateStatement(id: string): CorporateStatement | undefined {
  return store.corporateStatements.find((s) => s.id === id);
}

export function addCorporateStatement(data: Partial<CorporateStatement>): CorporateStatement {
  const stmt: CorporateStatement = {
    id: data.id || `corp-stmt-${generateId()}`,
    companyId: "", companyName: "", statementPeriod: "", totalCards: 0,
    totalTransactions: 0, totalAmount: 0, totalGst: 0, dueDate: "",
    status: "GENERATED", generatedAt: new Date().toISOString(), pdfUrl: null,
    ...data,
  };
  store.corporateStatements.push(stmt);
  return stmt;
}

export function updateCorporateStatement(id: string, updates: Partial<CorporateStatement>): CorporateStatement | null {
  const idx = store.corporateStatements.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.corporateStatements[idx] = { ...store.corporateStatements[idx], ...updates, id };
  return store.corporateStatements[idx];
}

// =============================================================================
// Payment Cycle CRUD
// =============================================================================

export interface PaymentCycleFilters {
  companyId?: string;
  statementPeriod?: string;
  status?: string;
}

export function getPaymentCycles(filters?: PaymentCycleFilters): PaymentCycle[] {
  let result = store.paymentCycles;
  if (!filters) return result;
  if (filters.companyId) result = result.filter((p) => p.companyId === filters.companyId);
  if (filters.statementPeriod) result = result.filter((p) => p.statementPeriod === filters.statementPeriod);
  if (filters.status) result = result.filter((p) => p.status === filters.status);
  return result;
}

export function getPaymentCycle(id: string): PaymentCycle | undefined {
  return store.paymentCycles.find((p) => p.id === id);
}

export function addPaymentCycle(data: Partial<PaymentCycle>): PaymentCycle {
  const cycle: PaymentCycle = {
    id: data.id || `pmt-cycle-${generateId()}`,
    companyId: "", companyName: "", statementPeriod: "", dueDate: "",
    totalDue: 0, status: "DUE", paymentRef: "", paymentDate: null,
    paymentMode: null, apportionmentStatus: "PENDING", cardCount: 0,
    ...data,
  };
  store.paymentCycles.push(cycle);
  return cycle;
}

export function updatePaymentCycle(id: string, updates: Partial<PaymentCycle>): PaymentCycle | null {
  const idx = store.paymentCycles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.paymentCycles[idx] = { ...store.paymentCycles[idx], ...updates, id };
  return store.paymentCycles[idx];
}

// =============================================================================
// Payment Apportionment CRUD
// =============================================================================

export interface PaymentApportionmentFilters {
  paymentCycleId?: string;
  employeeId?: string;
  status?: string;
}

export function getPaymentApportionments(filters?: PaymentApportionmentFilters): PaymentApportionment[] {
  let result = store.paymentApportionments;
  if (!filters) return result;
  if (filters.paymentCycleId) result = result.filter((a) => a.paymentCycleId === filters.paymentCycleId);
  if (filters.employeeId) result = result.filter((a) => a.employeeId === filters.employeeId);
  if (filters.status) result = result.filter((a) => a.status === filters.status);
  return result;
}

export function getPaymentApportionment(id: string): PaymentApportionment | undefined {
  return store.paymentApportionments.find((a) => a.id === id);
}

export function addPaymentApportionment(data: Partial<PaymentApportionment>): PaymentApportionment {
  const apportionment: PaymentApportionment = {
    id: data.id || `pmt-appr-${generateId()}`,
    paymentCycleId: "", cardId: "", cardLast4: "", employeeId: "",
    employeeName: "", departmentName: "", costCenterName: "",
    amount: 0, status: "PENDING",
    ...data,
  };
  store.paymentApportionments.push(apportionment);
  return apportionment;
}

export function updatePaymentApportionment(id: string, updates: Partial<PaymentApportionment>): PaymentApportionment | null {
  const idx = store.paymentApportionments.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.paymentApportionments[idx] = { ...store.paymentApportionments[idx], ...updates, id };
  return store.paymentApportionments[idx];
}

// =============================================================================
// Workflow Request CRUD
// =============================================================================

export interface WorkflowRequestFilters {
  type?: string;
  status?: string;
  requestorId?: string;
  search?: string;
}

export function getWorkflowRequests(filters?: WorkflowRequestFilters): WorkflowRequest[] {
  let result = store.workflowRequests;
  if (!filters) return result;
  if (filters.type) result = result.filter((w) => w.type === filters.type);
  if (filters.status) result = result.filter((w) => w.status === filters.status);
  if (filters.requestorId) result = result.filter((w) => w.requestorId === filters.requestorId);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((w) => w.requestorName.toLowerCase().includes(s) || w.department.toLowerCase().includes(s) || w.type.toLowerCase().includes(s));
  }
  return result;
}

export function getWorkflowRequest(id: string): WorkflowRequest | undefined {
  return store.workflowRequests.find((w) => w.id === id);
}

export function addWorkflowRequest(data: Partial<WorkflowRequest>): WorkflowRequest {
  const request: WorkflowRequest = {
    id: data.id || `wf-${generateId()}`,
    type: "CARD_REQUEST", requestorId: "", requestorName: "", department: "",
    status: "PENDING", details: {}, currentApprover: "", approvalChain: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    comments: [],
    ...data,
  };
  store.workflowRequests.push(request);
  return request;
}

export function updateWorkflowRequest(id: string, updates: Partial<WorkflowRequest>): WorkflowRequest | null {
  const idx = store.workflowRequests.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  store.workflowRequests[idx] = {
    ...store.workflowRequests[idx], ...updates, id,
    updatedAt: new Date().toISOString(),
  };
  return store.workflowRequests[idx];
}

export function approveWorkflowStep(id: string, approverName: string, comment?: string): WorkflowRequest | null {
  const idx = store.workflowRequests.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const wf = store.workflowRequests[idx];
  const chain = [...wf.approvalChain];
  const stepIdx = chain.findIndex((s) => s.name === approverName && s.status === "PENDING");
  if (stepIdx !== -1) {
    chain[stepIdx] = { ...chain[stepIdx], status: "APPROVED", date: new Date().toISOString() };
  }
  const allApproved = chain.every((s) => s.status === "APPROVED");
  const nextPending = chain.find((s) => s.status === "PENDING");
  const comments = [...wf.comments];
  if (comment) comments.push({ author: approverName, text: comment, date: new Date().toISOString() });
  store.workflowRequests[idx] = {
    ...wf, approvalChain: chain,
    status: allApproved ? "APPROVED" : "PENDING",
    currentApprover: nextPending?.name || "",
    updatedAt: new Date().toISOString(),
    comments,
  };
  return store.workflowRequests[idx];
}

export function rejectWorkflowStep(id: string, approverName: string, comment?: string): WorkflowRequest | null {
  const idx = store.workflowRequests.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const wf = store.workflowRequests[idx];
  const chain = [...wf.approvalChain];
  const stepIdx = chain.findIndex((s) => s.name === approverName && s.status === "PENDING");
  if (stepIdx !== -1) {
    chain[stepIdx] = { ...chain[stepIdx], status: "REJECTED", date: new Date().toISOString() };
  }
  const comments = [...wf.comments];
  if (comment) comments.push({ author: approverName, text: comment, date: new Date().toISOString() });
  store.workflowRequests[idx] = {
    ...wf, approvalChain: chain, status: "REJECTED",
    currentApprover: "", updatedAt: new Date().toISOString(), comments,
  };
  return store.workflowRequests[idx];
}

// =============================================================================
// Dispute CRUD
// =============================================================================

export interface DisputeFilters {
  status?: string;
  employeeId?: string;
  cardId?: string;
  search?: string;
}

export function getDisputes(filters?: DisputeFilters): Dispute[] {
  let result = store.disputes;
  if (!filters) return result;
  if (filters.status) result = result.filter((d) => d.status === filters.status);
  if (filters.employeeId) result = result.filter((d) => d.employeeId === filters.employeeId);
  if (filters.cardId) result = result.filter((d) => d.cardId === filters.cardId);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((d) => d.employeeName.toLowerCase().includes(s) || d.reason.toLowerCase().includes(s) || d.cardLast4.includes(s));
  }
  return result;
}

export function getDispute(id: string): Dispute | undefined {
  return store.disputes.find((d) => d.id === id);
}

export function addDispute(data: Partial<Dispute>): Dispute {
  let cardLast4 = data.cardLast4 || "";
  let employeeName = data.employeeName || "";
  let amount = data.amount || 0;
  if (data.transactionId) {
    const txn = getTransaction(data.transactionId);
    if (txn) {
      if (!data.cardId) data.cardId = txn.cardId;
      if (!data.cardLast4) cardLast4 = txn.cardLast4;
      if (!data.employeeId) data.employeeId = txn.employeeId;
      if (!data.employeeName) employeeName = txn.employeeName;
      if (!data.amount) amount = txn.amount;
    }
  }
  const dispute: Dispute = {
    id: data.id || `disp-${generateId()}`,
    transactionId: "", cardId: "", employeeId: "",
    reason: "", description: "", status: "RAISED",
    provisionalCreditAmount: null, provisionalCreditDate: null,
    resolution: null, resolvedAt: null, createdAt: new Date().toISOString(),
    ...data, cardLast4, employeeName, amount,
  };
  store.disputes.push(dispute);
  return dispute;
}

export function updateDispute(id: string, updates: Partial<Dispute>): Dispute | null {
  const idx = store.disputes.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  store.disputes[idx] = { ...store.disputes[idx], ...updates, id };
  return store.disputes[idx];
}

// =============================================================================
// Detected Subscription CRUD
// =============================================================================

export interface SubscriptionFilters {
  cardId?: string;
  employeeId?: string;
  isActive?: boolean;
  frequency?: string;
  search?: string;
}

export function getDetectedSubscriptions(filters?: SubscriptionFilters): DetectedSubscription[] {
  let result = store.detectedSubscriptions;
  if (!filters) return result;
  if (filters.cardId) result = result.filter((s) => s.cardId === filters.cardId);
  if (filters.employeeId) result = result.filter((s) => s.employeeId === filters.employeeId);
  if (filters.isActive !== undefined) result = result.filter((s) => s.isActive === filters.isActive);
  if (filters.frequency) result = result.filter((s) => s.frequency === filters.frequency);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter((sub) => sub.merchantName.toLowerCase().includes(s) || sub.employeeName.toLowerCase().includes(s));
  }
  return result;
}

export function getDetectedSubscription(id: string): DetectedSubscription | undefined {
  return store.detectedSubscriptions.find((s) => s.id === id);
}

export function addDetectedSubscription(data: Partial<DetectedSubscription>): DetectedSubscription {
  const sub: DetectedSubscription = {
    id: data.id || `sub-${generateId()}`,
    cardId: "", cardLast4: "", employeeId: "", employeeName: "",
    merchantName: "", mcc: "", frequency: "MONTHLY",
    lastChargeDate: "", lastChargeAmount: 0, avgAmount: 0,
    totalCharges: 0, isActive: true, detectedAt: new Date().toISOString(),
    ...data,
  };
  store.detectedSubscriptions.push(sub);
  return sub;
}

export function updateDetectedSubscription(id: string, updates: Partial<DetectedSubscription>): DetectedSubscription | null {
  const idx = store.detectedSubscriptions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.detectedSubscriptions[idx] = { ...store.detectedSubscriptions[idx], ...updates, id };
  return store.detectedSubscriptions[idx];
}

// =============================================================================
// Scheduled Card Action CRUD
// =============================================================================

export interface ScheduledActionFilters {
  cardId?: string;
  employeeId?: string;
  status?: string;
  actionType?: string;
}

export function getScheduledCardActions(filters?: ScheduledActionFilters): ScheduledCardAction[] {
  let result = store.scheduledCardActions;
  if (!filters) return result;
  if (filters.cardId) result = result.filter((a) => a.cardId === filters.cardId);
  if (filters.employeeId) result = result.filter((a) => a.employeeId === filters.employeeId);
  if (filters.status) result = result.filter((a) => a.status === filters.status);
  if (filters.actionType) result = result.filter((a) => a.actionType === filters.actionType);
  return result;
}

export function getScheduledCardAction(id: string): ScheduledCardAction | undefined {
  return store.scheduledCardActions.find((a) => a.id === id);
}

export function addScheduledCardAction(data: Partial<ScheduledCardAction>): ScheduledCardAction {
  let cardLast4 = data.cardLast4 || "";
  let employeeName = data.employeeName || "";
  if (data.cardId && !data.cardLast4) {
    const card = getCard(data.cardId);
    if (card) {
      cardLast4 = card.last4Digits;
      if (!data.employeeId) data.employeeId = card.employeeId;
      if (!data.employeeName) employeeName = card.employeeName;
    }
  }
  const action: ScheduledCardAction = {
    id: data.id || `sca-${generateId()}`,
    cardId: "", employeeId: "",
    actionType: "FREEZE", scheduledDate: "", recurrence: "ONCE",
    status: "PENDING", details: {}, createdAt: new Date().toISOString(),
    ...data, cardLast4, employeeName,
  };
  store.scheduledCardActions.push(action);
  return action;
}

export function updateScheduledCardAction(id: string, updates: Partial<ScheduledCardAction>): ScheduledCardAction | null {
  const idx = store.scheduledCardActions.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  store.scheduledCardActions[idx] = { ...store.scheduledCardActions[idx], ...updates, id };
  return store.scheduledCardActions[idx];
}

export function deleteScheduledCardAction(id: string): boolean {
  const idx = store.scheduledCardActions.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  store.scheduledCardActions.splice(idx, 1);
  return true;
}

// =============================================================================
// Hierarchy Employee Assignment
// =============================================================================

/**
 * Assign a single employee to a hierarchy node.
 * - If node type is DEPARTMENT, updates employee.departmentId.
 * - If node type is COST_CENTER, updates employee.costCenterId
 *   (and also sets departmentId to the cost center's parent department).
 * Returns true on success, false if employee or node not found.
 */
export function assignEmployeeToNode(employeeId: string, nodeId: string): boolean {
  const empIdx = store.employees.findIndex((e) => e.id === employeeId);
  if (empIdx === -1) return false;

  // Check if nodeId is a department
  const dept = store.departments.find((d) => d.id === nodeId);
  if (dept) {
    store.employees[empIdx] = { ...store.employees[empIdx], departmentId: dept.id };
    return true;
  }

  // Check if nodeId is a cost center
  const cc = store.costCenters.find((c) => c.id === nodeId);
  if (cc) {
    store.employees[empIdx] = {
      ...store.employees[empIdx],
      costCenterId: cc.id,
      departmentId: cc.departmentId || store.employees[empIdx].departmentId,
    };
    return true;
  }

  return false;
}

/**
 * Bulk assign multiple employees to a hierarchy node.
 * Returns the count of successfully assigned employees.
 */
export function bulkAssignEmployeesToNode(employeeIds: string[], nodeId: string): number {
  let count = 0;
  for (const empId of employeeIds) {
    if (assignEmployeeToNode(empId, nodeId)) {
      count++;
    }
  }
  return count;
}

/**
 * Find a hierarchy node by its code (searching departments and cost centers).
 * Returns { type, id } or null.
 */
export function findHierarchyNodeByCode(code: string): { type: "department" | "costCenter"; id: string } | null {
  const dept = store.departments.find((d) => d.code === code);
  if (dept) return { type: "department", id: dept.id };

  const cc = store.costCenters.find((c) => c.code === code);
  if (cc) return { type: "costCenter", id: cc.id };

  return null;
}

// =============================================================================
// Expense Category Configuration CRUD
// =============================================================================

export function getExpenseCategories(activeOnly = false): ExpenseCategoryConfig[] {
  let cats = [...store.expenseCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  if (activeOnly) cats = cats.filter(c => c.isActive);
  return cats;
}

export function getExpenseCategory(id: string): ExpenseCategoryConfig | undefined {
  return store.expenseCategories.find(c => c.id === id);
}

export function addExpenseCategory(data: Partial<ExpenseCategoryConfig>): ExpenseCategoryConfig {
  const maxOrder = store.expenseCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
  const cat: ExpenseCategoryConfig = {
    id: data.id || `exp-cat-${generateId()}`,
    code: data.code || "",
    label: data.label || "",
    icon: data.icon || "MoreHorizontal",
    color: data.color || "#64748b",
    isActive: data.isActive !== false,
    sortOrder: data.sortOrder ?? maxOrder + 1,
    subcategories: data.subcategories || [],
  };
  store.expenseCategories.push(cat);
  return cat;
}

export function updateExpenseCategory(id: string, updates: Partial<ExpenseCategoryConfig>): ExpenseCategoryConfig | null {
  const idx = store.expenseCategories.findIndex(c => c.id === id);
  if (idx === -1) return null;
  store.expenseCategories[idx] = { ...store.expenseCategories[idx], ...updates, id };
  return store.expenseCategories[idx];
}

export function deleteExpenseCategory(id: string): boolean {
  const idx = store.expenseCategories.findIndex(c => c.id === id);
  if (idx === -1) return false;
  store.expenseCategories.splice(idx, 1);
  return true;
}

export function addSubcategory(categoryId: string, sub: ExpenseCategorySubcategory): ExpenseCategoryConfig | null {
  const cat = store.expenseCategories.find(c => c.id === categoryId);
  if (!cat) return null;
  cat.subcategories.push(sub);
  return cat;
}

export function removeSubcategory(categoryId: string, subCode: string): ExpenseCategoryConfig | null {
  const cat = store.expenseCategories.find(c => c.id === categoryId);
  if (!cat) return null;
  cat.subcategories = cat.subcategories.filter(s => s.code !== subCode);
  return cat;
}

export function reorderExpenseCategories(orderedIds: string[]): void {
  orderedIds.forEach((id, index) => {
    const cat = store.expenseCategories.find(c => c.id === id);
    if (cat) cat.sortOrder = index;
  });
}

// =============================================================================
// Receipt CRUD
// =============================================================================

export function getReceipts(expenseId?: string): Receipt[] {
  if (expenseId) return store.receipts.filter(r => r.expenseId === expenseId);
  return [...store.receipts];
}

export function getReceipt(id: string): Receipt | undefined {
  return store.receipts.find(r => r.id === id);
}

export function addReceipt(data: Partial<Receipt>): Receipt {
  const receipt: Receipt = {
    id: data.id || `rcpt-${generateId()}`,
    fileName: data.fileName || "receipt.jpg",
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || "image/jpeg",
    base64Data: data.base64Data || "",
    uploadedAt: data.uploadedAt || new Date().toISOString(),
    ocrData: data.ocrData || {},
    ocrConfidence: data.ocrConfidence || {},
    ocrStatus: data.ocrStatus || "PENDING",
    source: data.source || "UPLOAD",
    expenseId: data.expenseId,
  };
  store.receipts.push(receipt);
  return receipt;
}

export function linkReceiptToExpense(receiptId: string, expenseId: string): Receipt | null {
  const receipt = store.receipts.find(r => r.id === receiptId);
  if (!receipt) return null;
  receipt.expenseId = expenseId;
  return receipt;
}

export function deleteReceipt(id: string): boolean {
  const idx = store.receipts.findIndex(r => r.id === id);
  if (idx === -1) return false;
  store.receipts.splice(idx, 1);
  return true;
}

// =============================================================================
// Reimbursement CRUD
// =============================================================================

export function getReimbursements(filters?: { status?: string; employeeId?: string }): Reimbursement[] {
  let result = [...store.reimbursements];
  if (filters?.status) result = result.filter(r => r.status === filters.status);
  if (filters?.employeeId) result = result.filter(r => r.employeeId === filters.employeeId);
  return result;
}

export function getReimbursement(id: string): Reimbursement | undefined {
  return store.reimbursements.find(r => r.id === id);
}

export function addReimbursement(data: Partial<Reimbursement>): Reimbursement {
  const reimb: Reimbursement = {
    id: data.id || `reimb-${generateId()}`,
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    department: data.department || "",
    expenseReportId: data.expenseReportId || "",
    reportNumber: data.reportNumber || "",
    grossAmount: data.grossAmount || 0,
    tdsAmount: data.tdsAmount || 0,
    netAmount: data.netAmount || data.grossAmount || 0,
    status: data.status || "PENDING",
    paymentMethod: data.paymentMethod || "NEFT",
    paymentRef: data.paymentRef || "",
    bankAccount: data.bankAccount || "",
    ifscCode: data.ifscCode || "",
    bankName: data.bankName || "",
    initiatedAt: data.initiatedAt || null,
    processedAt: data.processedAt || null,
    paidAt: data.paidAt || null,
    failureReason: data.failureReason || null,
  };
  store.reimbursements.push(reimb);
  return reimb;
}

export function updateReimbursement(id: string, updates: Partial<Reimbursement>): Reimbursement | null {
  const idx = store.reimbursements.findIndex(r => r.id === id);
  if (idx === -1) return null;
  store.reimbursements[idx] = { ...store.reimbursements[idx], ...updates, id };
  return store.reimbursements[idx];
}

export function initiateReimbursement(id: string): Reimbursement | null {
  // Look up the reimbursement first so we can enrich with payment profile
  const reimb = store.reimbursements.find(r => r.id === id);
  if (!reimb) return null;

  // Try to populate bank details from the employee's primary payment profile
  const paymentProfile = getPrimaryPaymentProfile(reimb.employeeId);
  const bankUpdates: Partial<Reimbursement> = paymentProfile
    ? { bankAccount: paymentProfile.accountNumber, ifscCode: paymentProfile.ifscCode, bankName: paymentProfile.bankName }
    : {};

  const result = updateReimbursement(id, { ...bankUpdates, status: "INITIATED", initiatedAt: new Date().toISOString() });
  if (result) {
    addAuditLogEntry({
      entityType: "REIMBURSEMENT",
      entityId: id,
      action: "INITIATE",
      userName: "System",
      metadata: { employeeName: result.employeeName, netAmount: result.netAmount, reportNumber: result.reportNumber },
    });
  }
  return result;
}

export function processReimbursement(id: string, paymentRef: string): Reimbursement | null {
  return updateReimbursement(id, { status: "PROCESSING", paymentRef, processedAt: new Date().toISOString() });
}

export function completeReimbursement(id: string): Reimbursement | null {
  const result = updateReimbursement(id, { status: "PAID", paidAt: new Date().toISOString() });
  if (result) {
    addAuditLogEntry({
      entityType: "REIMBURSEMENT",
      entityId: id,
      action: "COMPLETE",
      userName: "System",
      metadata: { employeeName: result.employeeName, netAmount: result.netAmount, paymentRef: result.paymentRef },
    });
  }
  return result;
}

export function failReimbursement(id: string, reason: string): Reimbursement | null {
  return updateReimbursement(id, { status: "FAILED", failureReason: reason });
}

// =============================================================================
// Audit Log
// =============================================================================

export function getAuditLog(filters?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  limit?: number;
}): AuditLogEntry[] {
  let result = [...store.auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (filters?.entityType) result = result.filter((e) => e.entityType === filters.entityType);
  if (filters?.entityId) result = result.filter((e) => e.entityId === filters.entityId);
  if (filters?.action) result = result.filter((e) => e.action === filters.action);
  if (filters?.userId) result = result.filter((e) => e.userId === filters.userId);
  if (filters?.limit) result = result.slice(0, filters.limit);
  return result;
}

export function addAuditLogEntry(data: {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  userName?: string;
  changes?: Record<string, { old: any; new: any }> | null;
  metadata?: Record<string, any> | null;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `audit-${generateId()}`,
    timestamp: new Date().toISOString(),
    entityType: data.entityType,
    entityId: data.entityId,
    action: data.action,
    userId: data.userId || "system",
    userName: data.userName || "System",
    changes: data.changes || null,
    metadata: data.metadata || null,
    ipAddress: "127.0.0.1",
  };
  store.auditLog.push(entry);
  return entry;
}

// =============================================================================
// Duplicate Expense Detection
// =============================================================================

export interface DuplicateMatch {
  expenseId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  expense: {
    id: string;
    amount: number;
    merchantName: string;
    date: string;
    category: string;
    employeeName: string;
  };
}

export function detectDuplicateExpenses(
  amount: number,
  merchantName: string,
  date: string,
  employeeId?: string,
  excludeId?: string
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const targetDate = new Date(date);

  for (const exp of store.expenses) {
    if (excludeId && exp.id === excludeId) continue;

    let score = 0;
    const reasons: string[] = [];

    // Exact amount match (+/- 1%)
    const amountDiff = Math.abs(exp.amount - amount) / Math.max(amount, 1);
    if (amountDiff === 0) {
      score += 40;
      reasons.push("Exact amount match");
    } else if (amountDiff < 0.01) {
      score += 30;
      reasons.push("Amount within 1%");
    }

    // Merchant name similarity (case-insensitive contains)
    const expMerchant = (exp.merchantName || "").toLowerCase();
    const targetMerchant = merchantName.toLowerCase();
    if (expMerchant === targetMerchant) {
      score += 30;
      reasons.push("Exact merchant match");
    } else if (expMerchant.includes(targetMerchant) || targetMerchant.includes(expMerchant)) {
      score += 20;
      reasons.push("Similar merchant name");
    }

    // Date proximity (same day = high, within 3 days = medium)
    const expDate = new Date(exp.date);
    const daysDiff = Math.abs(targetDate.getTime() - expDate.getTime()) / 86400000;
    if (daysDiff === 0) {
      score += 20;
      reasons.push("Same date");
    } else if (daysDiff <= 1) {
      score += 15;
      reasons.push("Within 1 day");
    } else if (daysDiff <= 3) {
      score += 10;
      reasons.push("Within 3 days");
    }

    // Same employee
    if (employeeId && exp.employeeId === employeeId) {
      score += 10;
      reasons.push("Same employee");
    }

    // Only return if score >= 50 (meaningful match)
    if (score >= 50) {
      matches.push({
        expenseId: exp.id,
        matchScore: Math.min(score, 100),
        matchReasons: reasons,
        expense: {
          id: exp.id,
          amount: exp.amount,
          merchantName: exp.merchantName,
          date: exp.date,
          category: exp.category,
          employeeName: exp.employeeName,
        },
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

// =============================================================================
// GSTIN Cache (CIGNET GSP Integration)
// =============================================================================

export function getGstinCache(): GstinRecord[] {
  return [...store.gstinCache];
}

export function lookupGstin(gstin: string): GstinRecord | undefined {
  return store.gstinCache.find(g => g.gstin === gstin);
}

export function addGstinRecord(data: Partial<GstinRecord>): GstinRecord {
  // Check if already exists
  const existing = store.gstinCache.find(g => g.gstin === data.gstin);
  if (existing) {
    // Update existing
    Object.assign(existing, data, { lastVerified: new Date().toISOString() });
    return existing;
  }

  const record: GstinRecord = {
    id: data.id || `gstin-${generateId()}`,
    gstin: data.gstin || "",
    legalName: data.legalName || "",
    tradeName: data.tradeName || "",
    status: data.status || "ACTIVE",
    stateCode: data.gstin?.substring(0, 2) || "",
    stateName: getStateName(data.gstin?.substring(0, 2) || ""),
    registrationType: data.registrationType || "Regular",
    lastVerified: new Date().toISOString(),
    validatedVia: data.validatedVia || "MANUAL",
    address: data.address || "",
    einvoiceEnabled: data.einvoiceEnabled ?? false,
  };
  store.gstinCache.push(record);
  return record;
}

function getStateName(code: string): string {
  const states: Record<string, string> = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
    "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
    "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
    "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
    "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "27": "Maharashtra", "29": "Karnataka", "32": "Kerala", "33": "Tamil Nadu",
    "36": "Telangana", "37": "Andhra Pradesh",
  };
  return states[code] || "Unknown";
}

export function refreshGstinCache(): { refreshed: number; total: number } {
  // Simulate periodic refresh from CIGNET
  let refreshed = 0;
  store.gstinCache.forEach(record => {
    const lastVerified = new Date(record.lastVerified);
    const daysSince = (Date.now() - lastVerified.getTime()) / 86400000;
    if (daysSince > 7) { // Refresh if older than 7 days
      record.lastVerified = new Date().toISOString();
      record.validatedVia = "CIGNET";
      refreshed++;
    }
  });
  return { refreshed, total: store.gstinCache.length };
}

// =============================================================================
// Escalation Config (Auto-Escalation for Approvals)
// =============================================================================

let escalationConfig: EscalationConfig = {
  enabled: true,
  slaHours: 48,
  escalateTo: "SKIP_LEVEL",
  maxEscalations: 2,
  notifyOriginalApprover: true,
};

export function getEscalationConfig(): EscalationConfig {
  return { ...escalationConfig };
}

export function updateEscalationConfig(updates: Partial<EscalationConfig>): EscalationConfig {
  escalationConfig = { ...escalationConfig, ...updates };
  return { ...escalationConfig };
}

export function checkAndEscalateApprovals(): { escalated: string[]; checked: number } {
  const now = Date.now();
  const escalated: string[] = [];

  for (const approval of store.approvals) {
    if (approval.status !== "PENDING") continue;

    const submittedAt = new Date(approval.submittedAt || approval.dueAt).getTime();
    const hoursSince = (now - submittedAt) / 3600000;

    if (hoursSince > escalationConfig.slaHours) {
      // Escalate
      approval.status = "ESCALATED";
      escalated.push(approval.id);

      addAuditLogEntry({
        entityType: "APPROVAL",
        entityId: approval.id,
        action: "ESCALATE",
        userName: "System (Auto-Escalation)",
        metadata: {
          reason: `SLA breached: ${Math.round(hoursSince)}h > ${escalationConfig.slaHours}h threshold`,
          escalateTo: escalationConfig.escalateTo,
          reportNumber: approval.reportNumber,
        },
      });
    }
  }

  return { escalated, checked: store.approvals.filter(a => a.status === "PENDING").length + escalated.length };
}

// =============================================================================
// Payment Profile CRUD
// =============================================================================

export function getPaymentProfiles(employeeId?: string): PaymentProfile[] {
  if (employeeId) {
    return store.paymentProfiles.filter((p) => p.employeeId === employeeId);
  }
  return [...store.paymentProfiles];
}

export function getPaymentProfile(id: string): PaymentProfile | undefined {
  return store.paymentProfiles.find((p) => p.id === id);
}

export function getPrimaryPaymentProfile(employeeId: string): PaymentProfile | undefined {
  return store.paymentProfiles.find((p) => p.employeeId === employeeId && p.isPrimary);
}

export function addPaymentProfile(data: Partial<PaymentProfile>): PaymentProfile {
  // If this is the first profile for the employee, make it primary
  const existing = store.paymentProfiles.filter((p) => p.employeeId === data.employeeId);
  const isPrimary = existing.length === 0 ? true : data.isPrimary || false;

  // If setting as primary, unset other primaries for this employee
  if (isPrimary) {
    store.paymentProfiles.forEach((p) => {
      if (p.employeeId === data.employeeId) p.isPrimary = false;
    });
  }

  const profile: PaymentProfile = {
    id: data.id || `pp-${generateId()}`,
    employeeId: data.employeeId || "",
    employeeName: data.employeeName || "",
    type: data.type || "BANK_ACCOUNT",
    accountNumber: data.accountNumber || "",
    accountHolderName: data.accountHolderName || "",
    ifscCode: data.ifscCode || "",
    bankName: data.bankName || "",
    branchName: data.branchName || "",
    accountType: data.accountType || "SAVINGS",
    upiVpa: data.upiVpa || null,
    isPrimary,
    status: data.status || "PENDING_VERIFICATION",
    addedAt: new Date().toISOString(),
    verifiedAt: null,
  };
  store.paymentProfiles.push(profile);

  addAuditLogEntry({
    entityType: "PAYMENT_PROFILE",
    entityId: profile.id,
    action: "CREATE",
    userName: data.employeeName || "System",
    metadata: { employeeId: data.employeeId, type: profile.type, bankName: profile.bankName },
  });

  return profile;
}

export function updatePaymentProfile(id: string, updates: Partial<PaymentProfile>): PaymentProfile | null {
  const idx = store.paymentProfiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  // If setting as primary, unset other primaries
  if (updates.isPrimary) {
    const employeeId = store.paymentProfiles[idx].employeeId;
    store.paymentProfiles.forEach((p) => {
      if (p.employeeId === employeeId) p.isPrimary = false;
    });
  }

  store.paymentProfiles[idx] = { ...store.paymentProfiles[idx], ...updates };
  return store.paymentProfiles[idx];
}

export function deletePaymentProfile(id: string): boolean {
  const idx = store.paymentProfiles.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  store.paymentProfiles.splice(idx, 1);
  return true;
}

export function verifyPaymentProfile(id: string): PaymentProfile | null {
  const idx = store.paymentProfiles.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  store.paymentProfiles[idx].status = "VERIFIED";
  store.paymentProfiles[idx].verifiedAt = new Date().toISOString();
  return store.paymentProfiles[idx];
}
