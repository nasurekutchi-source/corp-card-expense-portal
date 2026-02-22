import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("COST_CENTERS")
export class CostCenterEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 50 })
  code!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ name: "GL_CODE", type: "varchar2", length: 20 })
  glCode!: string;

  @Column({ type: "number", precision: 15, scale: 2, default: 0 })
  budget!: number;

  @Column({ type: "number", precision: 15, scale: 2, default: 0 })
  utilized!: number;

  @Column({ name: "DEPARTMENT_ID", type: "varchar2", length: 50 })
  departmentId!: string;

  @Column({ name: "COMPANY_ID", type: "varchar2", length: 50 })
  companyId!: string;
}
