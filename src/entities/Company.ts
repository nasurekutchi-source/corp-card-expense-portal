import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("COMPANIES")
export class CompanyEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ name: "LEGAL_NAME", type: "varchar2", length: 300 })
  legalName!: string;

  @Column({ type: "varchar2", length: 20 })
  gstin!: string;

  @Column({ type: "varchar2", length: 15 })
  pan!: string;

  @Column({ type: "varchar2", length: 25 })
  cin!: string;

  @Column({ name: "BASE_CURRENCY", type: "varchar2", length: 5, default: "'INR'" })
  baseCurrency!: string;

  @Column({ name: "ENTERPRISE_ID", type: "varchar2", length: 50 })
  enterpriseId!: string;

  @Column({ name: "PROGRAM_ID", type: "varchar2", length: 50 })
  programId!: string;
}
