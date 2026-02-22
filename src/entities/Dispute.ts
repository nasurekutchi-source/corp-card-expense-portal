import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("DISPUTES")
export class DisputeEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "TRANSACTION_ID", type: "varchar2", length: 50 })
  transactionId!: string;

  @Column({ name: "CARD_ID", type: "varchar2", length: 50 })
  cardId!: string;

  @Column({ name: "CARD_LAST4", type: "varchar2", length: 4 })
  cardLast4!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ type: "number", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "varchar2", length: 100 })
  reason!: string;

  @Column({ type: "varchar2", length: 1000, nullable: true })
  description!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ name: "PROVISIONAL_CREDIT_AMOUNT", type: "number", precision: 15, scale: 2, nullable: true })
  provisionalCreditAmount!: number | null;

  @Column({ name: "PROVISIONAL_CREDIT_DATE", type: "varchar2", length: 30, nullable: true })
  provisionalCreditDate!: string | null;

  @Column({ type: "varchar2", length: 500, nullable: true })
  resolution!: string | null;

  @Column({ name: "RESOLVED_AT", type: "varchar2", length: 30, nullable: true })
  resolvedAt!: string | null;

  @Column({ name: "CREATED_AT", type: "varchar2", length: 30 })
  createdAt!: string;
}
