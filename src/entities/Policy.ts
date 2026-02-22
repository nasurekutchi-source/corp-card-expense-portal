import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("POLICIES")
export class PolicyEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ type: "varchar2", length: 50 })
  type!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  rules!: Record<string, unknown>;

  @Column({ type: "varchar2", length: 10, default: "'SOFT'" })
  severity!: string;

  @Column({ name: "IS_ACTIVE", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  isActive!: boolean;

  @Column({ type: "number", precision: 5, default: 1 })
  version!: number;
}
