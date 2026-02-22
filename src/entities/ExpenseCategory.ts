import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("EXPENSE_CATEGORIES")
export class ExpenseCategoryEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 20 })
  code!: string;

  @Column({ type: "varchar2", length: 100 })
  label!: string;

  @Column({ type: "varchar2", length: 50 })
  icon!: string;

  @Column({ type: "varchar2", length: 20 })
  color!: string;

  @Column({ name: "IS_ACTIVE", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  isActive!: boolean;

  @Column({ name: "SORT_ORDER", type: "number", precision: 5, default: 0 })
  sortOrder!: number;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  subcategories!: { code: string; label: string; glPrefix?: string }[];
}
