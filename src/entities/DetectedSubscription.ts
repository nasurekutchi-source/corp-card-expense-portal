import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer } from "./transformers";

@Entity("DETECTED_SUBSCRIPTIONS")
export class DetectedSubscriptionEntity {
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

  @Column({ name: "MERCHANT_NAME", type: "varchar2", length: 300 })
  merchantName!: string;

  @Column({ type: "varchar2", length: 10, nullable: true })
  mcc!: string;

  @Column({ type: "varchar2", length: 20 })
  frequency!: string;

  @Column({ name: "LAST_CHARGE_DATE", type: "varchar2", length: 30 })
  lastChargeDate!: string;

  @Column({ name: "LAST_CHARGE_AMOUNT", type: "number", precision: 15, scale: 2 })
  lastChargeAmount!: number;

  @Column({ name: "AVG_AMOUNT", type: "number", precision: 15, scale: 2 })
  avgAmount!: number;

  @Column({ name: "TOTAL_CHARGES", type: "number", precision: 10 })
  totalCharges!: number;

  @Column({ name: "IS_ACTIVE", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  isActive!: boolean;

  @Column({ name: "DETECTED_AT", type: "varchar2", length: 30 })
  detectedAt!: string;
}
