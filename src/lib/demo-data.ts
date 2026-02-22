// Comprehensive demo data for the application
// Used when Oracle DB is not connected (development/demo mode)

import { generateId } from "./utils";

// ==================== HIERARCHY (Visa/Mastercard 6-Level Structure) ====================
// Level 1: Bank/Institution (read-only, pre-set)
// Level 2: Program
// Level 3: Company
// Level 4: Division
// Level 5: Department
// Level 6: Cost Center

export const demoBankInstitutions = [
  { id: "bank-1", name: "IDFC FIRST Bank", code: "IDFC", status: "ACTIVE" },
];

export const demoPrograms = [
  { id: "prog-1", name: "Corporate Card Program", code: "CCP", bankId: "bank-1", status: "ACTIVE", description: "Standard corporate card program for all group companies" },
  { id: "prog-2", name: "Procurement Card Program", code: "PCP", bankId: "bank-1", status: "ACTIVE", description: "P-Card program for vendor and procurement payments" },
];

// Keep old export names for backward compatibility
export const demoEnterprises = demoBankInstitutions.map((b) => ({
  id: b.id,
  name: b.name,
  status: b.status,
}));

export const demoCompanies = [
  { id: "comp-1", name: "BFS India Ltd", legalName: "Bharat Financial Services India Private Limited", gstin: "27AABCU9603R1ZM", pan: "AABCU9603R", cin: "U65100MH2020PTC123456", baseCurrency: "INR", enterpriseId: "bank-1", programId: "prog-1" },
  { id: "comp-2", name: "BFS Digital", legalName: "BFS Digital Solutions Private Limited", gstin: "29AADCB2230Q2ZG", pan: "AADCB2230Q", cin: "U72200KA2021PTC234567", baseCurrency: "INR", enterpriseId: "bank-1", programId: "prog-1" },
  { id: "comp-3", name: "BFS Capital", legalName: "BFS Capital Markets Limited", gstin: "07AACCF8274K1Z8", pan: "AACCF8274K", cin: "U65900DL2019PLC345678", baseCurrency: "INR", enterpriseId: "bank-1", programId: "prog-2" },
];

export const demoDivisions = [
  { id: "div-1", name: "Corporate Banking", code: "CB", companyId: "comp-1", budget: 50000000 },
  { id: "div-2", name: "Retail Banking", code: "RB", companyId: "comp-1", budget: 30000000 },
  { id: "div-3", name: "Technology", code: "TECH", companyId: "comp-2", budget: 25000000 },
  { id: "div-4", name: "Investment Banking", code: "IB", companyId: "comp-3", budget: 40000000 },
];

export const demoDepartments = [
  { id: "dept-1", name: "Sales & Marketing", code: "SM", divisionId: "div-1", budget: 15000000, glCodePrefix: "4100" },
  { id: "dept-2", name: "Operations", code: "OPS", divisionId: "div-1", budget: 10000000, glCodePrefix: "4200" },
  { id: "dept-3", name: "Credit Analysis", code: "CA", divisionId: "div-1", budget: 8000000, glCodePrefix: "4300" },
  { id: "dept-4", name: "Branch Banking", code: "BB", divisionId: "div-2", budget: 12000000, glCodePrefix: "4400" },
  { id: "dept-5", name: "Product Development", code: "PD", divisionId: "div-3", budget: 15000000, glCodePrefix: "5100" },
  { id: "dept-6", name: "Infrastructure", code: "INFRA", divisionId: "div-3", budget: 10000000, glCodePrefix: "5200" },
  { id: "dept-7", name: "Equity Research", code: "ER", divisionId: "div-4", budget: 20000000, glCodePrefix: "6100" },
  { id: "dept-8", name: "Risk Management", code: "RISK", divisionId: "div-4", budget: 8000000, glCodePrefix: "6200" },
];

export const demoCostCenters = [
  { id: "cc-1", code: "CC-SM-01", name: "Marketing Campaigns", glCode: "4100-001", budget: 5000000, utilized: 2800000, departmentId: "dept-1", companyId: "comp-1" },
  { id: "cc-2", code: "CC-SM-02", name: "Client Engagement", glCode: "4100-002", budget: 4000000, utilized: 1500000, departmentId: "dept-1", companyId: "comp-1" },
  { id: "cc-3", code: "CC-OPS-01", name: "Operations Center", glCode: "4200-001", budget: 6000000, utilized: 3200000, departmentId: "dept-2", companyId: "comp-1" },
  { id: "cc-4", code: "CC-PD-01", name: "App Development", glCode: "5100-001", budget: 8000000, utilized: 5500000, departmentId: "dept-5", companyId: "comp-2" },
  { id: "cc-5", code: "CC-PD-02", name: "AI/ML Research", glCode: "5100-002", budget: 7000000, utilized: 4100000, departmentId: "dept-5", companyId: "comp-2" },
  { id: "cc-6", code: "CC-ER-01", name: "Research Analysis", glCode: "6100-001", budget: 10000000, utilized: 7200000, departmentId: "dept-7", companyId: "comp-3" },
];

// ==================== CARD CONTROL POLICIES ====================
// Policies cascade down the hierarchy: Company -> Division -> Department
// Each level can inherit from parent or override

export interface DemoCardControlPolicy {
  id: string;
  nodeId: string;       // hierarchy node this policy applies to
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
  mccRestrictions: string[];  // blocked MCC categories
  isOverride: boolean;        // whether this overrides parent defaults
  inheritedFrom?: string;     // parent node ID if inherited
}

export const demoCardControlPolicies: DemoCardControlPolicy[] = [
  // Company-level defaults (Level 3)
  {
    id: "ccp-1",
    nodeId: "comp-1",
    nodeType: "company",
    nodeName: "BFS India Ltd",
    spendLimits: { perTransaction: 50000, daily: 100000, monthly: 500000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: false, domesticOnly: true },
    mccRestrictions: ["Gambling", "Crypto", "Liquor", "ATM Cash Advance"],
    isOverride: false,
  },
  {
    id: "ccp-2",
    nodeId: "comp-2",
    nodeType: "company",
    nodeName: "BFS Digital",
    spendLimits: { perTransaction: 75000, daily: 150000, monthly: 750000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto"],
    isOverride: false,
  },
  {
    id: "ccp-3",
    nodeId: "comp-3",
    nodeType: "company",
    nodeName: "BFS Capital",
    spendLimits: { perTransaction: 100000, daily: 200000, monthly: 1000000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: true },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto", "Liquor"],
    isOverride: false,
  },
  // Division-level overrides (Level 4)
  {
    id: "ccp-4",
    nodeId: "div-1",
    nodeType: "division",
    nodeName: "Corporate Banking",
    spendLimits: { perTransaction: 75000, daily: 150000, monthly: 750000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto", "Liquor", "ATM Cash Advance"],
    isOverride: true,
    inheritedFrom: "comp-1",
  },
  {
    id: "ccp-5",
    nodeId: "div-3",
    nodeType: "division",
    nodeName: "Technology",
    spendLimits: { perTransaction: 100000, daily: 200000, monthly: 1000000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto"],
    isOverride: true,
    inheritedFrom: "comp-2",
  },
  // Department-level overrides (Level 5)
  {
    id: "ccp-6",
    nodeId: "dept-1",
    nodeType: "department",
    nodeName: "Sales & Marketing",
    spendLimits: { perTransaction: 100000, daily: 200000, monthly: 1000000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto", "ATM Cash Advance"],
    isOverride: true,
    inheritedFrom: "div-1",
  },
  {
    id: "ccp-7",
    nodeId: "dept-5",
    nodeType: "department",
    nodeName: "Product Development",
    spendLimits: { perTransaction: 150000, daily: 300000, monthly: 1500000 },
    channelControls: { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false },
    geographicControls: { internationalAllowed: true, domesticOnly: false },
    mccRestrictions: ["Gambling", "Crypto"],
    isOverride: true,
    inheritedFrom: "div-3",
  },
];

// ==================== EMPLOYEES ====================
export const demoEmployees = [
  { id: "emp-1", employeeNumber: "BFS001", firstName: "Rajesh", lastName: "Kumar", email: "admin@corpcardpro.com", phone: "+91-9876543210", departmentId: "dept-1", costCenterId: "cc-1", level: "EXECUTIVE", pan: "ABCPK1234A", status: "ACTIVE" },
  { id: "emp-2", employeeNumber: "BFS002", firstName: "Priya", lastName: "Sharma", email: "company@corpcardpro.com", phone: "+91-9876543211", departmentId: "dept-1", costCenterId: "cc-1", level: "SENIOR_MANAGER", pan: "DEFPS5678B", status: "ACTIVE" },
  { id: "emp-3", employeeNumber: "BFS003", firstName: "Arun", lastName: "Patel", email: "finance@corpcardpro.com", phone: "+91-9876543212", departmentId: "dept-2", costCenterId: "cc-3", level: "SENIOR_MANAGER", pan: "GHIAP9012C", status: "ACTIVE" },
  { id: "emp-4", employeeNumber: "BFS004", firstName: "Deepa", lastName: "Nair", email: "manager@corpcardpro.com", phone: "+91-9876543213", departmentId: "dept-5", costCenterId: "cc-4", level: "MANAGER", pan: "JKLDN3456D", status: "ACTIVE" },
  { id: "emp-5", employeeNumber: "BFS005", firstName: "Vikram", lastName: "Singh", email: "employee@corpcardpro.com", phone: "+91-9876543214", departmentId: "dept-5", costCenterId: "cc-4", level: "STAFF", pan: "MNOPV7890E", status: "ACTIVE" },
  { id: "emp-6", employeeNumber: "BFS006", firstName: "Ananya", lastName: "Gupta", email: "ananya@corpcardpro.com", phone: "+91-9876543215", departmentId: "dept-3", costCenterId: "cc-2", level: "STAFF", pan: "QRSAG1234F", status: "ACTIVE" },
  { id: "emp-7", employeeNumber: "BFS007", firstName: "Suresh", lastName: "Menon", email: "suresh@corpcardpro.com", phone: "+91-9876543216", departmentId: "dept-4", costCenterId: "cc-3", level: "MANAGER", pan: "TUVSM5678G", status: "ACTIVE" },
  { id: "emp-8", employeeNumber: "BFS008", firstName: "Kavitha", lastName: "Reddy", email: "kavitha@corpcardpro.com", phone: "+91-9876543217", departmentId: "dept-6", costCenterId: "cc-5", level: "SENIOR_MANAGER", pan: "WXYKR9012H", status: "ACTIVE" },
  { id: "emp-9", employeeNumber: "BFS009", firstName: "Rahul", lastName: "Verma", email: "rahul@corpcardpro.com", phone: "+91-9876543218", departmentId: "dept-7", costCenterId: "cc-6", level: "STAFF", pan: "ZABRV3456I", status: "ACTIVE" },
  { id: "emp-10", employeeNumber: "BFS010", firstName: "Meera", lastName: "Iyer", email: "meera@corpcardpro.com", phone: "+91-9876543219", departmentId: "dept-8", costCenterId: "cc-6", level: "MANAGER", pan: "BCDMI7890J", status: "ACTIVE" },
];

// ==================== CARDS ====================
const cardStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "FROZEN", "SUSPENDED"] as const;
const cardTypes = ["PHYSICAL", "VIRTUAL", "PHYSICAL", "VIRTUAL", "SINGLE_USE"] as const;
const networks = ["VISA", "MASTERCARD", "RUPAY"] as const;

export const demoCards = demoEmployees.flatMap((emp, i) => [
  {
    id: `card-${i * 2 + 1}`,
    last4Digits: String(1000 + i * 2 + 1).padStart(4, "0"),
    type: cardTypes[i % cardTypes.length],
    status: cardStatuses[i % cardStatuses.length],
    network: networks[i % networks.length],
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    department: demoDepartments.find((d) => d.id === emp.departmentId)?.name || "",
    spendLimits: { perTransaction: 50000, daily: 100000, monthly: 500000 },
    expiryDate: "2028-12-31",
    issuedDate: "2025-01-15",
    utilizationPercent: Math.floor(Math.random() * 80) + 10,
  },
  {
    id: `card-${i * 2 + 2}`,
    last4Digits: String(1000 + i * 2 + 2).padStart(4, "0"),
    type: "VIRTUAL" as const,
    status: "ACTIVE" as const,
    network: networks[(i + 1) % networks.length],
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    department: demoDepartments.find((d) => d.id === emp.departmentId)?.name || "",
    spendLimits: { perTransaction: 25000, daily: 50000, monthly: 200000 },
    expiryDate: "2027-06-30",
    issuedDate: "2025-06-01",
    utilizationPercent: Math.floor(Math.random() * 60) + 5,
  },
]);

// ==================== TRANSACTIONS ====================
const merchants = [
  { name: "Taj Hotels & Resorts", mcc: "7011", category: "Hotels" },
  { name: "IndiGo Airlines", mcc: "4511", category: "Airlines" },
  { name: "Uber India", mcc: "4121", category: "Transportation" },
  { name: "Swiggy", mcc: "5812", category: "Restaurants" },
  { name: "Amazon India", mcc: "5999", category: "Retail" },
  { name: "Reliance Digital", mcc: "5734", category: "Electronics" },
  { name: "Indian Oil Corporation", mcc: "5541", category: "Gas Station" },
  { name: "Starbucks India", mcc: "5814", category: "Fast Food" },
  { name: "WeWork India", mcc: "7399", category: "Business Services" },
  { name: "Flipkart", mcc: "5999", category: "Retail" },
  { name: "Zomato", mcc: "5812", category: "Restaurants" },
  { name: "MakeMyTrip", mcc: "4722", category: "Travel Agency" },
  { name: "BigBasket", mcc: "5411", category: "Groceries" },
  { name: "Croma", mcc: "5734", category: "Electronics" },
  { name: "Apollo Pharmacy", mcc: "5912", category: "Pharmacy" },
];

const cities = ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"];
const channels = ["POS", "ECOM", "CONTACTLESS", "MOBILE_WALLET"] as const;

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const demoTransactions = Array.from({ length: 200 }, (_, i) => {
  const merchant = merchants[i % merchants.length];
  const card = demoCards[i % demoCards.length];
  const amount = Math.round((Math.random() * 45000 + 500) * 100) / 100;
  const date = randomDate(new Date("2025-10-01"), new Date("2026-02-21"));
  const isSettled = date < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  return {
    id: `txn-${i + 1}`,
    cardId: card.id,
    cardLast4: card.last4Digits,
    employeeId: card.employeeId,
    employeeName: card.employeeName,
    eventType: isSettled ? "SETTLE" : "AUTH",
    amount,
    currency: "INR",
    billingAmount: amount,
    billingCurrency: "INR",
    merchantName: merchant.name,
    mcc: merchant.mcc,
    mccCategory: merchant.category,
    status: isSettled ? "SETTLED" : "PENDING",
    authCode: `A${String(100000 + i).slice(-6)}`,
    channel: channels[i % channels.length],
    location: { city: cities[i % cities.length], country: "IN" },
    timestamp: date.toISOString(),
    hasReceipt: Math.random() > 0.3,
    gstAmount: Math.round(amount * 0.18 * 100) / 100,
  };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// ==================== EXPENSES ====================
const expenseCategories = ["Airfare", "Hotel / Lodging", "Ground Transportation", "Business Meals", "Office Supplies", "Software & SaaS", "Client Entertainment", "Training & Development"];
const glCodes = ["4100-001", "4100-002", "4200-001", "4200-002", "5100-001", "5100-002", "5200-001", "6100-001"];
const policyStatuses = ["COMPLIANT", "COMPLIANT", "COMPLIANT", "SOFT_VIOLATION", "HARD_VIOLATION"] as const;

export const demoExpenses = Array.from({ length: 100 }, (_, i) => {
  const txn = demoTransactions[i % demoTransactions.length];
  const category = expenseCategories[i % expenseCategories.length];

  return {
    id: `exp-${i + 1}`,
    transactionId: i < 80 ? txn.id : null,
    amount: txn.amount,
    originalCurrency: "INR",
    category,
    glCode: glCodes[i % glCodes.length],
    costCenterId: demoCostCenters[i % demoCostCenters.length].id,
    costCenterName: demoCostCenters[i % demoCostCenters.length].name,
    policyStatus: policyStatuses[i % policyStatuses.length],
    businessPurpose: `Business ${category.toLowerCase()} for Q4 project`,
    type: i < 80 ? "CARD" : "CASH",
    employeeId: txn.employeeId,
    employeeName: txn.employeeName,
    merchantName: txn.merchantName,
    date: txn.timestamp,
    hasReceipt: txn.hasReceipt,
    gstDetails: {
      gstin: "27AABCU9603R1ZM",
      cgst: Math.round(txn.amount * 0.09 * 100) / 100,
      sgst: Math.round(txn.amount * 0.09 * 100) / 100,
      igst: 0,
    },
  };
});

// ==================== EXPENSE REPORTS ====================
const reportStatuses = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "PROCESSING", "PAID"] as const;

export const demoExpenseReports = Array.from({ length: 25 }, (_, i) => {
  const employee = demoEmployees[i % demoEmployees.length];
  const status = reportStatuses[i % reportStatuses.length];
  const expenses = demoExpenses.filter((e) => e.employeeId === employee.id).slice(0, 4);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    id: `rpt-${i + 1}`,
    reportNumber: `EXP-2026-${String(i + 1).padStart(4, "0")}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    department: demoDepartments.find((d) => d.id === employee.departmentId)?.name || "",
    title: `${["January", "February", "March", "Q4", "Travel"][i % 5]} Expense Report`,
    status,
    totalAmount: Math.round(total * 100) / 100,
    currency: "INR",
    expenseCount: expenses.length,
    period: "2026-01",
    submittedAt: status !== "DRAFT" ? new Date("2026-02-15").toISOString() : null,
    approvedAt: ["APPROVED", "PROCESSING", "PAID"].includes(status) ? new Date("2026-02-18").toISOString() : null,
    paidAt: status === "PAID" ? new Date("2026-02-20").toISOString() : null,
    policyScore: Math.floor(Math.random() * 20) + 80,
  };
});

// ==================== APPROVALS ====================
export const demoApprovals = demoExpenseReports
  .filter((r) => ["SUBMITTED", "IN_REVIEW"].includes(r.status))
  .map((report, i) => ({
    id: `appr-${i + 1}`,
    entityType: "EXPENSE_REPORT",
    entityId: report.id,
    reportNumber: report.reportNumber,
    employeeName: report.employeeName,
    department: report.department,
    amount: report.totalAmount,
    expenseCount: report.expenseCount,
    status: "PENDING",
    level: 1,
    submittedAt: report.submittedAt,
    dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    policyScore: report.policyScore,
  }));

// ==================== POLICIES ====================
export const demoPolicies = [
  { id: "pol-1", name: "Meal Expense Cap", type: "CATEGORY", rules: { category: "Meals & Entertainment", maxAmount: 5000 }, severity: "SOFT", isActive: true, version: 3 },
  { id: "pol-2", name: "Hotel Rate Limit", type: "CATEGORY", rules: { category: "Travel - Hotel", maxAmount: 15000 }, severity: "HARD", isActive: true, version: 2 },
  { id: "pol-3", name: "Receipt Required > 500", type: "RECEIPT", rules: { threshold: 500 }, severity: "HARD", isActive: true, version: 1 },
  { id: "pol-4", name: "International Travel - Economy Only", type: "CATEGORY", rules: { category: "Travel - Air", maxAmount: 50000, note: "Economy class unless > 6 hours" }, severity: "SOFT", isActive: true, version: 1 },
  { id: "pol-5", name: "Entertainment Approval Required", type: "CATEGORY", rules: { category: "Client Entertainment", requiresApproval: true }, severity: "HARD", isActive: true, version: 1 },
  { id: "pol-6", name: "MCC Blocked - Gambling", type: "MCC", rules: { blockedMCCs: ["7995", "7800", "7801", "7802"] }, severity: "HARD", isActive: true, version: 1 },
];

// ==================== DOA ====================
export const doaAuthorityLevels = [
  { id: "doa-lvl-1", name: "Team Lead", maxAmount: 5000, allowedCategories: ["All"] },
  { id: "doa-lvl-2", name: "Manager", maxAmount: 25000, allowedCategories: ["All"] },
  { id: "doa-lvl-3", name: "Senior Manager / HOD", maxAmount: 100000, allowedCategories: ["All"] },
  { id: "doa-lvl-4", name: "Director", maxAmount: 500000, allowedCategories: ["All"] },
  { id: "doa-lvl-5", name: "VP / CFO", maxAmount: 5000000, allowedCategories: ["All"] },
];

export const doaApprovalMatrix = [
  { id: "doa-rule-1", amountRange: "0 - 5,000", category: "All", approvers: "Direct Manager" },
  { id: "doa-rule-2", amountRange: "5,000 - 25,000", category: "All", approvers: "Manager + HOD" },
  { id: "doa-rule-3", amountRange: "25,000 - 1,00,000", category: "All", approvers: "HOD + Finance" },
  { id: "doa-rule-4", amountRange: "1,00,000 - 5,00,000", category: "All", approvers: "Director + CFO" },
  { id: "doa-rule-5", amountRange: "> 5,00,000", category: "All", approvers: "VP + CFO + Board" },
  { id: "doa-rule-6", amountRange: "Any", category: "Entertainment", approvers: "HOD + Finance + CFO" },
  { id: "doa-rule-7", amountRange: "Any", category: "International Travel", approvers: "Manager + Finance" },
];

// ==================== ANALYTICS ====================
export const spendByCategory = [
  { name: "Travel - Air", value: 2850000, color: "#3b82f6" },
  { name: "Travel - Hotel", value: 1920000, color: "#8b5cf6" },
  { name: "Meals & Entertainment", value: 1450000, color: "#f97316" },
  { name: "Travel - Ground", value: 980000, color: "#06b6d4" },
  { name: "Office Supplies", value: 650000, color: "#22c55e" },
  { name: "Software", value: 520000, color: "#7c3aed" },
  { name: "Client Entertainment", value: 380000, color: "#ec4899" },
  { name: "Other", value: 250000, color: "#64748b" },
];

export const spendByMonth = [
  { month: "Oct 2025", amount: 4200000 },
  { month: "Nov 2025", amount: 5100000 },
  { month: "Dec 2025", amount: 3800000 },
  { month: "Jan 2026", amount: 5500000 },
  { month: "Feb 2026", amount: 3400000 },
];

export const topSpenders = [
  { name: "Rajesh Kumar", department: "Sales & Marketing", amount: 890000 },
  { name: "Priya Sharma", department: "Sales & Marketing", amount: 720000 },
  { name: "Kavitha Reddy", department: "Infrastructure", amount: 650000 },
  { name: "Suresh Menon", department: "Branch Banking", amount: 580000 },
  { name: "Deepa Nair", department: "Product Development", amount: 520000 },
];

// ==================== HIERARCHY SPEND (by department) ====================
export const hierarchySpend = [
  { name: "Sales & Marketing", division: "Corporate Banking", spend: 890000, limit: 1500000, cards: 4, color: "#3b82f6" },
  { name: "Operations", division: "Corporate Banking", spend: 650000, limit: 1000000, cards: 3, color: "#8b5cf6" },
  { name: "Credit Analysis", division: "Corporate Banking", spend: 420000, limit: 800000, cards: 2, color: "#06b6d4" },
  { name: "Branch Banking", division: "Retail Banking", spend: 580000, limit: 1200000, cards: 3, color: "#f97316" },
  { name: "Product Development", division: "Technology", spend: 520000, limit: 1500000, cards: 4, color: "#22c55e" },
  { name: "Infrastructure", division: "Technology", spend: 380000, limit: 1000000, cards: 2, color: "#ec4899" },
  { name: "Equity Research", division: "Investment Banking", spend: 720000, limit: 2000000, cards: 3, color: "#7c3aed" },
  { name: "Risk Management", division: "Investment Banking", spend: 240000, limit: 800000, cards: 1, color: "#64748b" },
];

// ==================== EMPLOYEE-SPECIFIC DATA ====================
export const employeeDashboardData = {
  myCards: [
    { last4: "1009", type: "PHYSICAL", network: "VISA", status: "ACTIVE", limit: 500000, spent: 182000, available: 318000 },
    { last4: "1010", type: "VIRTUAL", network: "MASTERCARD", status: "ACTIVE", limit: 200000, spent: 45000, available: 155000 },
  ],
  myRecentTransactions: [
    { merchant: "Swiggy", amount: 1250, date: "2026-02-21", status: "SETTLED", hasReceipt: true },
    { merchant: "Uber India", amount: 890, date: "2026-02-20", status: "SETTLED", hasReceipt: false },
    { merchant: "Amazon India", amount: 15600, date: "2026-02-19", status: "SETTLED", hasReceipt: true },
    { merchant: "WeWork India", amount: 8500, date: "2026-02-18", status: "SETTLED", hasReceipt: true },
    { merchant: "Starbucks India", amount: 650, date: "2026-02-17", status: "SETTLED", hasReceipt: false },
  ],
  missingReceipts: 3,
  pendingExpenses: 2,
  totalSpendMTD: 182000,
  totalSpendLastMonth: 165000,
};

// ==================== CARD STATEMENTS ====================
export const demoCardStatements = demoCards.slice(0, 12).flatMap((card, i) => {
  const emp = demoEmployees.find((e) => e.id === card.employeeId);
  const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
  return ["2026-01", "2025-12", "2025-11"].map((period, j) => {
    const totalDebits = Math.round((Math.random() * 80000 + 10000) * 100) / 100;
    const totalCredits = j > 0 ? Math.round(totalDebits * (0.9 + Math.random() * 0.1) * 100) / 100 : 0;
    const openingBalance = j > 0 ? Math.round(Math.random() * 20000 * 100) / 100 : 0;
    const closingBalance = Math.round((openingBalance + totalDebits - totalCredits) * 100) / 100;
    const statuses = ["GENERATED", "SENT", "PAID", "OVERDUE"] as const;
    const status = j === 0 ? "GENERATED" : j === 1 ? "SENT" : statuses[i % statuses.length];
    return {
      id: `stmt-${i * 3 + j + 1}`,
      cardId: card.id,
      cardLast4: card.last4Digits,
      employeeId: card.employeeId,
      employeeName: empName,
      companyId: "comp-1",
      statementPeriod: period,
      openingBalance,
      closingBalance,
      totalDebits,
      totalCredits,
      minimumDue: Math.round(closingBalance * 0.05 * 100) / 100,
      dueDate: period === "2026-01" ? "2026-02-25" : period === "2025-12" ? "2026-01-25" : "2025-12-25",
      status,
      transactionCount: Math.floor(Math.random() * 20) + 3,
      generatedAt: `${period}-20T00:00:00Z`,
      pdfUrl: `/statements/card/stmt-${i * 3 + j + 1}.pdf`,
    };
  });
});

// ==================== CORPORATE STATEMENTS ====================
export const demoCorporateStatements = demoCompanies.flatMap((company, i) =>
  ["2026-01", "2025-12", "2025-11"].map((period, j) => {
    const cardCount = demoCards.length / demoCompanies.length;
    const totalAmount = Math.round((Math.random() * 500000 + 200000) * 100) / 100;
    const statuses = ["GENERATED", "SENT", "PAID"] as const;
    return {
      id: `corp-stmt-${i * 3 + j + 1}`,
      companyId: company.id,
      companyName: company.name,
      statementPeriod: period,
      totalCards: Math.floor(cardCount),
      totalTransactions: Math.floor(Math.random() * 100) + 30,
      totalAmount,
      totalGst: Math.round(totalAmount * 0.18 * 100) / 100,
      dueDate: period === "2026-01" ? "2026-02-25" : period === "2025-12" ? "2026-01-25" : "2025-12-25",
      status: statuses[j % statuses.length],
      generatedAt: `${period}-20T00:00:00Z`,
      pdfUrl: `/statements/corporate/corp-stmt-${i * 3 + j + 1}.pdf`,
    };
  })
);

// ==================== PAYMENT CYCLES ====================
export const demoPaymentCycles = demoCompanies.flatMap((company, i) =>
  ["2026-01", "2025-12", "2025-11"].map((period, j) => {
    const totalDue = Math.round((Math.random() * 600000 + 200000) * 100) / 100;
    const statuses = ["DUE", "PAYMENT_INITIATED", "PAYMENT_RECEIVED", "APPORTIONED", "RECONCILED"] as const;
    const status = j === 0 ? "DUE" : j === 1 ? "PAYMENT_RECEIVED" : "RECONCILED";
    const apportionmentStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
    return {
      id: `pmt-cycle-${i * 3 + j + 1}`,
      companyId: company.id,
      companyName: company.name,
      statementPeriod: period,
      dueDate: period === "2026-01" ? "2026-02-25" : period === "2025-12" ? "2026-01-25" : "2025-12-25",
      totalDue,
      status,
      paymentRef: j > 0 ? `NEFT${String(Date.now()).slice(-8)}${i}${j}` : "",
      paymentDate: j > 0 ? `${period}-23` : null,
      paymentMode: j > 0 ? (["NEFT", "RTGS", "IMPS"] as const)[i % 3] : null,
      apportionmentStatus: apportionmentStatuses[j % apportionmentStatuses.length],
      cardCount: Math.floor(demoCards.length / demoCompanies.length),
    };
  })
);

// ==================== PAYMENT APPORTIONMENTS ====================
export const demoPaymentApportionments = demoPaymentCycles
  .filter((pc) => pc.status !== "DUE")
  .flatMap((cycle, ci) =>
    demoCards.slice(0, 6).map((card, j) => {
      const emp = demoEmployees.find((e) => e.id === card.employeeId);
      const dept = emp ? demoDepartments.find((d) => d.id === emp.departmentId) : null;
      const cc = emp ? demoCostCenters.find((c) => c.id === emp.costCenterId) : null;
      return {
        id: `pmt-appr-${ci * 6 + j + 1}`,
        paymentCycleId: cycle.id,
        cardId: card.id,
        cardLast4: card.last4Digits,
        employeeId: card.employeeId,
        employeeName: card.employeeName,
        departmentName: dept?.name || card.department,
        costCenterName: cc?.name || "",
        amount: Math.round((cycle.totalDue / 6) * 100) / 100,
        status: cycle.apportionmentStatus === "COMPLETED" ? "RECONCILED" : cycle.apportionmentStatus === "IN_PROGRESS" ? "APPORTIONED" : "PENDING",
      };
    })
  );

// ==================== WORKFLOW REQUESTS ====================
const workflowTypes = ["CARD_REQUEST", "LIMIT_CHANGE", "CARD_CANCELLATION", "CONTROLS_OVERRIDE", "INTERNATIONAL_ENABLE"] as const;
export const demoWorkflowRequests = [
  {
    id: "wf-1",
    type: "CARD_REQUEST",
    requestorId: "emp-5",
    requestorName: "Vikram Singh",
    department: "Product Development",
    status: "PENDING",
    details: { cardType: "PHYSICAL", network: "VISA", justification: "International client visit requiring physical card", requestedLimit: 100000 },
    currentApprover: "Deepa Nair",
    approvalChain: [
      { name: "Deepa Nair", role: "Manager", status: "PENDING", date: null },
      { name: "Rajesh Kumar", role: "Admin", status: "PENDING", date: null },
    ],
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
    comments: [{ author: "Vikram Singh", text: "Need physical card for upcoming Singapore trip", date: "2026-02-18T10:00:00Z" }],
  },
  {
    id: "wf-2",
    type: "LIMIT_CHANGE",
    requestorId: "emp-6",
    requestorName: "Ananya Gupta",
    department: "Credit Analysis",
    status: "PENDING",
    details: { cardId: "card-11", currentLimit: 50000, requestedLimit: 150000, reason: "Year-end procurement of analysis tools" },
    currentApprover: "Priya Sharma",
    approvalChain: [
      { name: "Priya Sharma", role: "Manager", status: "PENDING", date: null },
      { name: "Arun Patel", role: "Finance", status: "PENDING", date: null },
    ],
    createdAt: "2026-02-17T14:30:00Z",
    updatedAt: "2026-02-17T14:30:00Z",
    comments: [],
  },
  {
    id: "wf-3",
    type: "CARD_CANCELLATION",
    requestorId: "emp-7",
    requestorName: "Suresh Menon",
    department: "Branch Banking",
    status: "APPROVED",
    details: { cardId: "card-14", reason: "Employee transferred to different branch — no longer needed" },
    currentApprover: "",
    approvalChain: [
      { name: "Rajesh Kumar", role: "Admin", status: "APPROVED", date: "2026-02-15T11:00:00Z" },
    ],
    createdAt: "2026-02-14T09:00:00Z",
    updatedAt: "2026-02-15T11:00:00Z",
    comments: [
      { author: "Suresh Menon", text: "Transferring to Pune branch, please cancel virtual card", date: "2026-02-14T09:00:00Z" },
      { author: "Rajesh Kumar", text: "Approved. Card will be cancelled after statement closure.", date: "2026-02-15T11:00:00Z" },
    ],
  },
  {
    id: "wf-4",
    type: "CONTROLS_OVERRIDE",
    requestorId: "emp-4",
    requestorName: "Deepa Nair",
    department: "Product Development",
    status: "PENDING",
    details: { cardId: "card-7", override: "Enable ATM withdrawal", currentSetting: "ATM disabled", requestedSetting: "ATM enabled up to 20,000/day", duration: "30 days" },
    currentApprover: "Rajesh Kumar",
    approvalChain: [
      { name: "Rajesh Kumar", role: "Admin", status: "PENDING", date: null },
    ],
    createdAt: "2026-02-19T16:00:00Z",
    updatedAt: "2026-02-19T16:00:00Z",
    comments: [{ author: "Deepa Nair", text: "Team offsite in remote location — need ATM access for 30 days", date: "2026-02-19T16:00:00Z" }],
  },
  {
    id: "wf-5",
    type: "INTERNATIONAL_ENABLE",
    requestorId: "emp-9",
    requestorName: "Rahul Verma",
    department: "Equity Research",
    status: "REJECTED",
    details: { cardId: "card-17", countries: ["USA", "UK"], duration: "14 days", purpose: "International equity research conference" },
    currentApprover: "",
    approvalChain: [
      { name: "Meera Iyer", role: "Manager", status: "APPROVED", date: "2026-02-10T09:00:00Z" },
      { name: "Arun Patel", role: "Finance", status: "REJECTED", date: "2026-02-11T14:00:00Z" },
    ],
    createdAt: "2026-02-09T10:00:00Z",
    updatedAt: "2026-02-11T14:00:00Z",
    comments: [
      { author: "Rahul Verma", text: "Attending annual conference in New York", date: "2026-02-09T10:00:00Z" },
      { author: "Meera Iyer", text: "Approved from team side", date: "2026-02-10T09:00:00Z" },
      { author: "Arun Patel", text: "Budget not allocated for international travel this quarter. Please resubmit next quarter.", date: "2026-02-11T14:00:00Z" },
    ],
  },
  {
    id: "wf-6",
    type: "CARD_REQUEST",
    requestorId: "emp-2",
    requestorName: "Priya Sharma",
    department: "Sales & Marketing",
    status: "APPROVED",
    details: { cardType: "VIRTUAL", network: "MASTERCARD", justification: "Online SaaS subscriptions management", requestedLimit: 200000 },
    currentApprover: "",
    approvalChain: [
      { name: "Rajesh Kumar", role: "Admin", status: "APPROVED", date: "2026-02-12T10:00:00Z" },
    ],
    createdAt: "2026-02-11T09:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
    comments: [{ author: "Rajesh Kumar", text: "Approved. Virtual card issued.", date: "2026-02-12T10:00:00Z" }],
  },
  {
    id: "wf-7",
    type: "LIMIT_CHANGE",
    requestorId: "emp-8",
    requestorName: "Kavitha Reddy",
    department: "Infrastructure",
    status: "PENDING",
    details: { cardId: "card-15", currentLimit: 50000, requestedLimit: 300000, reason: "Server hardware procurement for Q1" },
    currentApprover: "Deepa Nair",
    approvalChain: [
      { name: "Deepa Nair", role: "Manager", status: "PENDING", date: null },
      { name: "Arun Patel", role: "Finance", status: "PENDING", date: null },
      { name: "Rajesh Kumar", role: "Admin", status: "PENDING", date: null },
    ],
    createdAt: "2026-02-20T08:00:00Z",
    updatedAt: "2026-02-20T08:00:00Z",
    comments: [{ author: "Kavitha Reddy", text: "Urgent procurement for new data center setup", date: "2026-02-20T08:00:00Z" }],
  },
];

// ==================== DISPUTES ====================
export const demoDisputes = [
  {
    id: "disp-1",
    transactionId: "txn-5",
    cardId: demoTransactions[4]?.cardId || "card-1",
    cardLast4: demoTransactions[4]?.cardLast4 || "1001",
    employeeId: demoTransactions[4]?.employeeId || "emp-1",
    employeeName: demoTransactions[4]?.employeeName || "Rajesh Kumar",
    amount: demoTransactions[4]?.amount || 12500,
    reason: "Unauthorized transaction",
    description: "I did not authorize this transaction. Card was in my possession at the time.",
    status: "INVESTIGATING",
    provisionalCreditAmount: null,
    provisionalCreditDate: null,
    resolution: null,
    resolvedAt: null,
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "disp-2",
    transactionId: "txn-12",
    cardId: demoTransactions[11]?.cardId || "card-3",
    cardLast4: demoTransactions[11]?.cardLast4 || "1003",
    employeeId: demoTransactions[11]?.employeeId || "emp-2",
    employeeName: demoTransactions[11]?.employeeName || "Priya Sharma",
    amount: demoTransactions[11]?.amount || 8750,
    reason: "Duplicate charge",
    description: "Merchant charged twice for the same purchase. Have receipt showing single transaction.",
    status: "PROVISIONAL_CREDIT",
    provisionalCreditAmount: demoTransactions[11]?.amount || 8750,
    provisionalCreditDate: "2026-02-17T00:00:00Z",
    resolution: null,
    resolvedAt: null,
    createdAt: "2026-02-14T14:00:00Z",
  },
  {
    id: "disp-3",
    transactionId: "txn-20",
    cardId: demoTransactions[19]?.cardId || "card-5",
    cardLast4: demoTransactions[19]?.cardLast4 || "1005",
    employeeId: demoTransactions[19]?.employeeId || "emp-3",
    employeeName: demoTransactions[19]?.employeeName || "Arun Patel",
    amount: demoTransactions[19]?.amount || 3200,
    reason: "Wrong amount charged",
    description: "Hotel charged ₹3,200 but the actual bill was ₹2,400. Difference of ₹800.",
    status: "RESOLVED",
    provisionalCreditAmount: 800,
    provisionalCreditDate: "2026-02-08T00:00:00Z",
    resolution: "Merchant confirmed overcharge. ₹800 refunded to card.",
    resolvedAt: "2026-02-12T16:00:00Z",
    createdAt: "2026-02-05T09:00:00Z",
  },
  {
    id: "disp-4",
    transactionId: "txn-30",
    cardId: demoTransactions[29]?.cardId || "card-7",
    cardLast4: demoTransactions[29]?.cardLast4 || "1007",
    employeeId: demoTransactions[29]?.employeeId || "emp-4",
    employeeName: demoTransactions[29]?.employeeName || "Deepa Nair",
    amount: demoTransactions[29]?.amount || 15000,
    reason: "Service not received",
    description: "Paid for software license but never received access credentials. Vendor unresponsive.",
    status: "RAISED",
    provisionalCreditAmount: null,
    provisionalCreditDate: null,
    resolution: null,
    resolvedAt: null,
    createdAt: "2026-02-20T11:00:00Z",
  },
  {
    id: "disp-5",
    transactionId: "txn-45",
    cardId: demoTransactions[44]?.cardId || "card-9",
    cardLast4: demoTransactions[44]?.cardLast4 || "1009",
    employeeId: demoTransactions[44]?.employeeId || "emp-5",
    employeeName: demoTransactions[44]?.employeeName || "Vikram Singh",
    amount: demoTransactions[44]?.amount || 22000,
    reason: "Fraudulent transaction",
    description: "Transaction from a merchant I have never visited. Location shows Delhi but I was in Bangalore.",
    status: "REJECTED",
    provisionalCreditAmount: null,
    provisionalCreditDate: null,
    resolution: "Investigation completed. 3D Secure authentication confirmed. Dispute not valid.",
    resolvedAt: "2026-02-18T15:00:00Z",
    createdAt: "2026-02-10T08:00:00Z",
  },
];

// ==================== DETECTED SUBSCRIPTIONS ====================
export const demoDetectedSubscriptions = [
  { id: "sub-1", cardId: "card-1", cardLast4: "1001", employeeId: "emp-1", employeeName: "Rajesh Kumar", merchantName: "Amazon Prime", mcc: "5968", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 1499, avgAmount: 1499, totalCharges: 12, isActive: true, detectedAt: "2025-03-15T00:00:00Z" },
  { id: "sub-2", cardId: "card-1", cardLast4: "1001", employeeId: "emp-1", employeeName: "Rajesh Kumar", merchantName: "Microsoft 365", mcc: "5734", frequency: "MONTHLY", lastChargeDate: "2026-02-05", lastChargeAmount: 6199, avgAmount: 6199, totalCharges: 8, isActive: true, detectedAt: "2025-07-10T00:00:00Z" },
  { id: "sub-3", cardId: "card-3", cardLast4: "1003", employeeId: "emp-2", employeeName: "Priya Sharma", merchantName: "Zoom Pro", mcc: "5734", frequency: "MONTHLY", lastChargeDate: "2026-02-03", lastChargeAmount: 13200, avgAmount: 13200, totalCharges: 10, isActive: true, detectedAt: "2025-05-01T00:00:00Z" },
  { id: "sub-4", cardId: "card-7", cardLast4: "1007", employeeId: "emp-4", employeeName: "Deepa Nair", merchantName: "GitHub Enterprise", mcc: "5734", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 19000, avgAmount: 19000, totalCharges: 14, isActive: true, detectedAt: "2025-01-20T00:00:00Z" },
  { id: "sub-5", cardId: "card-7", cardLast4: "1007", employeeId: "emp-4", employeeName: "Deepa Nair", merchantName: "AWS Cloud Services", mcc: "7372", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 45000, avgAmount: 42000, totalCharges: 15, isActive: true, detectedAt: "2025-01-01T00:00:00Z" },
  { id: "sub-6", cardId: "card-9", cardLast4: "1009", employeeId: "emp-5", employeeName: "Vikram Singh", merchantName: "Slack Business+", mcc: "5734", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 7500, avgAmount: 7500, totalCharges: 6, isActive: true, detectedAt: "2025-09-01T00:00:00Z" },
  { id: "sub-7", cardId: "card-11", cardLast4: "1011", employeeId: "emp-6", employeeName: "Ananya Gupta", merchantName: "Bloomberg Terminal", mcc: "7372", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 180000, avgAmount: 180000, totalCharges: 24, isActive: true, detectedAt: "2024-03-01T00:00:00Z" },
  { id: "sub-8", cardId: "card-15", cardLast4: "1015", employeeId: "emp-8", employeeName: "Kavitha Reddy", merchantName: "Jira Software", mcc: "5734", frequency: "ANNUAL", lastChargeDate: "2025-11-15", lastChargeAmount: 46800, avgAmount: 46800, totalCharges: 2, isActive: true, detectedAt: "2024-11-15T00:00:00Z" },
  { id: "sub-9", cardId: "card-5", cardLast4: "1005", employeeId: "emp-3", employeeName: "Arun Patel", merchantName: "Salesforce CRM", mcc: "7372", frequency: "QUARTERLY", lastChargeDate: "2026-01-15", lastChargeAmount: 125000, avgAmount: 125000, totalCharges: 4, isActive: true, detectedAt: "2025-04-15T00:00:00Z" },
  { id: "sub-10", cardId: "card-17", cardLast4: "1017", employeeId: "emp-9", employeeName: "Rahul Verma", merchantName: "Reuters Terminal", mcc: "7372", frequency: "MONTHLY", lastChargeDate: "2026-02-01", lastChargeAmount: 95000, avgAmount: 95000, totalCharges: 18, isActive: true, detectedAt: "2024-09-01T00:00:00Z" },
];

// ==================== SCHEDULED CARD ACTIONS ====================
export const demoScheduledCardActions = [
  { id: "sca-1", cardId: "card-9", cardLast4: "1009", employeeId: "emp-5", employeeName: "Vikram Singh", actionType: "FREEZE", scheduledDate: "2026-03-01", recurrence: "ONCE", status: "PENDING", details: { reason: "Employee on leave March 1-15" }, createdAt: "2026-02-20T10:00:00Z" },
  { id: "sca-2", cardId: "card-9", cardLast4: "1009", employeeId: "emp-5", employeeName: "Vikram Singh", actionType: "UNFREEZE", scheduledDate: "2026-03-16", recurrence: "ONCE", status: "PENDING", details: { reason: "Employee returns from leave" }, createdAt: "2026-02-20T10:01:00Z" },
  { id: "sca-3", cardId: "card-1", cardLast4: "1001", employeeId: "emp-1", employeeName: "Rajesh Kumar", actionType: "LIMIT_CHANGE", scheduledDate: "2026-03-01", recurrence: "MONTHLY", status: "PENDING", details: { newLimit: { perTransaction: 75000, daily: 150000, monthly: 750000 }, reason: "Monthly limit increase for Q1" }, createdAt: "2026-02-19T08:00:00Z" },
  { id: "sca-4", cardId: "card-7", cardLast4: "1007", employeeId: "emp-4", employeeName: "Deepa Nair", actionType: "FREEZE", scheduledDate: "2026-02-28", recurrence: "ONCE", status: "PENDING", details: { reason: "Project completion — freeze until next allocation" }, createdAt: "2026-02-18T14:00:00Z" },
  { id: "sca-5", cardId: "card-13", cardLast4: "1013", employeeId: "emp-7", employeeName: "Suresh Menon", actionType: "FREEZE", scheduledDate: "2026-02-01", recurrence: "ONCE", status: "EXECUTED", details: { reason: "Branch audit period" }, createdAt: "2026-01-25T10:00:00Z" },
  { id: "sca-6", cardId: "card-13", cardLast4: "1013", employeeId: "emp-7", employeeName: "Suresh Menon", actionType: "UNFREEZE", scheduledDate: "2026-02-10", recurrence: "ONCE", status: "EXECUTED", details: { reason: "Audit completed" }, createdAt: "2026-01-25T10:01:00Z" },
];

// ==================== DASHBOARD STATS ====================
export const dashboardStats = {
  totalSpendMTD: 3400000,
  totalSpendYTD: 22000000,
  activeCards: 18,
  totalCards: 20,
  pendingApprovals: 8,
  policyComplianceScore: 87,
  totalEmployees: 10,
  cardLimitTotal: 10000000,
  cardLimitUtilized: 6800000,
  limitUtilizationPercent: 68,
  expenseModuleEnabled: true,
  totalTransactionsMTD: 142,
  avgTransactionValue: 23943,
  disputeRate: 0.8,
};
