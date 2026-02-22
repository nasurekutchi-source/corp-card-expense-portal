import { Entity, PrimaryColumn, Column } from "typeorm";
import { booleanTransformer } from "./transformers";

@Entity("MODULE_CONFIG")
export class ModuleConfigEntity {
  @PrimaryColumn({ type: "varchar2", length: 50, default: "'default'" })
  id!: string;

  @Column({ name: "CARD_PORTAL", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  cardPortal!: boolean;

  @Column({ name: "EXPENSE_MANAGEMENT", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  expenseManagement!: boolean;

  @Column({ name: "OCR_RECEIPTS", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  ocrReceipts!: boolean;

  @Column({ name: "AI_ASSISTANT", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  aiAssistant!: boolean;

  @Column({ name: "MILEAGE_TRACKING", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  mileageTracking!: boolean;

  @Column({ name: "PER_DIEM", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  perDiem!: boolean;

  @Column({ name: "TEAMS_INTEGRATION", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  teamsIntegration!: boolean;

  @Column({ name: "AP_EXPORT", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  apExport!: boolean;

  @Column({ name: "VIRTUAL_CARD_ISSUANCE", type: "number", width: 1, transformer: booleanTransformer, default: 1 })
  virtualCardIssuance!: boolean;

  @Column({ name: "RBI_LRS", type: "number", width: 1, transformer: booleanTransformer, default: 0 })
  rbiLrs!: boolean;
}
