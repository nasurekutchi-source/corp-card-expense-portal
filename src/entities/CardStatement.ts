import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("CARD_STATEMENTS")
export class CardStatementEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "CARD_ID", type: "varchar2", length: 50 })
  cardId!: string;

  @Column({ name: "CARD_LAST4", type: "varchar2", length: 4 })
  cardLast4!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ name: "COMPANY_ID", type: "varchar2", length: 50 })
  companyId!: string;

  @Column({ name: "STATEMENT_PERIOD", type: "varchar2", length: 30 })
  statementPeriod!: string;

  @Column({ name: "OPENING_BALANCE", type: "number", precision: 15, scale: 2, default: 0 })
  openingBalance!: number;

  @Column({ name: "CLOSING_BALANCE", type: "number", precision: 15, scale: 2, default: 0 })
  closingBalance!: number;

  @Column({ name: "TOTAL_DEBITS", type: "number", precision: 15, scale: 2, default: 0 })
  totalDebits!: number;

  @Column({ name: "TOTAL_CREDITS", type: "number", precision: 15, scale: 2, default: 0 })
  totalCredits!: number;

  @Column({ name: "MINIMUM_DUE", type: "number", precision: 15, scale: 2, default: 0 })
  minimumDue!: number;

  @Column({ name: "DUE_DATE", type: "varchar2", length: 30 })
  dueDate!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ name: "TRANSACTION_COUNT", type: "number", precision: 10, default: 0 })
  transactionCount!: number;

  @Column({ name: "GENERATED_AT", type: "varchar2", length: 30 })
  generatedAt!: string;

  @Column({ name: "PDF_URL", type: "varchar2", length: 500, nullable: true })
  pdfUrl!: string | null;
}
