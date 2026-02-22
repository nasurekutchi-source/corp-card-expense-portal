import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("PAYMENT_APPORTIONMENTS")
export class PaymentApportionmentEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "PAYMENT_CYCLE_ID", type: "varchar2", length: 50 })
  paymentCycleId!: string;

  @Column({ name: "CARD_ID", type: "varchar2", length: 50 })
  cardId!: string;

  @Column({ name: "CARD_LAST4", type: "varchar2", length: 4 })
  cardLast4!: string;

  @Column({ name: "EMPLOYEE_ID", type: "varchar2", length: 50 })
  employeeId!: string;

  @Column({ name: "EMPLOYEE_NAME", type: "varchar2", length: 200 })
  employeeName!: string;

  @Column({ name: "DEPARTMENT_NAME", type: "varchar2", length: 200, nullable: true })
  departmentName!: string;

  @Column({ name: "COST_CENTER_NAME", type: "varchar2", length: 200, nullable: true })
  costCenterName!: string;

  @Column({ type: "number", precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: "varchar2", length: 20 })
  status!: string;
}
