import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("AUDIT_LOG")
export class AuditLogEntryEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 30 })
  timestamp!: string;

  @Column({ name: "ENTITY_TYPE", type: "varchar2", length: 50 })
  entityType!: string;

  @Column({ name: "ENTITY_ID", type: "varchar2", length: 50 })
  entityId!: string;

  @Column({ type: "varchar2", length: 30 })
  action!: string;

  @Column({ name: "USER_ID", type: "varchar2", length: 50 })
  userId!: string;

  @Column({ name: "USER_NAME", type: "varchar2", length: 200 })
  userName!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  changes!: Record<string, { old: any; new: any }> | null;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ name: "IP_ADDRESS", type: "varchar2", length: 50, nullable: true })
  ipAddress!: string;
}
