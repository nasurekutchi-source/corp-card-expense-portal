import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("DOA_AUTHORITY_LEVELS")
export class DoaAuthorityLevelEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ name: "MAX_AMOUNT", type: "number", precision: 15, scale: 2 })
  maxAmount!: number;

  @Column({ name: "ALLOWED_CATEGORIES", type: "clob", transformer: jsonTransformer, nullable: true })
  allowedCategories!: string[];
}
