"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import {
  Upload,
  Download,
  RotateCcw,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Database,
  FileDown,
} from "lucide-react";

// --------------- CSV TEMPLATE DEFINITIONS ---------------

interface EntityConfig {
  key: string;
  label: string;
  description: string;
  apiPath: string;
  templateHeaders: string;
  templateRows: string[];
}

const ENTITIES: EntityConfig[] = [
  {
    key: "cards",
    label: "Cards",
    description: "Corporate card records with limits and assignment",
    apiPath: "/api/v1/cards/bulk",
    templateHeaders:
      "last4Digits,type,status,network,employeeEmail,perTransactionLimit,dailyLimit,monthlyLimit,expiryDate",
    templateRows: [
      "1001,PHYSICAL,ACTIVE,VISA,employee@corpcardpro.com,50000,100000,500000,2027-12-31",
      "1002,VIRTUAL,ACTIVE,MASTERCARD,manager@corpcardpro.com,25000,75000,300000,2027-06-30",
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    description: "Card transaction records with merchant and MCC details",
    apiPath: "/api/v1/transactions/bulk",
    templateHeaders:
      "cardLast4,amount,merchantName,mcc,mccCategory,status,channel,city,date",
    templateRows: [
      "1001,4500,Uber India,4121,Transportation,SETTLED,POS,Mumbai,2026-02-15",
      "1002,12000,Taj Hotels,7011,Hotels & Lodging,SETTLED,POS,Delhi,2026-02-14",
    ],
  },
  {
    key: "employees",
    label: "Employees",
    description: "Employee master data with department and cost center mapping",
    apiPath: "/api/v1/employees/bulk",
    templateHeaders:
      "firstName,lastName,email,phone,departmentCode,costCenterCode,level,pan",
    templateRows: [
      "Rahul,Verma,rahul.verma@corpcardpro.com,9876543210,TECH,CC-TECH-01,L5,ABCPV1234A",
      "Sneha,Iyer,sneha.iyer@corpcardpro.com,9876543211,SALES,CC-SALES-01,L4,DEFPI5678B",
    ],
  },
  {
    key: "hierarchy",
    label: "Hierarchy",
    description: "Organizational hierarchy — enterprise, company, division, department, cost center",
    apiPath: "/api/v1/hierarchy/bulk",
    templateHeaders: "type,name,code,parentName,budget,glCodePrefix",
    templateRows: [
      "ENTERPRISE,Bharat Financial Services,BFS,,100000000,1000",
      "COMPANY,BFS India,BFS-IND,Bharat Financial Services,50000000,1100",
      "DIVISION,Technology,BFS-TECH,BFS India,20000000,1110",
      "DEPARTMENT,Engineering,BFS-ENG,Technology,10000000,1111",
      "COST_CENTER,Platform Team,CC-PLAT-01,Engineering,5000000,1111-01",
    ],
  },
];

// --------------- UPLOAD RESULT TYPES ---------------

interface UploadResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: string[];
}

// --------------- HELPER: Parse CSV ---------------

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));

  return { headers, rows };
}

// --------------- HELPER: Generate CSV content ---------------

function generateCSVContent(entity: EntityConfig): string {
  return [entity.templateHeaders, ...entity.templateRows].join("\n");
}

// --------------- HELPER: Download as file ---------------

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --------------- UPLOAD CARD COMPONENT ---------------

function UploadCard({ entity }: { entity: EntityConfig }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDownloadTemplate() {
    const content = generateCSVContent(entity);
    downloadFile(content, `${entity.key}-template.csv`, "text/csv");
    toast.success(`Downloaded ${entity.label} template`);
  }

  function handleFileSelect(f: File | null) {
    if (f && !f.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    setFile(f);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0 || rows.length === 0) {
        setResult({
          success: false,
          importedCount: 0,
          errorCount: 1,
          errors: ["CSV file is empty or has no data rows"],
        });
        toast.error("CSV file is empty or has no data rows");
        setUploading(false);
        return;
      }

      // Build JSON payload from CSV
      const records = rows.map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, i) => {
          record[header] = row[i] ?? "";
        });
        return record;
      });

      const response = await fetch(entity.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (response.ok) {
        const data = await response.json();
        const importedCount = data.importedCount ?? records.length;
        const errorCount = data.errorCount ?? 0;
        const errors = data.errors ?? [];

        setResult({
          success: errorCount === 0,
          importedCount,
          errorCount,
          errors,
        });
        toast.success(`Imported ${importedCount} ${entity.label.toLowerCase()} successfully`);
      } else {
        const errData = await response.json().catch(() => ({}));
        const message = errData.message || `Upload failed with status ${response.status}`;
        setResult({
          success: false,
          importedCount: 0,
          errorCount: 1,
          errors: [message],
        });
        toast.error(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setResult({
        success: false,
        importedCount: 0,
        errorCount: 1,
        errors: [message],
      });
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{entity.label}</CardTitle>
              <CardDescription className="text-xs">{entity.description}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadTemplate}>
            <FileDown className="w-3 h-3" />
            Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Drop zone / file input */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : file
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const droppedFile = e.dataTransfer.files?.[0] ?? null;
            handleFileSelect(droppedFile);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">
                Drag & drop a CSV file or click to browse
              </p>
            </>
          )}
        </div>

        {/* Upload button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                Upload {entity.label}
              </>
            )}
          </Button>
          {file && !uploading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setFile(null);
                setResult(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div
            className={`rounded-lg p-3 text-xs space-y-1 ${
              result.success
                ? "bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {result.success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Successfully imported {result.importedCount} record{result.importedCount !== 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400">
                    {result.importedCount > 0
                      ? `Imported ${result.importedCount}, failed ${result.errorCount}`
                      : `Upload failed`}
                  </span>
                </>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="ml-5 list-disc space-y-0.5 text-red-600 dark:text-red-400">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...and {result.errors.length - 5} more errors</li>
                )}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --------------- MAIN PAGE COMPONENT ---------------

export default function DataManagementPage() {
  const [exporting, setExporting] = useState(false);
  const [exportingEntity, setExportingEntity] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // ---- Export all data ----
  async function handleExportAll() {
    setExporting(true);
    try {
      const response = await fetch("/api/v1/data/export");
      if (response.ok) {
        const data = await response.json();
        const content = JSON.stringify(data, null, 2);
        downloadFile(content, "corpcardpro-data-export.json", "application/json");
        toast.success("Data exported successfully");
      } else {
        toast.error("Export failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  // ---- Export single entity ----
  async function handleExportEntity(entityKey: string, label: string) {
    setExportingEntity(entityKey);
    try {
      const response = await fetch(`/api/v1/data/export?entity=${entityKey}`);
      if (response.ok) {
        const data = await response.json();
        const content = JSON.stringify(data, null, 2);
        downloadFile(content, `corpcardpro-${entityKey}-export.json`, "application/json");
        toast.success(`${label} data exported`);
      } else {
        toast.error(`Failed to export ${label.toLowerCase()}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingEntity(null);
    }
  }

  // ---- Reset data ----
  async function handleReset() {
    const confirmed = window.confirm(
      "Are you sure you want to reset ALL data?\n\nThis will delete all cards, transactions, employees, and hierarchy data and restore the demo defaults.\n\nThis action cannot be undone."
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const response = await fetch("/api/v1/data/reset", { method: "POST" });
      if (response.ok) {
        toast.success("All data has been reset to defaults");
      } else {
        toast.error("Reset failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Data Management"
        description="Upload bulk data, export, or reset to defaults"
      >
        <Badge variant="outline" className="text-xs">
          <Database className="w-3 h-3 mr-1" />
          Admin Only
        </Badge>
      </PageHeader>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </TabsTrigger>
          <TabsTrigger value="reset">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </TabsTrigger>
        </TabsList>

        {/* ==================== UPLOAD TAB ==================== */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ENTITIES.map((entity) => (
              <UploadCard key={entity.key} entity={entity} />
            ))}
          </div>
        </TabsContent>

        {/* ==================== EXPORT TAB ==================== */}
        <TabsContent value="export" className="space-y-4">
          {/* Export all */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Export All Data
              </CardTitle>
              <CardDescription className="text-xs">
                Download a complete JSON snapshot of all cards, transactions, employees, and hierarchy data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportAll} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export All Data as JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual entity exports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                Export by Entity
              </CardTitle>
              <CardDescription className="text-xs">
                Download data for a specific entity type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ENTITIES.map((entity) => (
                  <Button
                    key={entity.key}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1.5"
                    disabled={exportingEntity === entity.key}
                    onClick={() => handleExportEntity(entity.key, entity.label)}
                  >
                    {exportingEntity === entity.key ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5" />
                    )}
                    <span className="text-xs font-medium">{entity.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CSV template downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV Templates
              </CardTitle>
              <CardDescription className="text-xs">
                Download sample CSV templates for bulk upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ENTITIES.map((entity) => (
                  <Button
                    key={entity.key}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-1.5"
                    onClick={() => {
                      const content = generateCSVContent(entity);
                      downloadFile(content, `${entity.key}-template.csv`, "text/csv");
                      toast.success(`Downloaded ${entity.label} template`);
                    }}
                  >
                    <FileDown className="w-5 h-5" />
                    <span className="text-xs font-medium">{entity.label} Template</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== RESET TAB ==================== */}
        <TabsContent value="reset" className="space-y-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                Reset All Data
              </CardTitle>
              <CardDescription className="text-xs">
                Clear all data and restore the demo defaults. This action is irreversible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning */}
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Warning: This will permanently delete:
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 list-disc ml-5 space-y-1">
                  <li>All corporate card records and their configurations</li>
                  <li>All transaction history</li>
                  <li>All employee records and assignments</li>
                  <li>All hierarchy structures (enterprise, company, division, department, cost center)</li>
                  <li>All expense reports, policies, and approval workflows</li>
                </ul>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-1">
                  The system will be restored to its original demo state with sample data.
                </p>
              </div>

              {/* Reset button */}
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Reset All Data to Defaults
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
