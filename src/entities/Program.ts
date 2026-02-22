import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("PROGRAMS")
export class ProgramEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ type: "varchar2", length: 50 })
  code!: string;

  @Column({ name: "BANK_ID", type: "varchar2", length: 50 })
  bankId!: string;

  @Column({ type: "varchar2", length: 20, default: "'ACTIVE'" })
  status!: string;

  @Column({ type: "varchar2", length: 500, nullable: true })
  description!: string;
}
