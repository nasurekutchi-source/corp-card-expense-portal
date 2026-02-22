import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("EXPENSES")
export class ExpenseEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "TRANSACTION_ID", type: "varchar2", length: 50, nullable: true })
  transactionId!: string | null;

  @Column({ type: "number", precision: 15, scale: 2 })
  amount!: number;

  @Column({ name: "ORIGINAL_CURRENCY", type: "varchar2", length: 5, default: "'INR'" })
  originalCurrency!: string;

  @Column({ type: "varchar2", length: 50 })
  category!: string;

  @Column({ name: "GL_CODE", type: "varchar2", length: 20, nullable: true })
  glCode!: string;

  @Column({ name: "COST_CENTER_ID", type: "varchar2", length: 50, nullable: true })
  costCenterId!: string;

  @Column({ name: "COST_CENTER_NAME", type: "varchar2", length: 200, nullable: true })
  costCenterName!: string;

  @Column({ name: "POLICY_STATUS", type: "varchar2", length: 30, default: "'COMPLIANT'" })
  policyStatus!: string;

  @Column({ name: "BUSINESS_PURPOSE", type: "varchar2", length: 1000, nullable: true })
  businessPurpose!: string;

  @Column({ type: "varchar2", length: 20 })
  type!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ name: "MERCHANT_NAME", type: "varchar2", length: 300 })
  merchantName!: string;

  @Column({ type: "varchar2", length: 30 })
  date!: string;

  @Column({ name: "HAS_RECEIPT", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  hasReceipt!: boolean;

  @Column({ name: "GST_DETAILS", type: "clob", transformer: jsonTransformer, nullable: true })
  gstDetails!: { gstin: string; cgst: number; sgst: number; igst: number };

  @Column({ type: "varchar2", length: 20, nullable: true })
  status!: string;
}
