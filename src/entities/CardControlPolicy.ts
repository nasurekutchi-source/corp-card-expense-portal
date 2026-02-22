import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer, jsonTransformer } from "./transformers";

@Entity("CARD_CONTROL_POLICIES")
export class CardControlPolicyEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "NODE_ID", type: "varchar2", length: 50 })
  nodeId!: string;

  @Column({ name: "NODE_TYPE", type: "varchar2", length: 20 })
  nodeType!: "company" | "division" | "department";

  @Column({ name: "NODE_NAME", type: "varchar2", length: 200 })
  nodeName!: string;

  @Column({ name: "SPEND_LIMITS", type: "clob", transformer: jsonTransformer, nullable: true })
  spendLimits!: { perTransaction: number; daily: number; monthly: number };

  @Column({ name: "CHANNEL_CONTROLS", type: "clob", transformer: jsonTransformer, nullable: true })
  channelControls!: { pos: boolean; ecommerce: boolean; contactless: boolean; mobileWallet: boolean; atm: boolean };

  @Column({ name: "GEOGRAPHIC_CONTROLS", type: "clob", transformer: jsonTransformer, nullable: true })
  geographicControls!: { internationalAllowed: boolean; domesticOnly: boolean };

  @Column({ name: "MCC_RESTRICTIONS", type: "clob", transformer: jsonTransformer, nullable: true })
  mccRestrictions!: string[];

  @Column({ name: "IS_OVERRIDE", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  isOverride!: boolean;

  @Column({ name: "INHERITED_FROM", type: "varchar2", length: 50, nullable: true })
  inheritedFrom!: string;
}
