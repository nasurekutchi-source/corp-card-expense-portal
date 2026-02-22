import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("SCHEDULED_CARD_ACTIONS")
export class ScheduledCardActionEntity {
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

  @Column({ name: "ACTION_TYPE", type: "varchar2", length: 30 })
  actionType!: string;

  @Column({ name: "SCHEDULED_DATE", type: "varchar2", length: 30 })
  scheduledDate!: string;

  @Column({ type: "varchar2", length: 20 })
  recurrence!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  details!: Record<string, unknown>;

  @Column({ name: "CREATED_AT", type: "varchar2", length: 30 })
  createdAt!: string;
}
