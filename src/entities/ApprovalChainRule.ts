import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("APPROVAL_CHAIN_RULES")
export class ApprovalChainRuleEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ name: "AMOUNT_MIN", type: "number", precision: 15, scale: 2, default: 0 })
  amountMin!: number;

  @Column({ name: "AMOUNT_MAX", type: "number", precision: 15, scale: 2, default: 0 })
  amountMax!: number;

  @Column({ type: "varchar2", length: 50, default: "'ALL'" })
  category!: string;

  @Column({ name: "APPROVER_CHAIN", type: "clob", transformer: jsonTransformer, nullable: true })
  approverChain!: { role: string; level: number }[];

  @Column({ name: "IS_ACTIVE", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  isActive!: boolean;
}
