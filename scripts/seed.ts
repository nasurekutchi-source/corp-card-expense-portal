/**
 * Seed Script — Populates Oracle 23ai with demo data
 *
 * Usage: docker compose exec web npx tsx scripts/seed.ts
 *
 * Connects directly to Oracle using environment variables and inserts
 * demo data from src/lib/demo-data.ts in dependency order.
 * Skips seeding if data already exists.
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import * as entities from "../src/entities";
import * as demoData from "../src/lib/demo-data";

async function seed() {
  const connectString = process.env.ORACLE_CONNECTION_STRING || "localhost:1521/FREEPDB1";
  const username = process.env.ORACLE_USER || "corpcardpro";
  const password = process.env.ORACLE_PASSWORD || "CorpCard2026";

  console.log(`Connecting to Oracle at ${connectString} as ${username}...`);

  const ds = new DataSource({
    type: "oracle",
    connectString,
    username,
    password,
    synchronize: true,
    logging: ["error", "warn"],
    entities: Object.values(entities).filter(
      (e) => typeof e === "function" && e.name.endsWith("Entity")
    ),
    extra: {
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
    },
  });

  await ds.initialize();
  console.log("Connected to Oracle.");

  // Check if data already exists
  const bankCount = await ds.getRepository(entities.BankInstitutionEntity).count();
  if (bankCount > 0) {
    console.log(`Database already has ${bankCount} bank institutions. Skipping seed.`);
    console.log("To re-seed, truncate tables first.");
    await ds.destroy();
    return;
  }

  console.log("Empty database detected. Seeding demo data...\n");

  const saveAll = async (label: string, EntityClass: any, data: any[]) => {
    if (!data || data.length === 0) {
      console.log(`  ${label}: (no data)`);
      return;
    }
    const repo = ds.getRepository(EntityClass);
    // Save in chunks to avoid Oracle bind variable limits
    for (let i = 0; i < data.length; i += 50) {
      const chunk = data.slice(i, i + 50);
      await repo.save(chunk.map((item: any) => repo.create(item)));
    }
    console.log(`  ${label}: ${data.length} records`);
  };

  // Seed in dependency order
  await saveAll("Bank Institutions", entities.BankInstitutionEntity, demoData.demoBankInstitutions);
  await saveAll("Programs", entities.ProgramEntity, demoData.demoPrograms);
  await saveAll("Companies", entities.CompanyEntity, demoData.demoCompanies);
  await saveAll("Divisions", entities.DivisionEntity, demoData.demoDivisions);
  await saveAll("Departments", entities.DepartmentEntity, demoData.demoDepartments);
  await saveAll("Cost Centers", entities.CostCenterEntity, demoData.demoCostCenters);
  await saveAll("Employees", entities.EmployeeEntity, demoData.demoEmployees);
  await saveAll("Cards", entities.CardEntity, demoData.demoCards);
  await saveAll("Transactions", entities.TransactionEntity, demoData.demoTransactions);
  await saveAll("Policies", entities.PolicyEntity, demoData.demoPolicies);
  await saveAll("Card Controls", entities.CardControlPolicyEntity, demoData.demoCardControlPolicies);
  await saveAll("DOA Authority Levels", entities.DoaAuthorityLevelEntity, demoData.doaAuthorityLevels);
  await saveAll("DOA Approval Rules", entities.DoaApprovalRuleEntity, demoData.doaApprovalMatrix);
  await saveAll("Card Statements", entities.CardStatementEntity, demoData.demoCardStatements);
  await saveAll("Corporate Statements", entities.CorporateStatementEntity, demoData.demoCorporateStatements);
  await saveAll("Payment Cycles", entities.PaymentCycleEntity, demoData.demoPaymentCycles);
  await saveAll("Payment Apportionments", entities.PaymentApportionmentEntity, demoData.demoPaymentApportionments);
  await saveAll("Workflow Requests", entities.WorkflowRequestEntity, demoData.demoWorkflowRequests);
  await saveAll("Disputes", entities.DisputeEntity, demoData.demoDisputes);
  await saveAll("Subscriptions", entities.DetectedSubscriptionEntity, demoData.demoDetectedSubscriptions);
  await saveAll("Scheduled Actions", entities.ScheduledCardActionEntity, demoData.demoScheduledCardActions);

  console.log("\nSeed complete!");
  await ds.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
