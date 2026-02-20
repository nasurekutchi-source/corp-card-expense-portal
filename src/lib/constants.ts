export const APP_NAME = "CorpCard Pro";
export const APP_DESCRIPTION = "Corporate Card Portal & Expense Management";

export const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  FINANCE_CONTROLLER: "FINANCE_CONTROLLER",
  DEPT_MANAGER: "DEPT_MANAGER",
  EMPLOYEE: "EMPLOYEE",
  AUDITOR: "AUDITOR",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "System Admin",
  COMPANY_ADMIN: "Company Admin",
  FINANCE_CONTROLLER: "Finance Controller",
  DEPT_MANAGER: "Department Manager",
  EMPLOYEE: "Employee",
  AUDITOR: "Auditor",
};

export const CARD_TYPES = {
  PHYSICAL: "PHYSICAL",
  VIRTUAL: "VIRTUAL",
  SINGLE_USE: "SINGLE_USE",
} as const;

export const CARD_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
  FROZEN: "FROZEN",
  PENDING: "PENDING",
} as const;

export const TRANSACTION_TYPES = {
  AUTH: "AUTH",
  SETTLE: "SETTLE",
  REVERSE: "REVERSE",
  DECLINE: "DECLINE",
} as const;

export const TRANSACTION_STATUS = {
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  PENDING: "PENDING",
  REVERSED: "REVERSED",
  SETTLED: "SETTLED",
} as const;

export const EXPENSE_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
} as const;

export const EXPENSE_TYPES = {
  CARD: "CARD",
  CASH: "CASH",
  PERSONAL_CARD: "PERSONAL_CARD",
  MILEAGE: "MILEAGE",
  PER_DIEM: "PER_DIEM",
} as const;

export const POLICY_STATUS = {
  COMPLIANT: "COMPLIANT",
  SOFT_VIOLATION: "SOFT_VIOLATION",
  HARD_VIOLATION: "HARD_VIOLATION",
  EXCEPTION: "EXCEPTION",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  DELEGATED: "DELEGATED",
  ESCALATED: "ESCALATED",
} as const;

export const PAYMENT_METHODS = {
  NEFT: "NEFT",
  RTGS: "RTGS",
  IMPS: "IMPS",
  UPI: "UPI",
  ACH: "ACH",
  WIRE: "WIRE",
} as const;

export const CHANNELS = {
  POS: "POS",
  ECOM: "ECOM",
  ATM: "ATM",
  CONTACTLESS: "CONTACTLESS",
  MOBILE_WALLET: "MOBILE_WALLET",
} as const;

// MCC Category Groups
export const MCC_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  "5411": { label: "Groceries", icon: "ShoppingCart", color: "#22c55e" },
  "5812": { label: "Restaurants", icon: "UtensilsCrossed", color: "#f97316" },
  "5814": { label: "Fast Food", icon: "Coffee", color: "#eab308" },
  "5541": { label: "Gas Station", icon: "Fuel", color: "#ef4444" },
  "5542": { label: "Gas Station", icon: "Fuel", color: "#ef4444" },
  "4511": { label: "Airlines", icon: "Plane", color: "#3b82f6" },
  "7011": { label: "Hotels", icon: "Building2", color: "#8b5cf6" },
  "7512": { label: "Car Rental", icon: "Car", color: "#06b6d4" },
  "5311": { label: "Department Store", icon: "Store", color: "#ec4899" },
  "5912": { label: "Pharmacy", icon: "Pill", color: "#14b8a6" },
  "5999": { label: "Retail", icon: "Package", color: "#64748b" },
  "7399": { label: "Business Services", icon: "Briefcase", color: "#6366f1" },
  "8011": { label: "Medical", icon: "Stethoscope", color: "#10b981" },
  "8099": { label: "Health Services", icon: "Heart", color: "#f43f5e" },
  "5734": { label: "Software", icon: "Monitor", color: "#7c3aed" },
  "5045": { label: "Office Equipment", icon: "Printer", color: "#78716c" },
};

// GST Slabs (India)
export const GST_SLABS = [0, 5, 12, 18, 28] as const;

// TDS Sections (India)
export const TDS_SECTIONS = [
  { code: "194C", label: "194C - Contractors", rate: 1 },
  { code: "194J", label: "194J - Professional/Technical", rate: 10 },
  { code: "194I", label: "194I - Rent", rate: 10 },
  { code: "194H", label: "194H - Commission/Brokerage", rate: 5 },
  { code: "194A", label: "194A - Interest (other than securities)", rate: 10 },
] as const;

// Demo credentials
export const DEMO_USERS = [
  { email: "admin@corpcardpro.com", password: "admin123", role: "SYSTEM_ADMIN", name: "Rajesh Kumar" },
  { email: "company@corpcardpro.com", password: "company123", role: "COMPANY_ADMIN", name: "Priya Sharma" },
  { email: "finance@corpcardpro.com", password: "finance123", role: "FINANCE_CONTROLLER", name: "Arun Patel" },
  { email: "manager@corpcardpro.com", password: "manager123", role: "DEPT_MANAGER", name: "Deepa Nair" },
  { email: "employee@corpcardpro.com", password: "employee123", role: "EMPLOYEE", name: "Vikram Singh" },
];
