import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("REIMBURSEMENTS")
export class ReimbursementEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "varchar2", length: 100, nullable: true })
  department!: string;

  @Column({ name: "EXPENSE_REPORT_ID", type: "varchar2", length: 50 })
  expenseReportId!: string;

  @Column({ name: "REPORT_NUMBER", type: "varchar2", length: 30 })
  reportNumber!: string;

  @Column({ name: "GROSS_AMOUNT", type: "number", precision: 15, scale: 2 })
  grossAmount!: number;

  @Column({ name: "TDS_AMOUNT", type: "number", precision: 15, scale: 2, default: 0 })
  tdsAmount!: number;

  @Column({ name: "NET_AMOUNT", type: "number", precision: 15, scale: 2 })
  netAmount!: number;

  @Column({ type: "varchar2", length: 20, default: "'PENDING'" })
  status!: "PENDING" | "INITIATED" | "PROCESSING" | "PAID" | "FAILED";

  @Column({ name: "PAYMENT_METHOD", type: "varchar2", length: 30, nullable: true })
  paymentMethod!: string;

  @Column({ name: "PAYMENT_REF", type: "varchar2", length: 100, nullable: true })
  paymentRef!: string;

  @Column({ name: "BANK_ACCOUNT", type: "varchar2", length: 50, nullable: true })
  bankAccount!: string;

  @Column({ name: "IFSC_CODE", type: "varchar2", length: 20, nullable: true })
  ifscCode!: string;

  @Column({ name: "BANK_NAME", type: "varchar2", length: 100, nullable: true })
  bankName!: string;

  @Column({ name: "INITIATED_AT", type: "varchar2", length: 30, nullable: true })
  initiatedAt!: string | null;

  @Column({ name: "PROCESSED_AT", type: "varchar2", length: 30, nullable: true })
  processedAt!: string | null;

  @Column({ name: "PAID_AT", type: "varchar2", length: 30, nullable: true })
  paidAt!: string | null;

  @Column({ name: "FAILURE_REASON", type: "varchar2", length: 500, nullable: true })
  failureReason!: string | null;
}
