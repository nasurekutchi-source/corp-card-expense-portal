import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("APPROVALS")
export class ApprovalEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "ENTITY_TYPE", type: "varchar2", length: 30 })
  entityType!: string;

  @Column({ name: "ENTITY_ID", type: "varchar2", length: 50 })
  entityId!: string;

  @Column({ name: "REPORT_NUMBER", type: "varchar2", length: 30, nullable: true })
  reportNumber!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "varchar2", length: 100, nullable: true })
  department!: string;

  @Column({ type: "number", precision: 15, scale: 2 })
  amount!: number;

  @Column({ name: "EXPENSE_COUNT", type: "number", precision: 10, default: 0 })
  expenseCount!: number;

  @Column({ type: "varchar2", length: 20, default: "'PENDING'" })
  status!: string;

  @Column({ type: "number", precision: 3, default: 1 })
  level!: number;

  @Column({ name: "SUBMITTED_AT", type: "varchar2", length: 30, nullable: true })
  submittedAt!: string | null;

  @Column({ name: "DUE_AT", type: "varchar2", length: 30, nullable: true })
  dueAt!: string;

  @Column({ name: "POLICY_SCORE", type: "number", precision: 5, scale: 2, default: 100 })
  policyScore!: number;
}
