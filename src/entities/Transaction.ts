import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("TRANSACTIONS")
export class TransactionEntity {
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

  @Column({ name: "EVENT_TYPE", type: "varchar2", length: 20 })
  eventType!: string;

  @Column({ type: "number", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "varchar2", length: 5, default: "'INR'" })
  currency!: string;

  @Column({ name: "BILLING_AMOUNT", type: "number", precision: 15, scale: 2 })
  billingAmount!: number;

  @Column({ name: "BILLING_CURRENCY", type: "varchar2", length: 5, default: "'INR'" })
  billingCurrency!: string;

  @Column({ name: "MERCHANT_NAME", type: "varchar2", length: 300 })
  merchantName!: string;

  @Column({ type: "varchar2", length: 10, nullable: true })
  mcc!: string;

  @Column({ name: "MCC_CATEGORY", type: "varchar2", length: 100, nullable: true })
  mccCategory!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ name: "AUTH_CODE", type: "varchar2", length: 20, nullable: true })
  authCode!: string;

  @Column({ type: "varchar2", length: 30, nullable: true })
  channel!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  location!: { city: string; country: string };

  @Column({ type: "varchar2", length: 30 })
  timestamp!: string;

  @Column({ name: "HAS_RECEIPT", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  hasReceipt!: boolean;

  @Column({ name: "GST_AMOUNT", type: "number", precision: 15, scale: 2, default: 0 })
  gstAmount!: number;
}
