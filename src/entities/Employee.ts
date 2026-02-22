import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("EMPLOYEES")
export class EmployeeEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "EMPLOYEE_NUMBER", type: "varchar2", length: 20 })
  employeeNumber!: string;

  @Column({ name: "FIRST_NAME", type: "varchar2", length: 100 })
  firstName!: string;

  @Column({ name: "LAST_NAME", type: "varchar2", length: 100 })
  lastName!: string;

  @Column({ type: "varchar2", length: 200 })
  email!: string;

  @Column({ type: "varchar2", length: 20, nullable: true })
  phone!: string;

  @Column({ name: "DEPARTMENT_ID", type: "varchar2", length: 50, nullable: true })
  departmentId!: string;

  @Column({ name: "COST_CENTER_ID", type: "varchar2", length: 50, nullable: true })
  costCenterId!: string;

  @Column({ type: "varchar2", length: 20, default: "'STAFF'" })
  level!: string;

  @Column({ type: "varchar2", length: 15, nullable: true })
  pan!: string;

  @Column({ type: "varchar2", length: 20, default: "'ACTIVE'" })
  status!: string;
}
