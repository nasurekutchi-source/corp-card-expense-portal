import { Entity, PrimaryColumn, Column } from "typeorm";
import { jsonTransformer } from "./transformers";

@Entity("RECEIPTS")
export class ReceiptEntity {
  @PrimaryColumn({ type: "varchar2", length: 50 })
  id!: string;

  @Column({ name: "EXPENSE_ID", type: "varchar2", length: 50, nullable: true })
  expenseId!: string;

  @Column({ name: "FILE_NAME", type: "varchar2", length: 300 })
  fileName!: string;

  @Column({ name: "FILE_SIZE", type: "number", precision: 15 })
  fileSize!: number;

  @Column({ name: "MIME_TYPE", type: "varchar2", length: 100 })
  mimeType!: string;

  @Column({ name: "BASE64_DATA", type: "clob" })
  base64Data!: string;

  @Column({ name: "UPLOADED_AT", type: "varchar2", length: 30 })
  uploadedAt!: string;

  @Column({ name: "OCR_DATA", type: "clob", transformer: jsonTransformer, nullable: true })
  ocrData!: Record<string, any> | null;

  @Column({ name: "OCR_CONFIDENCE", type: "clob", transformer: jsonTransformer, nullable: true })
  ocrConfidence!: Record<string, number> | null;

  @Column({ name: "OCR_STATUS", type: "varchar2", length: 20, default: "'PENDING'" })
  ocrStatus!: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "DEMO";

  @Column({ type: "varchar2", length: 20, default: "'UPLOAD'" })
  source!: "UPLOAD" | "CAMERA" | "EMAIL";
}
