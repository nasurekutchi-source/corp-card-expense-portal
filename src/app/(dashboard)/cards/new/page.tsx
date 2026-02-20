"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { demoEmployees } from "@/lib/demo-data";
import {
  ArrowLeft,
  CreditCard,
  Wifi,
  Smartphone,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Shield,
} from "lucide-react";

const steps = ["Card Type", "Limits & Controls", "Review & Submit"];

const cardTypes = [
  { type: "PHYSICAL", label: "Physical Card", desc: "Traditional plastic card with chip & NFC. Delivered in 5-7 business days.", icon: CreditCard },
  { type: "VIRTUAL", label: "Virtual Card", desc: "Instant digital card for online transactions. Available immediately.", icon: Smartphone },
  { type: "SINGLE_USE", label: "Single-Use Card", desc: "One-time virtual card that auto-expires after use. Best for one-off purchases.", icon: Zap },
];

export default function NewCardPage() {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState("VIRTUAL");
  const [limits, setLimits] = useState({ perTransaction: 50000, daily: 100000, monthly: 500000 });

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Request New Card" description="Submit a card request for approval">
        <Button variant="outline" asChild>
          <Link href="/cards">
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
        {/* Step 1: Card Type */}
        {step === 0 && (
          <div className="space-y-3">
            {cardTypes.map((ct) => (
              <Card
                key={ct.type}
                className={`cursor-pointer transition-all ${
                  selectedType === ct.type
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedType(ct.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedType === ct.type ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <ct.icon className={`w-6 h-6 ${selectedType === ct.type ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ct.label}</p>
                        {ct.type === "VIRTUAL" && (
                          <Badge variant="success" className="text-[9px]">Instant</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ct.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedType === ct.type ? "border-primary bg-primary" : "border-muted-foreground/30"
                    } flex items-center justify-center`}>
                      {selectedType === ct.type && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Assign to Employee</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {demoEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Card Network</label>
                <div className="flex gap-2">
                  {["VISA", "MASTERCARD", "RUPAY"].map((net) => (
                    <Button key={net} variant="outline" size="sm" className="flex-1">
                      {net}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Limits */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Spend Limits & Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Per Transaction Limit (₹)</label>
                  <Input
                    type="number"
                    value={limits.perTransaction}
                    onChange={(e) => setLimits((l) => ({ ...l, perTransaction: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Daily Limit (₹)</label>
                  <Input
                    type="number"
                    value={limits.daily}
                    onChange={(e) => setLimits((l) => ({ ...l, daily: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Monthly Limit (₹)</label>
                  <Input
                    type="number"
                    value={limits.monthly}
                    onChange={(e) => setLimits((l) => ({ ...l, monthly: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channel Controls</h4>
                {["POS", "E-Commerce", "Contactless", "Mobile Wallet", "ATM"].map((ch) => (
                  <div key={ch} className="flex items-center justify-between">
                    <span className="text-sm">{ch}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={ch !== "ATM"} className="sr-only peer" />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MCC Restrictions</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {["Gambling", "Crypto", "Liquor", "ATM Cash"].map((mcc) => (
                    <Badge key={mcc} variant="destructive" className="text-[9px]">
                      {mcc} Blocked
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Review Card Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Card Type</p>
                  <p className="font-medium">{selectedType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="font-medium">VISA</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Per Transaction</p>
                  <p className="font-medium">₹{limits.perTransaction.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Daily Limit</p>
                  <p className="font-medium">₹{limits.daily.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Limit</p>
                  <p className="font-medium">₹{limits.monthly.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-medium">Vikram Singh (BFS005)</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t">
                <label className="text-xs font-medium">Justification</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Why is this card needed?"
                  defaultValue="Required for team software subscriptions and SaaS tools."
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-medium">Approval Required</p>
                <p className="mt-0.5 opacity-80">This request will be sent to your Department Manager and Finance Controller for approval.</p>
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
              Submit Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
