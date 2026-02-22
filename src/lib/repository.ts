// =============================================================================
// Dual-Mode Repository Layer
// =============================================================================
// Routes to Oracle (TypeORM) when available, falls back to in-memory store.
// All functions are async to support database operations.
// =============================================================================

import { getDataSource } from "./db";
import * as store from "./store";
import * as entities from "@/entities";
import { DataSource, Repository } from "typeorm";

// Re-export types from store (they're the same regardless of backend)
export type {
  BankInstitution, Program, Enterprise, Company, Division, Department,
  CostCenter, Employee, Card, Transaction, Expense, ExpenseReport,
  Approval, Policy, CardControlPolicy, DoaAuthorityLevel, DoaApprovalRule,
  ApprovalChainRule, CardStatement, CorporateStatement, PaymentCycle,
  PaymentApportionment, WorkflowRequest, Dispute, DetectedSubscription,
  ScheduledCardAction, Receipt, Reimbursement, AuditLogEntry, GstinRecord,
  PaymentProfile, ExpenseCategoryConfig, ModuleConfig,
  DashboardStats, Analytics, EmployeeDashboardData,
  CardFilters, TransactionFilters, EmployeeFilters, ExpenseFilters,
  ExpenseReportFilters, ApprovalFilters, EscalationConfig,
  SpendLimits, GstDetails, TransactionLocation,
  Store, ExpenseCategorySubcategory,
} from "./store";

// =============================================================================
// Helper: Get TypeORM repository or null
// =============================================================================

async function getRepo<T extends object>(
  EntityClass: new () => T
): Promise<{ ds: DataSource; repo: Repository<T> } | null> {
  const ds = await getDataSource();
  if (!ds) return null;
  return { ds, repo: ds.getRepository(EntityClass) };
}

// =============================================================================
// Generic CRUD Factory
// =============================================================================

function createCrud<
  Entity extends object,
  StoreType extends { id: string }
>(
  EntityClass: new () => Entity,
  storeFns: {
    getAll: (...args: any[]) => StoreType[];
    getOne: (id: string) => StoreType | undefined;
    add: (data: Partial<StoreType>) => StoreType;
    update: (id: string, data: Partial<StoreType>) => StoreType | null;
    remove?: (id: string) => boolean;
  }
) {
  return {
    async getAll(...args: any[]): Promise<StoreType[]> {
      const r = await getRepo(EntityClass);
      if (!r) return storeFns.getAll(...args);
      return r.repo.find() as any;
    },
    async getOne(id: string): Promise<StoreType | undefined> {
      const r = await getRepo(EntityClass);
      if (!r) return storeFns.getOne(id);
      const result = await r.repo.findOneBy({ id } as any);
      return (result ?? undefined) as any;
    },
    async add(data: Partial<StoreType>): Promise<StoreType> {
      const r = await getRepo(EntityClass);
      if (!r) return storeFns.add(data);
      return r.repo.save(r.repo.create(data as any)) as any;
    },
    async update(id: string, updates: Partial<StoreType>): Promise<StoreType | null> {
      const r = await getRepo(EntityClass);
      if (!r) return storeFns.update(id, updates);
      await r.repo.update({ id } as any, updates as any);
      return r.repo.findOneBy({ id } as any) as any;
    },
    async remove(id: string): Promise<boolean> {
      if (!storeFns.remove) return false;
      const r = await getRepo(EntityClass);
      if (!r) return storeFns.remove(id);
      const result = await r.repo.delete({ id } as any);
      return (result.affected ?? 0) > 0;
    },
  };
}

// =============================================================================
// Bank Institutions
// =============================================================================

const bankInstitutionCrud = createCrud(entities.BankInstitutionEntity, {
  getAll: store.getBankInstitutions,
  getOne: store.getBankInstitution,
  add: store.addBankInstitution,
  update: store.updateBankInstitution,
});
export const getBankInstitutions = bankInstitutionCrud.getAll;
export const getBankInstitution = bankInstitutionCrud.getOne;
export const addBankInstitution = bankInstitutionCrud.add;
export const updateBankInstitution = bankInstitutionCrud.update;

// =============================================================================
// Programs
// =============================================================================

const programCrud = createCrud(entities.ProgramEntity, {
  getAll: store.getPrograms,
  getOne: store.getProgram,
  add: store.addProgram,
  update: store.updateProgram,
});
export const getPrograms = programCrud.getAll;
export const getProgram = programCrud.getOne;
export const addProgram = programCrud.add;
export const updateProgram = programCrud.update;

// =============================================================================
// Enterprises
// =============================================================================

const enterpriseCrud = createCrud(entities.BankInstitutionEntity, {
  getAll: store.getEnterprises,
  getOne: store.getEnterprise,
  add: store.addEnterprise,
  update: store.updateEnterprise,
  remove: store.deleteEnterprise,
});
export const getEnterprises = enterpriseCrud.getAll;
export const getEnterprise = enterpriseCrud.getOne;
export const addEnterprise = enterpriseCrud.add;
export const updateEnterprise = enterpriseCrud.update;
export const deleteEnterprise = enterpriseCrud.remove;

export async function bulkImportEnterprises(items: Partial<store.Enterprise>[]) {
  const ds = await getDataSource();
  if (!ds) return store.bulkImportEnterprises(items);
  // Use store for now — bulk import logic is complex
  return store.bulkImportEnterprises(items);
}

// =============================================================================
// Companies
// =============================================================================

const companyCrud = createCrud(entities.CompanyEntity, {
  getAll: store.getCompanies,
  getOne: store.getCompany,
  add: store.addCompany,
  update: store.updateCompany,
  remove: store.deleteCompany,
});
export const getCompanies = companyCrud.getAll;
export const getCompany = companyCrud.getOne;
export const addCompany = companyCrud.add;
export const updateCompany = companyCrud.update;
export const deleteCompany = companyCrud.remove;
export async function bulkImportCompanies(items: Partial<store.Company>[]) {
  return store.bulkImportCompanies(items);
}

// =============================================================================
// Divisions
// =============================================================================

const divisionCrud = createCrud(entities.DivisionEntity, {
  getAll: store.getDivisions,
  getOne: store.getDivision,
  add: store.addDivision,
  update: store.updateDivision,
  remove: store.deleteDivision,
});
export const getDivisions = divisionCrud.getAll;
export const getDivision = divisionCrud.getOne;
export const addDivision = divisionCrud.add;
export const updateDivision = divisionCrud.update;
export const deleteDivision = divisionCrud.remove;
export async function bulkImportDivisions(items: Partial<store.Division>[]) {
  return store.bulkImportDivisions(items);
}

// =============================================================================
// Departments
// =============================================================================

const departmentCrud = createCrud(entities.DepartmentEntity, {
  getAll: store.getDepartments,
  getOne: store.getDepartment,
  add: store.addDepartment,
  update: store.updateDepartment,
  remove: store.deleteDepartment,
});
export const getDepartments = departmentCrud.getAll;
export const getDepartment = departmentCrud.getOne;
export const addDepartment = departmentCrud.add;
export const updateDepartment = departmentCrud.update;
export const deleteDepartment = departmentCrud.remove;
export async function bulkImportDepartments(items: Partial<store.Department>[]) {
  return store.bulkImportDepartments(items);
}

// =============================================================================
// Cost Centers
// =============================================================================

const costCenterCrud = createCrud(entities.CostCenterEntity, {
  getAll: store.getCostCenters,
  getOne: store.getCostCenter,
  add: store.addCostCenter,
  update: store.updateCostCenter,
  remove: store.deleteCostCenter,
});
export const getCostCenters = costCenterCrud.getAll;
export const getCostCenter = costCenterCrud.getOne;
export const addCostCenter = costCenterCrud.add;
export const updateCostCenter = costCenterCrud.update;
export const deleteCostCenter = costCenterCrud.remove;
export async function bulkImportCostCenters(items: Partial<store.CostCenter>[]) {
  return store.bulkImportCostCenters(items);
}

// =============================================================================
// Employees
// =============================================================================

export async function getEmployees(filters?: store.EmployeeFilters): Promise<store.Employee[]> {
  const r = await getRepo(entities.EmployeeEntity);
  if (!r) return store.getEmployees(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("e");
  if (filters.status) qb = qb.andWhere("e.status = :status", { status: filters.status });
  if (filters.departmentId) qb = qb.andWhere("e.departmentId = :deptId", { deptId: filters.departmentId });
  if (filters.level) qb = qb.andWhere("e.level = :level", { level: filters.level });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(e.firstName) LIKE :s OR LOWER(e.lastName) LIKE :s OR LOWER(e.email) LIKE :s OR LOWER(e.employeeNumber) LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const employeeCrud = createCrud(entities.EmployeeEntity, {
  getAll: store.getEmployees,
  getOne: store.getEmployee,
  add: store.addEmployee,
  update: store.updateEmployee,
  remove: store.deleteEmployee,
});
export const getEmployee = employeeCrud.getOne;
export const addEmployee = employeeCrud.add;
export const updateEmployee = employeeCrud.update;
export const deleteEmployee = employeeCrud.remove;

export async function getEmployeeById(id: string) {
  const emp = await getEmployee(id);
  return emp ?? null;
}
export async function getEmployeeByEmail(email: string) {
  const r = await getRepo(entities.EmployeeEntity);
  if (!r) return store.getEmployeeByEmail(email);
  return r.repo.findOneBy({ email } as any) as any;
}
export async function bulkImportEmployees(items: Partial<store.Employee>[]) {
  return store.bulkImportEmployees(items);
}

// =============================================================================
// Cards
// =============================================================================

export async function getCards(filters?: store.CardFilters): Promise<store.Card[]> {
  const r = await getRepo(entities.CardEntity);
  if (!r) return store.getCards(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("c");
  if (filters.status) qb = qb.andWhere("c.status = :status", { status: filters.status });
  if (filters.employeeId) qb = qb.andWhere("c.employeeId = :empId", { empId: filters.employeeId });
  if (filters.type) qb = qb.andWhere("c.type = :type", { type: filters.type });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(c.employeeName) LIKE :s OR c.last4Digits LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const cardCrud = createCrud(entities.CardEntity, {
  getAll: store.getCards,
  getOne: store.getCard,
  add: store.addCard,
  update: store.updateCard,
  remove: store.deleteCard,
});
export const getCard = cardCrud.getOne;
export const addCard = cardCrud.add;
export const updateCard = cardCrud.update;
export const deleteCard = cardCrud.remove;

export async function getCardById(id: string) {
  const card = await getCard(id);
  return card ?? null;
}
export async function getCardsByEmployee(employeeId: string) {
  const r = await getRepo(entities.CardEntity);
  if (!r) return store.getCardsByEmployee(employeeId);
  return r.repo.findBy({ employeeId } as any) as any;
}
export async function bulkImportCards(items: Partial<store.Card>[]) {
  return store.bulkImportCards(items);
}

// =============================================================================
// Transactions
// =============================================================================

export async function getTransactions(filters?: store.TransactionFilters): Promise<store.Transaction[]> {
  const r = await getRepo(entities.TransactionEntity);
  if (!r) return store.getTransactions(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("t");
  if (filters.status) qb = qb.andWhere("t.status = :status", { status: filters.status });
  if (filters.employeeId) qb = qb.andWhere("t.employeeId = :empId", { empId: filters.employeeId });
  if (filters.cardId) qb = qb.andWhere("t.cardId = :cardId", { cardId: filters.cardId });
  if (filters.category) qb = qb.andWhere("t.mccCategory = :cat", { cat: filters.category });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(t.merchantName) LIKE :s OR LOWER(t.employeeName) LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const transactionCrud = createCrud(entities.TransactionEntity, {
  getAll: store.getTransactions,
  getOne: store.getTransaction,
  add: store.addTransaction,
  update: store.updateTransaction,
  remove: store.deleteTransaction,
});
export const getTransaction = transactionCrud.getOne;
export const addTransaction = transactionCrud.add;
export const updateTransaction = transactionCrud.update;
export const deleteTransaction = transactionCrud.remove;

export async function getTransactionsByCard(cardId: string) {
  const r = await getRepo(entities.TransactionEntity);
  if (!r) return store.getTransactionsByCard(cardId);
  return r.repo.findBy({ cardId } as any) as any;
}
export async function getTransactionsByEmployee(employeeId: string) {
  const r = await getRepo(entities.TransactionEntity);
  if (!r) return store.getTransactionsByEmployee(employeeId);
  return r.repo.findBy({ employeeId } as any) as any;
}
export async function bulkImportTransactions(items: Partial<store.Transaction>[]) {
  return store.bulkImportTransactions(items);
}

// =============================================================================
// Expenses
// =============================================================================

export async function getExpenses(filters?: store.ExpenseFilters): Promise<store.Expense[]> {
  const r = await getRepo(entities.ExpenseEntity);
  if (!r) return store.getExpenses(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("e");
  if (filters.employeeId) qb = qb.andWhere("e.employeeId = :empId", { empId: filters.employeeId });
  if (filters.category) qb = qb.andWhere("e.category = :cat", { cat: filters.category });
  if (filters.policyStatus) qb = qb.andWhere("e.policyStatus = :ps", { ps: filters.policyStatus });
  if (filters.type) qb = qb.andWhere("e.type = :type", { type: filters.type });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(e.merchantName) LIKE :s OR LOWER(e.employeeName) LIKE :s OR LOWER(e.category) LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const expenseCrud = createCrud(entities.ExpenseEntity, {
  getAll: store.getExpenses,
  getOne: store.getExpense,
  add: store.addExpense,
  update: store.updateExpense,
  remove: store.deleteExpense,
});
export const getExpense = expenseCrud.getOne;
export const addExpense = expenseCrud.add;
export const updateExpense = expenseCrud.update;
export const deleteExpense = expenseCrud.remove;

export async function getExpensesByEmployee(employeeId: string) {
  return getExpenses({ employeeId });
}
export async function bulkImportExpenses(items: Partial<store.Expense>[]) {
  return store.bulkImportExpenses(items);
}

// =============================================================================
// Expense Reports
// =============================================================================

export async function getExpenseReports(filters?: store.ExpenseReportFilters): Promise<store.ExpenseReport[]> {
  const r = await getRepo(entities.ExpenseReportEntity);
  if (!r) return store.getExpenseReports(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("er");
  if (filters.status) qb = qb.andWhere("er.status = :status", { status: filters.status });
  if (filters.employeeId) qb = qb.andWhere("er.employeeId = :empId", { empId: filters.employeeId });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(er.reportNumber) LIKE :s OR LOWER(er.employeeName) LIKE :s OR LOWER(er.title) LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const expenseReportCrud = createCrud(entities.ExpenseReportEntity, {
  getAll: store.getExpenseReports,
  getOne: store.getExpenseReport,
  add: store.addExpenseReport,
  update: store.updateExpenseReport,
  remove: store.deleteExpenseReport,
});
export const getExpenseReport = expenseReportCrud.getOne;
export const addExpenseReport = expenseReportCrud.add;
export const updateExpenseReport = expenseReportCrud.update;
export const deleteExpenseReport = expenseReportCrud.remove;

export async function getExpenseReportsByEmployee(employeeId: string) {
  return getExpenseReports({ employeeId });
}
export async function bulkImportExpenseReports(items: Partial<store.ExpenseReport>[]) {
  return store.bulkImportExpenseReports(items);
}

// =============================================================================
// Approvals
// =============================================================================

export async function getApprovals(filters?: store.ApprovalFilters): Promise<store.Approval[]> {
  const r = await getRepo(entities.ApprovalEntity);
  if (!r) return store.getApprovals(filters);
  if (!filters) return r.repo.find() as any;

  let qb = r.repo.createQueryBuilder("a");
  if (filters.status) qb = qb.andWhere("a.status = :status", { status: filters.status });
  if (filters.search) {
    qb = qb.andWhere(
      "(LOWER(a.employeeName) LIKE :s OR LOWER(a.reportNumber) LIKE :s)",
      { s: `%${filters.search.toLowerCase()}%` }
    );
  }
  return qb.getMany() as any;
}

const approvalCrud = createCrud(entities.ApprovalEntity, {
  getAll: store.getApprovals,
  getOne: store.getApproval,
  add: store.addApproval,
  update: store.updateApproval as any,
  remove: store.deleteApproval,
});
export const getApproval = approvalCrud.getOne;
export const addApproval = approvalCrud.add;
export const deleteApproval = approvalCrud.remove;

export async function getPendingApprovals() {
  return getApprovals({ status: "PENDING" });
}

// updateApproval has special logic (updates expense report status too)
export async function updateApproval(
  id: string,
  updates: { status: string; comment?: string; reviewedBy?: string },
  comment?: string
) {
  // Use store for complex approval logic (cascading status updates)
  // Merge comment into updates if provided separately
  const data = comment ? { ...updates, comment } : updates;
  return store.updateApproval(id, data);
}

// =============================================================================
// Policies
// =============================================================================

const policyCrud = createCrud(entities.PolicyEntity, {
  getAll: store.getPolicies,
  getOne: store.getPolicy,
  add: store.addPolicy,
  update: store.updatePolicy,
  remove: store.deletePolicy,
});
export const getPolicies = policyCrud.getAll;
export const getPolicy = policyCrud.getOne;
export const addPolicy = policyCrud.add;
export const updatePolicy = policyCrud.update;
export const deletePolicy = policyCrud.remove;

export async function getActivePolicies() {
  const r = await getRepo(entities.PolicyEntity);
  if (!r) return store.getActivePolicies();
  return r.repo.findBy({ isActive: true as any }) as any;
}
export async function bulkImportPolicies(items: Partial<store.Policy>[]) {
  return store.bulkImportPolicies(items);
}

// =============================================================================
// Card Control Policies
// =============================================================================

const cardControlPolicyCrud = createCrud(entities.CardControlPolicyEntity, {
  getAll: store.getCardControlPolicies,
  getOne: store.getCardControlPolicy,
  add: store.addCardControlPolicy,
  update: store.updateCardControlPolicy,
  remove: store.deleteCardControlPolicy,
});
export const getCardControlPolicies = cardControlPolicyCrud.getAll;
export const getCardControlPolicy = cardControlPolicyCrud.getOne;
export const addCardControlPolicy = cardControlPolicyCrud.add;
export const updateCardControlPolicy = cardControlPolicyCrud.update;
export const deleteCardControlPolicy = cardControlPolicyCrud.remove;

export async function getCardControlPolicyByNode(nodeId: string) {
  const r = await getRepo(entities.CardControlPolicyEntity);
  if (!r) return store.getCardControlPolicyByNode(nodeId);
  return r.repo.findOneBy({ nodeId } as any) as any;
}

// Complex function — use store
export function getEffectiveCardControlPolicy(
  nodeId: string,
  nodeType: "company" | "division" | "department"
) {
  return store.getEffectiveCardControlPolicy(nodeId, nodeType);
}

// =============================================================================
// DOA Authority Levels
// =============================================================================

const doaAuthorityLevelCrud = createCrud(entities.DoaAuthorityLevelEntity, {
  getAll: store.getDoaAuthorityLevels,
  getOne: store.getDoaAuthorityLevel,
  add: store.addDoaAuthorityLevel,
  update: store.updateDoaAuthorityLevel,
  remove: store.deleteDoaAuthorityLevel,
});
export const getDoaAuthorityLevels = doaAuthorityLevelCrud.getAll;
export const getDoaAuthorityLevel = doaAuthorityLevelCrud.getOne;
export const addDoaAuthorityLevel = doaAuthorityLevelCrud.add;
export const updateDoaAuthorityLevel = doaAuthorityLevelCrud.update;
export const deleteDoaAuthorityLevel = doaAuthorityLevelCrud.remove;

// =============================================================================
// DOA Approval Matrix
// =============================================================================

const doaApprovalRuleCrud = createCrud(entities.DoaApprovalRuleEntity, {
  getAll: store.getDoaApprovalMatrix,
  getOne: store.getDoaApprovalRule,
  add: store.addDoaApprovalRule,
  update: store.updateDoaApprovalRule,
  remove: store.deleteDoaApprovalRule,
});
export const getDoaApprovalMatrix = doaApprovalRuleCrud.getAll;
export const getDoaApprovalRule = doaApprovalRuleCrud.getOne;
export const addDoaApprovalRule = doaApprovalRuleCrud.add;
export const updateDoaApprovalRule = doaApprovalRuleCrud.update;
export const deleteDoaApprovalRule = doaApprovalRuleCrud.remove;

// =============================================================================
// Approval Chain Rules
// =============================================================================

const approvalChainRuleCrud = createCrud(entities.ApprovalChainRuleEntity, {
  getAll: store.getApprovalChainRules,
  getOne: store.getApprovalChainRule,
  add: store.addApprovalChainRule,
  update: store.updateApprovalChainRule,
  remove: store.deleteApprovalChainRule,
});
export const getApprovalChainRules = approvalChainRuleCrud.getAll;
export const getApprovalChainRule = approvalChainRuleCrud.getOne;
export const addApprovalChainRule = approvalChainRuleCrud.add;
export const updateApprovalChainRule = approvalChainRuleCrud.update;
export const deleteApprovalChainRule = approvalChainRuleCrud.remove;

// =============================================================================
// Card Statements
// =============================================================================

const cardStatementCrud = createCrud(entities.CardStatementEntity, {
  getAll: store.getCardStatements,
  getOne: store.getCardStatement,
  add: store.addCardStatement,
  update: store.updateCardStatement,
});
export const getCardStatements = cardStatementCrud.getAll;
export const getCardStatement = cardStatementCrud.getOne;
export const addCardStatement = cardStatementCrud.add;
export const updateCardStatement = cardStatementCrud.update;

// =============================================================================
// Corporate Statements
// =============================================================================

const corporateStatementCrud = createCrud(entities.CorporateStatementEntity, {
  getAll: store.getCorporateStatements,
  getOne: store.getCorporateStatement,
  add: store.addCorporateStatement,
  update: store.updateCorporateStatement,
});
export const getCorporateStatements = corporateStatementCrud.getAll;
export const getCorporateStatement = corporateStatementCrud.getOne;
export const addCorporateStatement = corporateStatementCrud.add;
export const updateCorporateStatement = corporateStatementCrud.update;

// =============================================================================
// Payment Cycles
// =============================================================================

const paymentCycleCrud = createCrud(entities.PaymentCycleEntity, {
  getAll: store.getPaymentCycles,
  getOne: store.getPaymentCycle,
  add: store.addPaymentCycle,
  update: store.updatePaymentCycle,
});
export const getPaymentCycles = paymentCycleCrud.getAll;
export const getPaymentCycle = paymentCycleCrud.getOne;
export const addPaymentCycle = paymentCycleCrud.add;
export const updatePaymentCycle = paymentCycleCrud.update;

// =============================================================================
// Payment Apportionments
// =============================================================================

const paymentApportionmentCrud = createCrud(entities.PaymentApportionmentEntity, {
  getAll: store.getPaymentApportionments,
  getOne: store.getPaymentApportionment,
  add: store.addPaymentApportionment,
  update: store.updatePaymentApportionment,
});
export const getPaymentApportionments = paymentApportionmentCrud.getAll;
export const getPaymentApportionment = paymentApportionmentCrud.getOne;
export const addPaymentApportionment = paymentApportionmentCrud.add;
export const updatePaymentApportionment = paymentApportionmentCrud.update;

// =============================================================================
// Workflow Requests
// =============================================================================

const workflowRequestCrud = createCrud(entities.WorkflowRequestEntity, {
  getAll: store.getWorkflowRequests,
  getOne: store.getWorkflowRequest,
  add: store.addWorkflowRequest,
  update: store.updateWorkflowRequest,
});
export const getWorkflowRequests = workflowRequestCrud.getAll;
export const getWorkflowRequest = workflowRequestCrud.getOne;
export const addWorkflowRequest = workflowRequestCrud.add;
export const updateWorkflowRequest = workflowRequestCrud.update;

// Complex workflow functions — delegate to store
export async function approveWorkflowStep(id: string, approverName: string, comment?: string) {
  return store.approveWorkflowStep(id, approverName, comment);
}
export async function rejectWorkflowStep(id: string, approverName: string, comment?: string) {
  return store.rejectWorkflowStep(id, approverName, comment);
}

// =============================================================================
// Disputes
// =============================================================================

const disputeCrud = createCrud(entities.DisputeEntity, {
  getAll: store.getDisputes,
  getOne: store.getDispute,
  add: store.addDispute,
  update: store.updateDispute,
});
export const getDisputes = disputeCrud.getAll;
export const getDispute = disputeCrud.getOne;
export const addDispute = disputeCrud.add;
export const updateDispute = disputeCrud.update;

// =============================================================================
// Detected Subscriptions
// =============================================================================

const detectedSubscriptionCrud = createCrud(entities.DetectedSubscriptionEntity, {
  getAll: store.getDetectedSubscriptions,
  getOne: store.getDetectedSubscription,
  add: store.addDetectedSubscription,
  update: store.updateDetectedSubscription,
});
export const getDetectedSubscriptions = detectedSubscriptionCrud.getAll;
export const getDetectedSubscription = detectedSubscriptionCrud.getOne;
export const addDetectedSubscription = detectedSubscriptionCrud.add;
export const updateDetectedSubscription = detectedSubscriptionCrud.update;

// =============================================================================
// Scheduled Card Actions
// =============================================================================

const scheduledCardActionCrud = createCrud(entities.ScheduledCardActionEntity, {
  getAll: store.getScheduledCardActions,
  getOne: store.getScheduledCardAction,
  add: store.addScheduledCardAction,
  update: store.updateScheduledCardAction,
  remove: store.deleteScheduledCardAction,
});
export const getScheduledCardActions = scheduledCardActionCrud.getAll;
export const getScheduledCardAction = scheduledCardActionCrud.getOne;
export const addScheduledCardAction = scheduledCardActionCrud.add;
export const updateScheduledCardAction = scheduledCardActionCrud.update;
export const deleteScheduledCardAction = scheduledCardActionCrud.remove;

// =============================================================================
// Receipts
// =============================================================================

const receiptCrud = createCrud(entities.ReceiptEntity, {
  getAll: store.getReceipts,
  getOne: store.getReceipt,
  add: store.addReceipt,
  update: () => null, // no update in store
  remove: store.deleteReceipt,
});
export const getReceipt = receiptCrud.getOne;
export const addReceipt = receiptCrud.add;
export const deleteReceipt = receiptCrud.remove;

export async function getReceipts(expenseId?: string): Promise<store.Receipt[]> {
  const r = await getRepo(entities.ReceiptEntity);
  if (!r) return store.getReceipts(expenseId);
  if (expenseId) return r.repo.findBy({ expenseId } as any) as any;
  return r.repo.find() as any;
}

export async function linkReceiptToExpense(receiptId: string, expenseId: string) {
  const r = await getRepo(entities.ReceiptEntity);
  if (!r) return store.linkReceiptToExpense(receiptId, expenseId);
  await r.repo.update({ id: receiptId } as any, { expenseId } as any);
  return r.repo.findOneBy({ id: receiptId } as any) as any;
}

// =============================================================================
// Reimbursements
// =============================================================================

const reimbursementCrud = createCrud(entities.ReimbursementEntity, {
  getAll: store.getReimbursements,
  getOne: store.getReimbursement,
  add: store.addReimbursement,
  update: store.updateReimbursement,
});
export const getReimbursements = reimbursementCrud.getAll;
export const getReimbursement = reimbursementCrud.getOne;
export const addReimbursement = reimbursementCrud.add;
export const updateReimbursement = reimbursementCrud.update;

// Complex reimbursement state machine — delegate to store
export async function initiateReimbursement(id: string) { return store.initiateReimbursement(id); }
export async function processReimbursement(id: string, paymentRef: string) { return store.processReimbursement(id, paymentRef); }
export async function completeReimbursement(id: string) { return store.completeReimbursement(id); }
export async function failReimbursement(id: string, reason: string) { return store.failReimbursement(id, reason); }

// =============================================================================
// Audit Log
// =============================================================================

export async function getAuditLog(filters?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const r = await getRepo(entities.AuditLogEntryEntity);
  if (!r) return store.getAuditLog(filters);
  if (!filters) return r.repo.find({ order: { timestamp: "DESC" } as any, take: 100 }) as any;

  let qb = r.repo.createQueryBuilder("a");
  if (filters.entityType) qb = qb.andWhere("a.entityType = :et", { et: filters.entityType });
  if (filters.entityId) qb = qb.andWhere("a.entityId = :eid", { eid: filters.entityId });
  if (filters.action) qb = qb.andWhere("a.action = :action", { action: filters.action });
  if (filters.userId) qb = qb.andWhere("a.userId = :uid", { uid: filters.userId });
  qb = qb.orderBy("a.timestamp", "DESC");
  if (filters.limit) qb = qb.take(filters.limit);
  return qb.getMany() as any;
}

export async function addAuditLogEntry(data: {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  changes?: Record<string, { old: any; new: any }> | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string;
}) {
  // Use store (it generates id and timestamp)
  return store.addAuditLogEntry(data);
}

// =============================================================================
// GSTIN Cache
// =============================================================================

export async function getGstinCache() { return store.getGstinCache(); }
export async function lookupGstin(gstin: string) { return store.lookupGstin(gstin); }
export async function addGstinRecord(data: Partial<store.GstinRecord>) { return store.addGstinRecord(data); }
export async function refreshGstinCache() { return store.refreshGstinCache(); }

// =============================================================================
// Payment Profiles
// =============================================================================

const paymentProfileCrud = createCrud(entities.PaymentProfileEntity, {
  getAll: store.getPaymentProfiles,
  getOne: store.getPaymentProfile,
  add: store.addPaymentProfile,
  update: store.updatePaymentProfile,
  remove: store.deletePaymentProfile,
});
export const getPaymentProfile = paymentProfileCrud.getOne;
export const addPaymentProfile = paymentProfileCrud.add;
export const updatePaymentProfile = paymentProfileCrud.update;
export const deletePaymentProfile = paymentProfileCrud.remove;

export async function getPaymentProfiles(employeeId?: string) {
  const r = await getRepo(entities.PaymentProfileEntity);
  if (!r) return store.getPaymentProfiles(employeeId);
  if (employeeId) return r.repo.findBy({ employeeId } as any) as any;
  return r.repo.find() as any;
}

export async function getPrimaryPaymentProfile(employeeId: string) {
  const r = await getRepo(entities.PaymentProfileEntity);
  if (!r) return store.getPrimaryPaymentProfile(employeeId);
  return r.repo.findOneBy({ employeeId, isPrimary: true as any } as any) as any;
}

export async function verifyPaymentProfile(id: string) {
  return store.verifyPaymentProfile(id);
}

// =============================================================================
// Expense Categories
// =============================================================================

export async function getExpenseCategories(activeOnly = false) {
  return store.getExpenseCategories(activeOnly);
}
export async function getExpenseCategory(id: string) {
  return store.getExpenseCategory(id);
}
export async function addExpenseCategory(data: Partial<store.ExpenseCategoryConfig>) {
  return store.addExpenseCategory(data);
}
export async function updateExpenseCategory(id: string, updates: Partial<store.ExpenseCategoryConfig>) {
  return store.updateExpenseCategory(id, updates);
}
export async function deleteExpenseCategory(id: string) {
  return store.deleteExpenseCategory(id);
}
export async function addSubcategory(categoryId: string, sub: store.ExpenseCategorySubcategory) {
  return store.addSubcategory(categoryId, sub);
}
export async function removeSubcategory(categoryId: string, subCode: string) {
  return store.removeSubcategory(categoryId, subCode);
}
export async function reorderExpenseCategories(orderedIds: string[]) {
  return store.reorderExpenseCategories(orderedIds);
}

// =============================================================================
// Module Config
// =============================================================================

export async function getModuleConfig() { return store.getModuleConfig(); }
export async function updateModuleConfig(updates: Partial<store.ModuleConfig>) {
  return store.updateModuleConfig(updates);
}

// =============================================================================
// Escalation Config
// =============================================================================

export async function getEscalationConfig() { return store.getEscalationConfig(); }
export async function updateEscalationConfig(updates: Partial<store.EscalationConfig>) {
  return store.updateEscalationConfig(updates);
}
export async function checkAndEscalateApprovals() { return store.checkAndEscalateApprovals(); }

// =============================================================================
// Complex Computed Functions (always delegate to store)
// =============================================================================

export async function getStore() { return store.getStore(); }
export async function resetStore() { return store.resetStore(); }
export async function exportStore() { return store.exportStore(); }
export async function getStats() { return store.getStats(); }
export async function getAnalytics() { return store.getAnalytics(); }
export async function getEmployeeDashboard(employeeId: string) { return store.getEmployeeDashboard(employeeId); }

// =============================================================================
// Hierarchy (complex — delegate to store)
// =============================================================================

export async function getHierarchy() { return store.getHierarchy(); }
export async function addHierarchyNode(data: {
  type: "bank" | "program" | "enterprise" | "company" | "division" | "department" | "costCenter";
  record: any;
}) {
  return store.addHierarchyNode(data);
}
export async function bulkImportHierarchy(items: any[]) {
  return store.bulkImportHierarchy(items);
}
export async function assignEmployeeToNode(employeeId: string, nodeId: string) {
  return store.assignEmployeeToNode(employeeId, nodeId);
}
export async function bulkAssignEmployeesToNode(employeeIds: string[], nodeId: string) {
  return store.bulkAssignEmployeesToNode(employeeIds, nodeId);
}
export async function findHierarchyNodeByCode(code: string) {
  return store.findHierarchyNodeByCode(code);
}

// =============================================================================
// Duplicate Detection (delegate to store)
// =============================================================================

export async function detectDuplicateExpenses(
  amount: number,
  merchantName: string,
  date: string,
  employeeId?: string,
  excludeId?: string
) {
  return store.detectDuplicateExpenses(amount, merchantName, date, employeeId, excludeId);
}
