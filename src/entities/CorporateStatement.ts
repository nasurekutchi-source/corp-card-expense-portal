import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("CORPORATE_STATEMENTS")
export class CorporateStatementEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "COMPANY_ID", type: "varchar2", length: 50 })
  companyId!: string;

  @Column({ name: "COMPANY_NAME", type: "varchar2", length: 200 })
  companyName!: string;

  @Column({ name: "STATEMENT_PERIOD", type: "varchar2", length: 30 })
  statementPeriod!: string;

  @Column({ name: "TOTAL_CARDS", type: "number", precision: 10, default: 0 })
  totalCards!: number;

  @Column({ name: "TOTAL_TRANSACTIONS", type: "number", precision: 10, default: 0 })
  totalTransactions!: number;

  @Column({ name: "TOTAL_AMOUNT", type: "number", precision: 15, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ name: "TOTAL_GST", type: "number", precision: 15, scale: 2, default: 0 })
  totalGst!: number;

  @Column({ name: "DUE_DATE", type: "varchar2", length: 30 })
  dueDate!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ name: "GENERATED_AT", type: "varchar2", length: 30 })
  generatedAt!: string;

  @Column({ name: "PDF_URL", type: "varchar2", length: 500, nullable: true })
  pdfUrl!: string | null;
}
