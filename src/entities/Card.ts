import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("CARDS")
export class CardEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "LAST4_DIGITS", type: "varchar2", length: 4 })
  last4Digits!: string;

  @Column({ type: "varchar2", length: 20 })
  type!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ type: "varchar2", length: 20, nullable: true })
  network!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "varchar2", length: 100, nullable: true })
  department!: string;

  @Column({ name: "SPEND_LIMITS", type: "clob", transformer: jsonTransformer, nullable: true })
  spendLimits!: { perTransaction: number; daily: number; monthly: number };

  @Column({ name: "EXPIRY_DATE", type: "varchar2", length: 30, nullable: true })
  expiryDate!: string;

  @Column({ name: "ISSUED_DATE", type: "varchar2", length: 30, nullable: true })
  issuedDate!: string;

  @Column({ name: "UTILIZATION_PERCENT", type: "number", precision: 5, scale: 2, default: 0 })
  utilizationPercent!: number;
}
