// =============================================================================
// Mutable Server-Side In-Memory Data Store
// =============================================================================
// Singleton store that holds all entity data in-memory.
// Initializes with demo data, supports CRUD, bulk import, and reset.
// Stats and analytics are COMPUTED from actual data, never hardcoded.
// Module-level state persists for the lifetime of the Node.js process.
// =============================================================================

import { generateId } from "./utils";
import {
  demoEnterprises,
  demoCompanies,
  demoDivisions,
  demoDepartments,
  demoCostCenters,
  demoEmployees,
  demoCards,
  demoTransactions,
  demoExpenses,
  demoExpenseReports,
  demoApprovals,
  demoPolicies,
  doaAuthorityLevels as demoDoaAuthorityLevels,
  doaApprovalMatrix as demoDoaApprovalMatrix,
} from "./demo-data";

// =============================================================================
// Type Definitions
// =============================================================================

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

// -- Store aggregate --

export interface Store {
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
  doaAuthorityLevels: DoaAuthorityLevel[];
  doaApprovalMatrix: DoaApprovalRule[];
}

// =============================================================================
// Deep Clone Helper
// =============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// Build Initial Store from Demo Data
// =============================================================================

function buildInitialStore(): Store {
  return {
    enterprises: deepClone(demoEnterprises) as Enterprise[],
    companies: deepClone(demoCompanies) as Company[],
    divisions: deepClone(demoDivisions) as Division[],
    departments: deepClone(demoDepartments) as Department[],
    costCenters: deepClone(demoCostCenters) as CostCenter[],
    employees: deepClone(demoEmployees) as Employee[],
    cards: deepClone(demoCards) as Card[],
    transactions: deepClone(demoTransactions) as Transaction[],
    expenses: deepClone(demoExpenses) as Expense[],
    expenseReports: deepClone(demoExpenseReports) as ExpenseReport[],
    approvals: deepClone(demoApprovals) as Approval[],
    policies: deepClone(demoPolicies) as Policy[],
    doaAuthorityLevels: deepClone(demoDoaAuthorityLevels) as DoaAuthorityLevel[],
    doaApprovalMatrix: deepClone(demoDoaApprovalMatrix) as DoaApprovalRule[],
  };
}

// =============================================================================
// Singleton Module-Level State
// =============================================================================

let store: Store = buildInitialStore();

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
  return expense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const idx = store.expenses.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  store.expenses[idx] = { ...store.expenses[idx], ...updates, id };
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
// Hierarchy (nested view + generic add/import — backward compatible)
// =============================================================================

export function getHierarchy() {
  return {
    enterprises: store.enterprises.map((ent) => ({
      ...ent,
      companies: store.companies
        .filter((c) => c.enterpriseId === ent.id)
        .map((comp) => ({
          ...comp,
          divisions: store.divisions
            .filter((d) => d.companyId === comp.id)
            .map((div) => ({
              ...div,
              departments: store.departments.filter((dept) => dept.divisionId === div.id),
            })),
        })),
    })),
    costCenters: store.costCenters,
    doaAuthorityLevels: store.doaAuthorityLevels,
    doaApprovalMatrix: store.doaApprovalMatrix,
    hierarchySpend: getAnalytics().hierarchySpend,
  };
}

export function addHierarchyNode(data: {
  type: "enterprise" | "company" | "division" | "department" | "costCenter";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  record: any;
}) {
  switch (data.type) {
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
    type: "enterprise" | "company" | "division" | "department" | "costCenter";
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
