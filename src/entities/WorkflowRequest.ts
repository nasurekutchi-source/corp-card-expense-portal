import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("WORKFLOW_REQUESTS")
export class WorkflowRequestEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 50 })
  type!: string;

  @Column({ name: "REQUESTOR_ID", type: "varchar2", length: 50 })
  requestorId!: string;

  @Column({ name: "REQUESTOR_NAME", type: "varchar2", length: 200 })
  requestorName!: string;

  @Column({ type: "varchar2", length: 100, nullable: true })
  department!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  details!: Record<string, unknown>;

  @Column({ name: "CURRENT_APPROVER", type: "varchar2", length: 200, nullable: true })
  currentApprover!: string;

  @Column({ name: "APPROVAL_CHAIN", type: "clob", transformer: jsonTransformer, nullable: true })
  approvalChain!: { name: string; role: string; status: string; date: string | null }[];

  @Column({ name: "CREATED_AT", type: "varchar2", length: 30 })
  createdAt!: string;

  @Column({ name: "UPDATED_AT", type: "varchar2", length: 30 })
  updatedAt!: string;

  @Column({ type: "clob", transformer: jsonTransformer, nullable: true })
  comments!: { author: string; text: string; date: string }[];
}
