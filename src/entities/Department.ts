import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("DEPARTMENTS")
export class DepartmentEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ type: "varchar2", length: 50 })
  code!: string;

  @Column({ name: "DIVISION_ID", type: "varchar2", length: 50 })
  divisionId!: string;

  @Column({ type: "number", precision: 15, scale: 2, default: 0 })
  budget!: number;

  @Column({ name: "GL_CODE_PREFIX", type: "varchar2", length: 20, nullable: true })
  glCodePrefix!: string;
}
