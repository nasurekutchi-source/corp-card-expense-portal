import "reflect-metadata";
import { DataSource } from "typeorm";
import * as entities from "@/entities";

let dataSource: DataSource | null = null;
let initPromise: Promise<DataSource | null> | null = null;

export function isDbConfigured(): boolean {
  const cs = process.env.ORACLE_CONNECTION_STRING;
  const u = process.env.ORACLE_USER;
  const p = process.env.ORACLE_PASSWORD;
  return !!(cs && u && p);
}

export async function getDataSource(): Promise<DataSource | null> {
  if (!isDbConfigured()) {
    return null;
  }

  if (dataSource?.isInitialized) {
    return dataSource;
  }

  // Prevent concurrent initialization (Next.js calls multiple routes in parallel)
  if (!initPromise) {
    initPromise = initializeDataSource();
  }

  try {
    dataSource = await initPromise;
    return dataSource;
  } catch (error) {
    console.error("Oracle connection failed, falling back to in-memory store:", error);
    initPromise = null;
    return null;
  }
}

async function initializeDataSource(): Promise<DataSource | null> {
  try {
    const ds = new DataSource({
      type: "oracle",
      connectString: process.env.ORACLE_CONNECTION_STRING,
      username: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      synchronize: process.env.NODE_ENV === "development",
      logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
      entities: Object.values(entities).filter(
        (e) => typeof e === "function" && e.name.endsWith("Entity")
      ),
      extra: {
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 60,
      },
    });

    await ds.initialize();
    console.log("Oracle Database connection established (thin mode)");

    // Auto-seed if tables are empty
    try {
      const { BankInstitutionEntity } = entities;
      const count = await ds.getRepository(BankInstitutionEntity).count();
      if (count === 0) {
        console.log("Empty database detected — auto-seeding demo data...");
        await seedDemoData(ds);
        console.log("Demo data seeded successfully");
      }
    } catch (seedErr) {
      console.warn("Auto-seed check failed (tables may not exist yet):", seedErr);
    }

    return ds;
  } catch (error) {
    console.error("Failed to initialize Oracle DataSource:", error);
    return null;
  }
}

async function seedDemoData(ds: DataSource): Promise<void> {
  // Dynamic import to avoid loading demo data unless needed
  const demoData = await import("./demo-data");

  const saveAll = async (EntityClass: any, data: any[]) => {
    if (!data || data.length === 0) return;
    const repo = ds.getRepository(EntityClass);
    // Save in chunks of 50 to avoid Oracle bind variable limits
    for (let i = 0; i < data.length; i += 50) {
      const chunk = data.slice(i, i + 50);
      await repo.save(chunk.map((item: any) => repo.create(item)));
    }
  };

  // Seed in dependency order
  await saveAll(entities.BankInstitutionEntity, demoData.demoBankInstitutions);
  await saveAll(entities.ProgramEntity, demoData.demoPrograms);
  await saveAll(entities.CompanyEntity, demoData.demoCompanies);
  await saveAll(entities.DivisionEntity, demoData.demoDivisions);
  await saveAll(entities.DepartmentEntity, demoData.demoDepartments);
  await saveAll(entities.CostCenterEntity, demoData.demoCostCenters);
  await saveAll(entities.EmployeeEntity, demoData.demoEmployees);
  await saveAll(entities.CardEntity, demoData.demoCards);
  await saveAll(entities.TransactionEntity, demoData.demoTransactions);
  await saveAll(entities.PolicyEntity, demoData.demoPolicies);
  await saveAll(entities.CardControlPolicyEntity, demoData.demoCardControlPolicies);
  await saveAll(entities.DoaAuthorityLevelEntity, demoData.doaAuthorityLevels);
  await saveAll(entities.DoaApprovalRuleEntity, demoData.doaApprovalMatrix);
  await saveAll(entities.CardStatementEntity, demoData.demoCardStatements);
  await saveAll(entities.CorporateStatementEntity, demoData.demoCorporateStatements);
  await saveAll(entities.PaymentCycleEntity, demoData.demoPaymentCycles);
  await saveAll(entities.PaymentApportionmentEntity, demoData.demoPaymentApportionments);
  await saveAll(entities.WorkflowRequestEntity, demoData.demoWorkflowRequests);
  await saveAll(entities.DisputeEntity, demoData.demoDisputes);
  await saveAll(entities.DetectedSubscriptionEntity, demoData.demoDetectedSubscriptions);
  await saveAll(entities.ScheduledCardActionEntity, demoData.demoScheduledCardActions);
}

export function isDbConnected(): boolean {
  return dataSource !== null && dataSource.isInitialized;
}
