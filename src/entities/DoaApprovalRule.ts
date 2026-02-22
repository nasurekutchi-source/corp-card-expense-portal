import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("DOA_APPROVAL_RULES")
export class DoaApprovalRuleEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "AMOUNT_RANGE", type: "varchar2", length: 100 })
  amountRange!: string;

  @Column({ type: "varchar2", length: 50 })
  category!: string;

  @Column({ type: "varchar2", length: 500 })
  approvers!: string;
}
