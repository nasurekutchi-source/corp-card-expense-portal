import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("EXPENSE_REPORTS")
export class ExpenseReportEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "REPORT_NUMBER", type: "varchar2", length: 30 })
  reportNumber!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "varchar2", length: 100, nullable: true })
  department!: string;

  @Column({ type: "varchar2", length: 300 })
  title!: string;

  @Column({ type: "varchar2", length: 20, default: "'DRAFT'" })
  status!: string;

  @Column({ name: "TOTAL_AMOUNT", type: "number", precision: 15, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: "varchar2", length: 5, default: "'INR'" })
  currency!: string;

  @Column({ name: "EXPENSE_COUNT", type: "number", precision: 10, default: 0 })
  expenseCount!: number;

  @Column({ type: "varchar2", length: 50, nullable: true })
  period!: string;

  @Column({ name: "SUBMITTED_AT", type: "varchar2", length: 30, nullable: true })
  submittedAt!: string | null;

  @Column({ name: "APPROVED_AT", type: "varchar2", length: 30, nullable: true })
  approvedAt!: string | null;

  @Column({ name: "PAID_AT", type: "varchar2", length: 30, nullable: true })
  paidAt!: string | null;

  @Column({ name: "POLICY_SCORE", type: "number", precision: 5, scale: 2, default: 100 })
  policyScore!: number;
}
