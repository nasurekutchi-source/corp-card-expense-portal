import "reflect-metadata";
import { DataSource } from "typeorm";

// TypeORM DataSource for Oracle 23ai (Oracle Cloud Free Tier)
// Uses oracledb thin mode (pure JavaScript, no Oracle Client needed)

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const connectionString = process.env.ORACLE_CONNECTION_STRING;
  const username = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;

  if (!connectionString || !username || !password) {
    console.warn(
      "Oracle DB credentials not configured. Running in demo mode with in-memory data."
    );
    // Return a mock datasource indicator — app will use demo data
    return null as unknown as DataSource;
  }

  dataSource = new DataSource({
    type: "oracle",
    connectString: connectionString,
    username,
    password,
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
    entities: [], // Will be populated when entities are loaded
    extra: {
      // oracledb thin mode settings
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    },
  });

  await dataSource.initialize();
  console.log("Oracle Database connection established");
  return dataSource;
}

// Check if DB is connected
export function isDbConnected(): boolean {
  return dataSource !== null && dataSource.isInitialized;
}
