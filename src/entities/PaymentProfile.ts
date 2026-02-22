import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer } from "./transformers";

@Entity("PAYMENT_PROFILES")
export class PaymentProfileEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "varchar2", length: 20 })
  type!: "BANK_ACCOUNT" | "UPI";

  @Column({ name: "ACCOUNT_NUMBER", type: "varchar2", length: 50 })
  accountNumber!: string;

  @Column({ name: "ACCOUNT_HOLDER_NAME", type: "varchar2", length: 200 })
  accountHolderName!: string;

  @Column({ name: "IFSC_CODE", type: "varchar2", length: 20 })
  ifscCode!: string;

  @Column({ name: "BANK_NAME", type: "varchar2", length: 100 })
  bankName!: string;

  @Column({ name: "BRANCH_NAME", type: "varchar2", length: 200, nullable: true })
  branchName!: string;

  @Column({ name: "ACCOUNT_TYPE", type: "varchar2", length: 20, default: "'SAVINGS'" })
  accountType!: "SAVINGS" | "CURRENT";

  @Column({ name: "UPI_VPA", type: "varchar2", length: 100, nullable: true })
  upiVpa!: string | null;

  @Column({ name: "IS_PRIMARY", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  isPrimary!: boolean;

  @Column({ type: "varchar2", length: 30, default: "'PENDING_VERIFICATION'" })
  status!: "PENDING_VERIFICATION" | "VERIFIED" | "FAILED";

  @Column({ name: "ADDED_AT", type: "varchar2", length: 30 })
  addedAt!: string;

  @Column({ name: "VERIFIED_AT", type: "varchar2", length: 30, nullable: true })
  verifiedAt!: string | null;
}
