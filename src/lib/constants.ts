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

// ==================== EXPENSE CATEGORIES (Industry Standard) ====================
export interface ExpenseSubcategory {
  code: string;
  label: string;
  glPrefix?: string;
}

export interface ExpenseCategory {
  code: string;
  label: string;
  icon: string;
  color: string;
  subcategories: ExpenseSubcategory[];
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    code: "TRAVEL", label: "Travel", icon: "Plane", color: "#3b82f6",
    subcategories: [
      { code: "TRAVEL_AIR", label: "Airfare", glPrefix: "4110" },
      { code: "TRAVEL_HOTEL", label: "Hotel / Lodging", glPrefix: "4120" },
      { code: "TRAVEL_GROUND", label: "Ground Transportation", glPrefix: "4130" },
      { code: "TRAVEL_CAR_RENTAL", label: "Car Rental", glPrefix: "4140" },
      { code: "TRAVEL_RAIL", label: "Rail / Metro", glPrefix: "4150" },
      { code: "TRAVEL_MILEAGE", label: "Mileage Reimbursement", glPrefix: "4160" },
      { code: "TRAVEL_VISA", label: "Visa / Immigration", glPrefix: "4170" },
      { code: "TRAVEL_PER_DIEM", label: "Per Diem", glPrefix: "4180" },
      { code: "TRAVEL_OTHER", label: "Travel - Other", glPrefix: "4190" },
    ],
  },
  {
    code: "MEALS", label: "Meals & Entertainment", icon: "UtensilsCrossed", color: "#f97316",
    subcategories: [
      { code: "MEALS_BUSINESS", label: "Business Meals", glPrefix: "4210" },
      { code: "MEALS_CLIENT", label: "Client Entertainment", glPrefix: "4220" },
      { code: "MEALS_TEAM", label: "Team Events", glPrefix: "4230" },
      { code: "MEALS_WORKING", label: "Working Lunch / Dinner", glPrefix: "4240" },
      { code: "MEALS_OTHER", label: "Meals - Other", glPrefix: "4290" },
    ],
  },
  {
    code: "OFFICE", label: "Office & Administrative", icon: "Building2", color: "#64748b",
    subcategories: [
      { code: "OFFICE_SUPPLIES", label: "Office Supplies", glPrefix: "4310" },
      { code: "OFFICE_PRINTING", label: "Printing & Stationery", glPrefix: "4320" },
      { code: "OFFICE_COURIER", label: "Courier & Shipping", glPrefix: "4330" },
      { code: "OFFICE_POSTAGE", label: "Postage", glPrefix: "4340" },
      { code: "OFFICE_FURNITURE", label: "Furniture & Fixtures", glPrefix: "4350" },
      { code: "OFFICE_OTHER", label: "Office - Other", glPrefix: "4390" },
    ],
  },
  {
    code: "TECHNOLOGY", label: "Technology", icon: "Monitor", color: "#7c3aed",
    subcategories: [
      { code: "TECH_SOFTWARE", label: "Software & SaaS", glPrefix: "4410" },
      { code: "TECH_HARDWARE", label: "Hardware & Equipment", glPrefix: "4420" },
      { code: "TECH_MOBILE", label: "Mobile & Telecom", glPrefix: "4430" },
      { code: "TECH_INTERNET", label: "Internet & Connectivity", glPrefix: "4440" },
      { code: "TECH_CLOUD", label: "Cloud Services", glPrefix: "4450" },
      { code: "TECH_OTHER", label: "Technology - Other", glPrefix: "4490" },
    ],
  },
  {
    code: "PROFESSIONAL", label: "Professional Services", icon: "Briefcase", color: "#6366f1",
    subcategories: [
      { code: "PROF_LEGAL", label: "Legal & Compliance", glPrefix: "4510" },
      { code: "PROF_CONSULTING", label: "Consulting Fees", glPrefix: "4520" },
      { code: "PROF_AUDIT", label: "Audit & Accounting", glPrefix: "4530" },
      { code: "PROF_TRAINING", label: "Training & Development", glPrefix: "4540" },
      { code: "PROF_RECRUITMENT", label: "Recruitment", glPrefix: "4550" },
      { code: "PROF_OTHER", label: "Professional - Other", glPrefix: "4590" },
    ],
  },
  {
    code: "MARKETING", label: "Marketing & Sales", icon: "Megaphone", color: "#ec4899",
    subcategories: [
      { code: "MKT_ADVERTISING", label: "Advertising & Promotion", glPrefix: "4610" },
      { code: "MKT_EVENTS", label: "Events & Conferences", glPrefix: "4620" },
      { code: "MKT_GIFTS", label: "Client Gifts & Giveaways", glPrefix: "4630" },
      { code: "MKT_SPONSORSHIP", label: "Sponsorship", glPrefix: "4640" },
      { code: "MKT_OTHER", label: "Marketing - Other", glPrefix: "4690" },
    ],
  },
  {
    code: "FACILITIES", label: "Facilities & Infrastructure", icon: "Home", color: "#14b8a6",
    subcategories: [
      { code: "FAC_RENT", label: "Rent & Lease", glPrefix: "4710" },
      { code: "FAC_UTILITIES", label: "Utilities", glPrefix: "4720" },
      { code: "FAC_MAINTENANCE", label: "Maintenance & Repairs", glPrefix: "4730" },
      { code: "FAC_SECURITY", label: "Security", glPrefix: "4740" },
      { code: "FAC_OTHER", label: "Facilities - Other", glPrefix: "4790" },
    ],
  },
  {
    code: "EMPLOYEE", label: "Employee Benefits", icon: "Heart", color: "#f43f5e",
    subcategories: [
      { code: "EMP_INSURANCE", label: "Insurance", glPrefix: "4810" },
      { code: "EMP_WELLNESS", label: "Health & Wellness", glPrefix: "4820" },
      { code: "EMP_RELOCATION", label: "Relocation", glPrefix: "4830" },
      { code: "EMP_EDUCATION", label: "Education Assistance", glPrefix: "4840" },
      { code: "EMP_OTHER", label: "Benefits - Other", glPrefix: "4890" },
    ],
  },
  {
    code: "MISC", label: "Miscellaneous", icon: "MoreHorizontal", color: "#78716c",
    subcategories: [
      { code: "MISC_DUES", label: "Dues & Memberships", glPrefix: "4910" },
      { code: "MISC_BOOKS", label: "Books & Publications", glPrefix: "4920" },
      { code: "MISC_CHARITY", label: "Charitable Donations", glPrefix: "4930" },
      { code: "MISC_BANK", label: "Bank Charges & Fees", glPrefix: "4940" },
      { code: "MISC_OTHER", label: "Miscellaneous", glPrefix: "4990" },
    ],
  },
];

// Flat list of all subcategory labels for quick access
export const ALL_EXPENSE_SUBCATEGORIES = EXPENSE_CATEGORIES.flatMap((cat) =>
  cat.subcategories.map((sub) => ({ ...sub, parentCode: cat.code, parentLabel: cat.label }))
);

// Demo credentials
export const DEMO_USERS = [
  { email: "admin@corpcardpro.com", password: "admin123", role: "SYSTEM_ADMIN", name: "Rajesh Kumar" },
  { email: "company@corpcardpro.com", password: "company123", role: "COMPANY_ADMIN", name: "Priya Sharma" },
  { email: "finance@corpcardpro.com", password: "finance123", role: "FINANCE_CONTROLLER", name: "Arun Patel" },
  { email: "manager@corpcardpro.com", password: "manager123", role: "DEPT_MANAGER", name: "Deepa Nair" },
  { email: "employee@corpcardpro.com", password: "employee123", role: "EMPLOYEE", name: "Vikram Singh" },
  { email: "auditor@corpcardpro.com", password: "auditor123", role: "AUDITOR", name: "Kavitha Reddy" },
];
