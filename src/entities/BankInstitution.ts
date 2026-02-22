import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("BANK_INSTITUTIONS")
export class BankInstitutionEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 200 })
  name!: string;

  @Column({ type: "varchar2", length: 50 })
  code!: string;

  @Column({ type: "varchar2", length: 20, default: "'ACTIVE'" })
  status!: string;
}
