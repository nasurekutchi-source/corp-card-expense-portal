import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("PAYMENT_CYCLES")
export class PaymentCycleEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "COMPANY_ID", type: "varchar2", length: 50 })
  companyId!: string;

  @Column({ name: "COMPANY_NAME", type: "varchar2", length: 200 })
  companyName!: string;

  @Column({ name: "STATEMENT_PERIOD", type: "varchar2", length: 30 })
  statementPeriod!: string;

  @Column({ name: "DUE_DATE", type: "varchar2", length: 30 })
  dueDate!: string;

  @Column({ name: "TOTAL_DUE", type: "number", precision: 15, scale: 2, default: 0 })
  totalDue!: number;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ name: "PAYMENT_REF", type: "varchar2", length: 100, nullable: true })
  paymentRef!: string;

  @Column({ name: "PAYMENT_DATE", type: "varchar2", length: 30, nullable: true })
  paymentDate!: string | null;

  @Column({ name: "PAYMENT_MODE", type: "varchar2", length: 30, nullable: true })
  paymentMode!: string | null;

  @Column({ name: "APPORTIONMENT_STATUS", type: "varchar2", length: 30 })
  apportionmentStatus!: string;

  @Column({ name: "CARD_COUNT", type: "number", precision: 10, default: 0 })
  cardCount!: number;
}
