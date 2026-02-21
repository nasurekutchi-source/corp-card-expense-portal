"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import {
  Network,
  Users,
  CreditCard,
  SlidersHorizontal,
  ArrowRightLeft,
  Settings,
  CheckCircle2,
  ChevronRight,
  Building2,
  Layers,
  Database,
  Shield,
  CircleDot,
} from "lucide-react";

interface SetupStep {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  details: string[];
  prerequisite?: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    step: 1,
    title: "Configure Platform Settings",
    description: "Set up your tenant branding, modules, and base configuration",
    icon: Settings,
    href: "/settings",
    details: [
      "Set company name and branding (logo, colors)",
      "Enable/disable modules (Expense Management, OCR, AI Assistant)",
      "Configure base currency (INR) and locale settings",
      "Set up notification preferences",
    ],
  },
  {
    step: 2,
    title: "Create Organization Hierarchy",
    description: "Build the Visa/MC 6-level hierarchy: Bank → Program → Company → Division → Department → Cost Center",
    icon: Network,
    href: "/hierarchy",
    details: [
      "Level 1 — Bank: Your issuing bank (e.g., IDFC FIRST Bank)",
      "Level 2 — Program: Card program under the bank (e.g., Corp Card Program)",
      "Level 3 — Company: Legal entity with GSTIN/PAN/CIN (e.g., Bharat Financial Services)",
      "Level 4 — Division: Business unit grouping (e.g., Technology, Sales)",
      "Level 5 — Department: Operational unit with budget (e.g., Engineering, Marketing)",
      "Level 6 — Cost Center: Granular allocation with GL code (e.g., Platform Team, Cloud Infra)",
    ],
    prerequisite: "Complete Step 1 first",
  },
  {
    step: 3,
    title: "Set Card Control Policies",
    description: "Define default card controls at each hierarchy level — these cascade downward",
    icon: SlidersHorizontal,
    href: "/card-policies",
    details: [
      "Company-level defaults: base spend limits, allowed MCC categories, channel controls",
      "Division-level overrides: tighter or looser limits per business unit",
      "Department-level overrides: specific MCC restrictions, geographic controls",
      "Controls cascade: Company → Division → Department → Individual Card",
      "Each level can restrict (never expand) the parent's controls",
    ],
    prerequisite: "Hierarchy must exist (Step 2)",
  },
  {
    step: 4,
    title: "Onboard Employees",
    description: "Add employees and assign them to departments and cost centers",
    icon: Users,
    href: "/employees",
    details: [
      "Add employees one-by-one or bulk import via CSV",
      "Assign each employee to a Department and Cost Center",
      "Set employee level (L1–L8) which determines card eligibility",
      "Employee designation for reference",
      "Verify email and phone for card delivery notifications",
    ],
    prerequisite: "Departments and Cost Centers must exist (Step 2)",
  },
  {
    step: 5,
    title: "Issue Corporate Cards",
    description: "Create and assign cards to employees with appropriate limits",
    icon: CreditCard,
    href: "/cards",
    details: [
      "Choose card type: Physical, Virtual, or Single-Use",
      "Select card network: Visa or Mastercard",
      "Assign to an employee (linked to their department)",
      "Set card-level spend limits (per-transaction, daily, monthly)",
      "Card inherits controls from its hierarchy level by default",
      "Override specific controls at card level if needed",
    ],
    prerequisite: "Employees must be onboarded (Step 4)",
  },
  {
    step: 6,
    title: "Configure Integrations",
    description: "Connect to card management system and set up data flows",
    icon: Layers,
    href: "/settings/integrations",
    details: [
      "Card Management System: API endpoint for freeze/unfreeze, limit changes",
      "Transaction Feed: Real-time or batch transaction ingestion",
      "Notification Service: SMS/Email for card events (auth, decline, settle)",
      "AP Export: Configure format and delivery for accounting system",
      "Currently running in Demo Mode — no external APIs needed",
    ],
    prerequisite: "Complete Steps 1–5 first",
  },
  {
    step: 7,
    title: "Import Historical Data (Optional)",
    description: "Bulk upload existing transactions, cards, or hierarchy via CSV",
    icon: Database,
    href: "/settings/data-management",
    details: [
      "Download CSV templates for each entity type",
      "Upload cards with existing last-4 digits and limits",
      "Upload historical transactions for reporting",
      "Upload hierarchy if migrating from another system",
      "Validate data before import — errors are reported per row",
    ],
    prerequisite: "Steps 1–5 recommended first",
  },
  {
    step: 8,
    title: "Verify & Go Live",
    description: "Test the setup end-to-end before rolling out to employees",
    icon: CheckCircle2,
    href: "/",
    details: [
      "Review Dashboard: verify card counts, spend limits, and hierarchy data",
      "Test Card Controls: try a simulated freeze/unfreeze",
      "Check Transactions: ensure feed is flowing (demo data available)",
      "Verify Hierarchy: expand tree and check all 6 levels",
      "Test Employee Card Assignment: issue a test virtual card",
      "If Expense Management is ON: test expense creation and approval flow",
    ],
    prerequisite: "All previous steps completed",
  },
];

export default function SetupGuidePage() {
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Corp Portal Setup Guide"
        description="Follow these steps to set up your corporate card portal from scratch"
      >
        <Badge variant="outline" className="text-xs">
          <CircleDot className="w-3 h-3 mr-1" />
          8 Steps
        </Badge>
      </PageHeader>

      {/* Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">End-to-End Setup Process</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This guide walks you through setting up a corporate card portal from scratch.
                The Visa/Mastercard network mandates a 6-level hierarchy structure.
                Card controls cascade from company level down to individual cards.
                Follow the steps in order — each builds on the previous.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-[10px]">Visa/MC 6-Level Hierarchy</Badge>
                <Badge variant="secondary" className="text-[10px]">Cascading Card Controls</Badge>
                <Badge variant="secondary" className="text-[10px]">Central Billing</Badge>
                <Badge variant="secondary" className="text-[10px]">Multi-Currency</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4" />
            Visa/MC 6-Level Hierarchy Structure
          </CardTitle>
          <CardDescription className="text-xs">Card controls cascade downward — each level can restrict but never expand parent controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {[
              { level: 1, name: "Bank", example: "IDFC FIRST Bank", desc: "Issuing bank — top of hierarchy" },
              { level: 2, name: "Program", example: "Corp Card Program", desc: "Card program with master limits" },
              { level: 3, name: "Company", example: "Bharat Financial Services", desc: "Legal entity (GSTIN, PAN, CIN)" },
              { level: 4, name: "Division", example: "Technology", desc: "Business unit grouping" },
              { level: 5, name: "Department", example: "Engineering", desc: "Operational unit with budget" },
              { level: 6, name: "Cost Center", example: "Platform Team", desc: "GL code allocation unit" },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-3" style={{ paddingLeft: `${(item.level - 1) * 24}px` }}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  item.level <= 2 ? "bg-primary/20 text-primary" :
                  item.level <= 4 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}>
                  L{item.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">— {item.example}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Card Control Cascade: Company defaults → Division overrides → Department overrides → Card-level overrides
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {SETUP_STEPS.map((step) => (
          <Card key={step.step} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono">
                    Step {step.step}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  {step.prerequisite && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      Prerequisite: {step.prerequisite}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" asChild>
                    <Link href={step.href}>
                      Go to {step.title.split(" ").slice(0, 2).join(" ")}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
