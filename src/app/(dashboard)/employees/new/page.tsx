"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { getDepartments, getCostCenters } from "@/lib/store";
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

export default function NewEmployeePage() {
  const [step, setStep] = useState(0);

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
                  <Input placeholder="Enter first name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Last Name</label>
                  <Input placeholder="Enter last name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Email</label>
                  <Input type="email" placeholder="name@company.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Phone</label>
                  <Input placeholder="+91-XXXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Employee Number</label>
                  <Input placeholder="Auto-generated" disabled defaultValue="BFS011" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">PAN</label>
                  <Input placeholder="ABCDE1234F" />
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
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {getDepartments().map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Level</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>STAFF</option>
                    <option>MANAGER</option>
                    <option>SENIOR_MANAGER</option>
                    <option>EXECUTIVE</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Reporting Manager</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Deepa Nair (Dept Manager)</option>
                    <option>Rajesh Kumar (Executive)</option>
                    <option>Priya Sharma (Senior Manager)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Platform Role</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Employee</option>
                    <option>Department Manager</option>
                    <option>Finance Controller</option>
                    <option>Company Admin</option>
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
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {getCostCenters().map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Issue Corporate Card</p>
                    <p className="text-xs text-muted-foreground">Auto-issue a virtual card on onboarding</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Per Txn Limit (₹)</label>
                    <Input type="number" defaultValue="25000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Daily Limit (₹)</label>
                    <Input type="number" defaultValue="50000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Monthly Limit (₹)</label>
                    <Input type="number" defaultValue="200000" />
                  </div>
                </div>
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
                  { label: "Name", value: "New Employee" },
                  { label: "Employee Number", value: "BFS011" },
                  { label: "Email", value: "new@corpcardpro.com" },
                  { label: "Department", value: "Product Development" },
                  { label: "Level", value: "Staff" },
                  { label: "Cost Center", value: "App Development (CC-PD-01)" },
                  { label: "Reporting Manager", value: "Deepa Nair" },
                  { label: "Auto-issue Card", value: "Virtual, ₹2L/month" },
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
            <Button>
              <CheckCircle2 className="w-4 h-4" />
              Onboard Employee
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
