import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer } from "./transformers";

@Entity("GSTIN_CACHE")
export class GstinRecordEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ type: "varchar2", length: 20, unique: true })
  gstin!: string;

  @Column({ name: "LEGAL_NAME", type: "varchar2", length: 300 })
  legalName!: string;

  @Column({ name: "TRADE_NAME", type: "varchar2", length: 300 })
  tradeName!: string;

  @Column({ type: "varchar2", length: 20 })
  status!: "ACTIVE" | "INACTIVE" | "CANCELLED" | "SUSPENDED";

  @Column({ name: "STATE_CODE", type: "varchar2", length: 5 })
  stateCode!: string;

  @Column({ name: "STATE_NAME", type: "varchar2", length: 50 })
  stateName!: string;

  @Column({ name: "REGISTRATION_TYPE", type: "varchar2", length: 30 })
  registrationType!: string;

  @Column({ name: "LAST_VERIFIED", type: "varchar2", length: 30 })
  lastVerified!: string;

  @Column({ name: "VALIDATED_VIA", type: "varchar2", length: 20 })
  validatedVia!: "CIGNET" | "MANUAL" | "CACHE";

  @Column({ type: "varchar2", length: 500, nullable: true })
  address!: string;

  @Column({ name: "EINVOICE_ENABLED", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  einvoiceEnabled!: boolean;
}
