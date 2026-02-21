"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { getDepartments, getCostCenters, getEmployees } from "@/lib/store";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Building2,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

const steps = ["Personal Details", "Department & Role", "Cost Center & Limits", "Review"];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeNumber: string;
  pan: string;
  designation: string;
  departmentId: string;
  level: string;
  managerId: string;
  platformRole: string;
  costCenterId: string;
  glCode: string;
  budget: string;
  issueCard: boolean;
  perTxnLimit: string;
  dailyLimit: string;
  monthlyLimit: string;
}

export default function NewEmployeePage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const departments = getDepartments();
  const costCenters = getCostCenters();
  const allEmployees = getEmployees();

  // Managers: employees at MANAGER level or above
  const managers = allEmployees.filter((e) =>
    ["MANAGER", "SENIOR_MANAGER", "EXECUTIVE"].includes(e.level)
  );

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeNumber: "",
    pan: "",
    designation: "",
    departmentId: departments[0]?.id || "",
    level: "STAFF",
    managerId: managers[0]?.id || "",
    platformRole: "EMPLOYEE",
    costCenterId: costCenters[0]?.id || "",
    glCode: "",
    budget: "",
    issueCard: true,
    perTxnLimit: "25000",
    dailyLimit: "50000",
    monthlyLimit: "200000",
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Resolve display values for review step
  const selectedDept = departments.find((d) => d.id === form.departmentId);
  const selectedCC = costCenters.find((cc) => cc.id === form.costCenterId);
  const selectedManager = allEmployees.find((e) => e.id === form.managerId);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create employee
      const empRes = await fetch("/api/v1/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          employeeNumber: form.employeeNumber || undefined,
          pan: form.pan,
          departmentId: form.departmentId,
          costCenterId: form.costCenterId,
          level: form.level,
          status: "ACTIVE",
        }),
      });

      const empResult = await empRes.json();

      if (!empRes.ok) {
        toast.error(empResult.error || "Failed to create employee");
        return;
      }

      const newEmployee = empResult.data;

      // If issue card is checked, also create a card
      if (form.issueCard && newEmployee?.id) {
        const cardRes = await fetch("/api/v1/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: newEmployee.id,
            last4Digits: String(Math.floor(Math.random() * 9000) + 1000),
            type: "VIRTUAL",
            network: "VISA",
            spendLimits: {
              perTransaction: Number(form.perTxnLimit) || 25000,
              daily: Number(form.dailyLimit) || 50000,
              monthly: Number(form.monthlyLimit) || 200000,
            },
          }),
        });

        if (!cardRes.ok) {
          toast.warning("Employee created but card issuance failed");
        }
      }

      toast.success("Employee onboarded successfully");
      router.push("/employees");
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Onboard Employee" description="Add a new employee to the platform">
        <Button variant="outline" asChild>
          <Link href="/employees">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
        </Button>
      </PageHeader>

      {/* Progress */}
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? "bg-emerald-500 text-white" :
              i === step ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">First Name</label>
                  <Input
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Last Name</label>
                  <Input
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Phone</label>
                  <Input
                    placeholder="+91-XXXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Employee Number</label>
                  <Input
                    placeholder="Auto-generated if blank"
                    value={form.employeeNumber}
                    onChange={(e) => updateField("employeeNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Designation</label>
                  <Input
                    placeholder="e.g. Software Engineer"
                    value={form.designation}
                    onChange={(e) => updateField("designation", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department & Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Department</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.departmentId}
                    onChange={(e) => updateField("departmentId", e.target.value)}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Level</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.level}
                    onChange={(e) => updateField("level", e.target.value)}
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="SENIOR_MANAGER">SENIOR_MANAGER</option>
                    <option value="EXECUTIVE">EXECUTIVE</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Reporting Manager</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.managerId}
                    onChange={(e) => updateField("managerId", e.target.value)}
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.level.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Platform Role</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.platformRole}
                    onChange={(e) => updateField("platformRole", e.target.value)}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPT_MANAGER">Department Manager</option>
                    <option value="FINANCE_CONTROLLER">Finance Controller</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cost Center & Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Cost Center</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.costCenterId}
                  onChange={(e) => updateField("costCenterId", e.target.value)}
                >
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">GL Code</label>
                  <Input
                    placeholder="e.g. 4100-01"
                    value={form.glCode}
                    onChange={(e) => updateField("glCode", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Budget (INR)</label>
                  <Input
                    type="number"
                    placeholder="Annual budget"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Issue Corporate Card</p>
                    <p className="text-xs text-muted-foreground">Auto-issue a virtual card on onboarding</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.issueCard}
                      onChange={(e) => updateField("issueCard", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
                {form.issueCard && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Per Txn Limit (INR)</label>
                      <Input
                        type="number"
                        value={form.perTxnLimit}
                        onChange={(e) => updateField("perTxnLimit", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Daily Limit (INR)</label>
                      <Input
                        type="number"
                        value={form.dailyLimit}
                        onChange={(e) => updateField("dailyLimit", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Monthly Limit (INR)</label>
                      <Input
                        type="number"
                        value={form.monthlyLimit}
                        onChange={(e) => updateField("monthlyLimit", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Review & Confirm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Name", value: `${form.firstName} ${form.lastName}`.trim() || "—" },
                  { label: "Employee Number", value: form.employeeNumber || "Auto-generated" },
                  { label: "Email", value: form.email || "—" },
                  { label: "Phone", value: form.phone || "—" },
                  { label: "Designation", value: form.designation || "—" },
                  { label: "Department", value: selectedDept?.name || "—" },
                  { label: "Level", value: form.level.replace("_", " ") },
                  { label: "Reporting Manager", value: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : "—" },
                  { label: "Platform Role", value: form.platformRole.replace("_", " ") },
                  { label: "Cost Center", value: selectedCC ? `${selectedCC.name} (${selectedCC.code})` : "—" },
                  { label: "GL Code", value: form.glCode || "—" },
                  {
                    label: "Auto-issue Card",
                    value: form.issueCard
                      ? `Virtual, ${Number(form.monthlyLimit).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}/month`
                      : "No",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-medium">Welcome Email</p>
                <p className="mt-0.5 opacity-80">An invitation email will be sent to set up their account and download the mobile app.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Onboarding..." : "Onboard Employee"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
