import { FileText } from "lucide-react"

import type { Category, SopImportOption, SopStatus } from "./types"

const createBadgeStyles = (): Record<SopStatus, string> => ({
  active: "border-emerald-200 bg-emerald-100 text-emerald-700",
  "in-design": "border-amber-200 bg-amber-100 text-amber-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
})

export const GoogleDocsLogo = () => (
  <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-[#1a73e8] text-white">
    <div className="absolute inset-x-[6px] top-[6px] h-1 rounded bg-white/70" />
    <div className="absolute inset-x-[6px] top-[13px] h-3 rounded bg-white" />
    <div className="absolute inset-x-[6px] bottom-[6px] h-1 rounded bg-[#8ab4f8]" />
    <FileText className="relative h-4 w-4 opacity-60" />
  </div>
)

export const NotionLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-black bg-white font-semibold text-black">
    N
  </div>
)

export const WordLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#185abd] to-[#103f91] font-semibold text-white">
    W
  </div>
)

export const PdfLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d93025] text-xs font-semibold uppercase tracking-wide text-white">
    PDF
  </div>
)

export const SOP_IMPORT_OPTIONS: SopImportOption[] = [
  {
    id: "google-docs",
    name: "Google Docs",
    description: "Import process drafts from shared Google documents.",
    Logo: GoogleDocsLogo,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync workspace pages that your team already maintains.",
    Logo: NotionLogo,
  },
  {
    id: "microsoft-word",
    name: "Microsoft Word",
    description: "Upload .docx files stored in OneDrive or shared drives.",
    Logo: WordLogo,
  },
  {
    id: "pdf",
    name: "PDF Document",
    description: "Attach finalized process PDFs for quick reference and review.",
    Logo: PdfLogo,
  },
]

export const SOP_STATUS_LABELS: Record<SopStatus, string> = {
  active: "Active",
  "in-design": "In design",
  inactive: "Inactive",
}

export const SOP_STATUS_BADGE_STYLES = createBadgeStyles()

export const OWNER_OPTIONS = [
  "Finance Manager",
  "Operations Manager",
  "HR Lead",
  "IT Administrator",
  "Sales Director",
  "Customer Support Lead",
  "Marketing Manager",
  "Product Manager",
  "Legal Counsel",
]

export const PROCESS_CREATOR_NAME = "Olivia Martin"
export const CURRENT_PROCESSOR_NAME = "Jordan Smith"

export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
]

export const DAY_OPTIONS = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
]

export const VAULT_OPTIONS = ["Deel", "Slack", "Jira", "Salesforce", "Notion"]

export const SAMPLE_DATA: Category[] = [
  {
    id: "finance-accounting",
    title: "Finance & Accounting",
    subcategories: [
      { id: "payables", title: "Accounts Payable" },
      { id: "payroll-benefits", title: "Payroll & Benefits Processing" },
    ],
    sops: [
      {
        id: "sop-payroll",
        title: "Payroll & Benefits (Canada, Bi-weekly, Deel)",
        subcategoryId: "payroll-benefits",
        owner: "Finance Manager",
        lastUpdated: "2025-09-10",
        status: "active",
        content: `# Process: Payroll & Benefits Processing (Canada)

**Category:** Finance & Accounting
**System of Record:** Deel

## Purpose
Ensure accurate, timely payroll.

## Process
1. Maintain payroll calendar.
2. Prepare employee changes.
3. Review and approve.`,
        processSettings: {
          owner: "Finance Manager",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "custom",
            customDays: ["monday", "thursday"],
            time: "09:00",
            timezone: "America/New_York",
          },
          vaultAccess: ["Deel", "Notion"],
        },
      },
    ],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    subcategories: [{ id: "hr-onboarding", title: "Employee Onboarding" }],
    sops: [
      {
        id: "sop-hr-onboarding",
        title: "New Hire Onboarding Checklist",
        subcategoryId: "hr-onboarding",
        owner: "HR Lead",
        lastUpdated: "2025-08-01",
        status: "in-design",
        content: `# Process: New Hire Onboarding Checklist

**Category:** Human Resources
**System of Record:** BambooHR

## Purpose
Welcome and equip new employees.

## Process
1. Send welcome email and schedule orientation.
2. Collect required paperwork.
3. Assign mentor and first-week plan.`,
        processSettings: {
          owner: "HR Lead",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "weekly",
            customDays: [],
            time: "10:00",
            timezone: "America/New_York",
          },
          vaultAccess: ["Notion", "Slack"],
        },
      },
    ],
  },
  {
    id: "sales-business",
    title: "Sales & Business Development",
    subcategories: [{ id: "sales-pipeline", title: "Pipeline Management" }],
    sops: [
      {
        id: "sop-sales-pipeline",
        title: "Quarterly Pipeline Review",
        subcategoryId: "sales-pipeline",
        owner: "Sales Director",
        lastUpdated: "2025-07-12",
        status: "active",
        content: `# Process: Quarterly Pipeline Review

**Category:** Sales & Business Development
**System of Record:** Salesforce

## Purpose
Keep pipeline data clean and forecast accurate.

## Process
1. Export current pipeline report.
2. Validate stages with account executives.
3. Update forecast assumptions.`,
        processSettings: {
          owner: "Sales Director",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "quarterly",
            customDays: [],
            time: "14:00",
            timezone: "America/Los_Angeles",
          },
          vaultAccess: ["Salesforce", "Notion"],
        },
      },
    ],
  },
  {
    id: "customer-support",
    title: "Customer Support",
    subcategories: [{ id: "support-escalation", title: "Escalation Management" }],
    sops: [
      {
        id: "sop-support-escalation",
        title: "Critical Incident Escalation",
        subcategoryId: "support-escalation",
        owner: "Customer Support Lead",
        lastUpdated: "2025-06-20",
        status: "active",
        content: `# Process: Critical Incident Escalation

**Category:** Customer Support
**System of Record:** Zendesk

## Purpose
Ensure urgent cases are resolved quickly.

## Process
1. Flag incident priority in ticketing system.
2. Notify on-call specialist and product owner.
3. Post resolution summary to status page.`,
        processSettings: {
          owner: "Customer Support Lead",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "daily",
            customDays: [],
            time: "08:00",
            timezone: "UTC",
          },
          vaultAccess: ["Slack", "Zendesk"],
        },
      },
    ],
  },
  {
    id: "it-security",
    title: "IT & Security",
    subcategories: [{ id: "it-access", title: "Access Management" }],
    sops: [
      {
        id: "sop-it-provisioning",
        title: "Provisioning New Employee Accounts",
        subcategoryId: "it-access",
        owner: "IT Administrator",
        lastUpdated: "2025-09-05",
        status: "inactive",
        content: `# Process: Provisioning New Employee Accounts

**Category:** IT & Security
**System of Record:** Okta

## Purpose
Provide secure access to required systems.

## Process
1. Create core identity in Okta.
2. Assign application groups based on role.
3. Send credentials and security policy.`,
        processSettings: {
          owner: "IT Administrator",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "weekly",
            customDays: ["monday"],
            time: "11:00",
            timezone: "UTC",
          },
          vaultAccess: ["Okta", "Jira"],
        },
      },
    ],
  },
  {
    id: "marketing-communications",
    title: "Marketing & Communications",
    subcategories: [{ id: "marketing-campaign", title: "Campaign Production" }],
    sops: [
      {
        id: "sop-marketing-newsletter",
        title: "Weekly Newsletter Production",
        subcategoryId: "marketing-campaign",
        owner: "Marketing Manager",
        lastUpdated: "2025-05-18",
        status: "in-design",
        content: `# Process: Weekly Newsletter Production

**Category:** Marketing & Communications
**System of Record:** HubSpot

## Purpose
Deliver timely customer communications.

## Process
1. Draft newsletter outline and key message.
2. Collect product and customer updates.
3. Schedule send and monitor metrics.`,
        processSettings: {
          owner: "Marketing Manager",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "weekly",
            customDays: ["wednesday"],
            time: "15:00",
            timezone: "Europe/London",
          },
          vaultAccess: ["Notion", "Slack"],
        },
      },
    ],
  },
  {
    id: "operations-logistics",
    title: "Operations & Logistics",
    subcategories: [{ id: "ops-inventory", title: "Inventory" }],
    sops: [
      {
        id: "sop-ops-inventory",
        title: "Monthly Inventory Reconciliation",
        subcategoryId: "ops-inventory",
        owner: "Operations Manager",
        lastUpdated: "2025-04-09",
        status: "active",
        content: `# Process: Monthly Inventory Reconciliation

**Category:** Operations & Logistics
**System of Record:** NetSuite

## Purpose
Keep stock counts accurate for planning.

## Process
1. Download warehouse counts.
2. Investigate variances over 5%.
3. Post adjustments for approval.`,
        processSettings: {
          owner: "Operations Manager",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "monthly",
            customDays: [],
            time: "09:30",
            timezone: "America/New_York",
          },
          vaultAccess: ["NetSuite", "Slack"],
        },
      },
    ],
  },
  {
    id: "product-engineering",
    title: "Product & Engineering",
    subcategories: [{ id: "product-release", title: "Release Management" }],
    sops: [
      {
        id: "sop-product-release",
        title: "Product Release Go-Live Checklist",
        subcategoryId: "product-release",
        owner: "Product Manager",
        lastUpdated: "2025-03-15",
        status: "active",
        content: `# Process: Product Release Go-Live Checklist

**Category:** Product & Engineering
**System of Record:** Jira

## Purpose
Coordinate smooth release deployments.

## Process
1. Freeze code and tag release candidate.
2. Complete regression testing sign-off.
3. Publish release notes to stakeholders.`,
        processSettings: {
          owner: "Product Manager",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "monthly",
            customDays: [],
            time: "13:00",
            timezone: "UTC",
          },
          vaultAccess: ["Jira", "Slack"],
        },
      },
    ],
  },
  {
    id: "legal-compliance",
    title: "Legal & Compliance",
    subcategories: [{ id: "legal-contract", title: "Contract Review" }],
    sops: [
      {
        id: "sop-legal-contract",
        title: "Standard Contract Review Workflow",
        subcategoryId: "legal-contract",
        owner: "Legal Counsel",
        lastUpdated: "2025-02-22",
        status: "active",
        content: `# Process: Standard Contract Review Workflow

**Category:** Legal & Compliance
**System of Record:** Ironclad

## Purpose
Review and approve standard commercial agreements.

## Process
1. Receive request and confirm contract type.
2. Complete legal review and redlines.
3. Route for signatures and archive.`,
        processSettings: {
          owner: "Legal Counsel",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "monthly",
            customDays: [],
            time: "16:00",
            timezone: "UTC",
          },
          vaultAccess: ["Ironclad", "Slack"],
        },
      },
    ],
  },
]

