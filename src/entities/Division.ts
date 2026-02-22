import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("DIVISIONS")
export class DivisionEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ type: "varchar2", length: 50 })
  code!: string;

  @Column({ name: "COMPANY_ID", type: "varchar2", length: 50 })
  companyId!: string;

  @Column({ type: "number", precision: 15, scale: 2, default: 0 })
  budget!: number;
}
