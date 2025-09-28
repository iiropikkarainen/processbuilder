"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  ListChecks,
  Maximize2,
  MoreHorizontal,
  Minimize2,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import WorkflowBuilder from "./workflow-builder"
import { ProcessEditor, extractPlainText } from "./process-editor"
import { cn } from "@/lib/utils"
import {
  deadlinesAreEqual,
  describeInputStartTrigger,
  describeOutputAlerts,
  describeOutputCompletion,
} from "@/lib/workflow-utils"
import type {
  ProcessDeadline,
  Task,
  Workflow,
  WorkflowNode,
  NodeData,
  OutputRequirementType,
  OutputSubmission,
} from "@/lib/types"
import type { Database } from "@/types/supabase"

type Subcategory = {
  id: string
  title: string
}

type ProcessSettings = {
  owner: string
  processType: "one-time" | "recurring"
  oneTimeDeadline: ProcessDeadline | null
  recurrence: {
    frequency: "custom" | "daily" | "weekly" | "monthly" | "quarterly" | "annually"
    customDays: string[]
    time: string
    timezone: string
  }
  vaultAccess: string[]
}

type SopStatus = "active" | "in-design" | "inactive"

type Sop = {
  id: string
  title: string
  subcategoryId: string
  owner: string
  lastUpdated: string
  status: SopStatus
  content: string
  processSettings: ProcessSettings
}

type Category = {
  id: string
  title: string
  subcategories: Subcategory[]
  sops: Sop[]
  supabaseId?: string
}

interface OpsCatalogProps {
  query: string
}

type SopImportOption = {
  id: string
  name: string
  description: string
  Logo: () => JSX.Element
}

const GoogleDocsLogo = () => (
  <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-[#1a73e8] text-white">
    <div className="absolute inset-x-[6px] top-[6px] h-1 rounded bg-white/70" />
    <div className="absolute inset-x-[6px] top-[13px] h-3 rounded bg-white" />
    <div className="absolute inset-x-[6px] bottom-[6px] h-1 rounded bg-[#8ab4f8]" />
    <FileText className="relative h-4 w-4 opacity-60" />
  </div>
)

const NotionLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-black bg-white font-semibold text-black">
    N
  </div>
)

const WordLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#185abd] to-[#103f91] font-semibold text-white">
    W
  </div>
)

const PdfLogo = () => (
  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d93025] text-xs font-semibold uppercase tracking-wide text-white">
    PDF
  </div>
)

const SOP_IMPORT_OPTIONS: SopImportOption[] = [
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

const SAMPLE_DATA: Category[] = [
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
        status: "inactive",
        content: `# Process: Standard Contract Review Workflow

**Category:** Legal & Compliance
**System of Record:** Ironclad

## Purpose
Ensure consistent legal risk evaluation.

## Process
1. Log request and classify agreement type.
2. Review clauses against playbook.
3. Send final approval summary to requestor.`,
        processSettings: {
          owner: "Legal Counsel",
          processType: "recurring",
          oneTimeDeadline: null,
          recurrence: {
            frequency: "weekly",
            customDays: ["tuesday"],
            time: "16:00",
            timezone: "America/New_York",
          },
          vaultAccess: ["Notion", "Slack"],
        },
      },
    ],
  },
]

const SOP_STATUS_LABELS: Record<SopStatus, string> = {
  active: "Active",
  "in-design": "In design",
  inactive: "Inactive",
}

const SOP_STATUS_BADGE_STYLES: Record<SopStatus, string> = {
  active: "border-emerald-200 bg-emerald-100 text-emerald-700",
  "in-design": "border-amber-200 bg-amber-100 text-amber-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
}

const OWNER_OPTIONS = [
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

const PROCESS_CREATOR_NAME = "Olivia Martin"
const CURRENT_PROCESSOR_NAME = "Jordan Smith"

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
]

const DAY_OPTIONS = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
]

const VAULT_OPTIONS = ["Deel", "Slack", "Jira", "Salesforce", "Notion"]

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const buildSopContent = (title: string, prompt?: string) => {
  const baseTemplate = `# Process: ${title}

## Purpose
Describe the goal of the procedure.

## Process
1. Document the first step.
2. Capture supporting tasks.
3. Confirm completion with stakeholders.`

  if (!prompt) {
    return baseTemplate
  }

  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    return baseTemplate
  }

  return `${baseTemplate}

---
_AI generation prompt_
${trimmedPrompt}`
}

interface ProcessViewProps {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
  onLastProcessDeadlineChange?: (deadline: ProcessDeadline | null) => void
  onWorkflowUpdate?: (workflow: Workflow) => void
}

const ProcessView = ({
  tasks,
  setTasks,
  onLastProcessDeadlineChange,
  onWorkflowUpdate,
}: ProcessViewProps) => {
  const unassignedTasks = useMemo(() => tasks.filter((task) => !task.nodeId), [tasks])

  const assignTaskToNode = useCallback(
    (taskId: number, nodeId: string | null) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, nodeId } : task)),
      )
    },
    [setTasks],
  )

  const handleDueDateChange = useCallback(
    (taskId: number, date: string) => {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, due: date } : task)))
    },
    [setTasks],
  )

  const handleMarkDone = useCallback(
    (taskId: number) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: true,
                completedBy: CURRENT_PROCESSOR_NAME,
                completedAt: new Date().toLocaleString(),
              }
            : task,
        ),
      )
    },
    [setTasks],
  )

  const handleCreateTask = useCallback(
    (nodeId: string, text: string) => {
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now(),
          text,
          due: "",
          completed: false,
          completedBy: "",
          completedAt: null,
          nodeId,
        },
      ])
    },
    [setTasks],
  )

  return (
    <WorkflowBuilder
      className="h-full bg-white"
      tasks={tasks}
      availableTasks={unassignedTasks}
      onAssignTask={assignTaskToNode}
      onUpdateTaskDueDate={handleDueDateChange}
      onMarkTaskDone={handleMarkDone}
      onCreateTask={handleCreateTask}
      onLastProcessDeadlineChange={onLastProcessDeadlineChange}
      onWorkflowUpdate={onWorkflowUpdate}
    />
  )
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type NodeStatus = "pending" | "in-progress" | "completed" | "unassigned"
type NodeStatusFilter = NodeStatus | "all"

const NODE_STATUS_FILTERS: { value: NodeStatusFilter; label: string }[] = [
  { value: "all", label: "All steps" },
  { value: "pending", label: "Upcoming" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "unassigned", label: "Unassigned" },
]

const NODE_STATUS_LABELS: Record<NodeStatus, string> = {
  pending: "Upcoming",
  "in-progress": "In progress",
  completed: "Completed",
  unassigned: "Unassigned",
}

const NODE_STATUS_BADGE_STYLES: Record<NodeStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  "in-progress": "border-sky-200 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unassigned: "border-slate-200 bg-slate-50 text-slate-600",
}

type DeadlineInfo = { label: string; absoluteDate: Date | null }
type AssignmentInfo = { label: string; notes: string[] }
type OutputRequirementInfo = {
  label: string
  notes: string[]
  type: OutputRequirementType
}

const OUTPUT_ACTION_LABELS: Record<OutputRequirementType, string> = {
  markDone: "Marked step complete",
  file: "Uploaded supporting file",
  link: "Provided link or URL",
  text: "Submitted text update",
}

type OutputSubmissionPayload = {
  type: OutputRequirementType
  value: string
  fileName?: string
}

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

const formatDateTime = (date: Date): string =>
  date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

const getDeadlineInfo = (data?: NodeData | null): DeadlineInfo => {
  if (!data) {
    return { label: "—", absoluteDate: null }
  }

  if (data.deadlineType === "absolute" && data.deadlineAbsolute) {
    const parsed = parseDateValue(data.deadlineAbsolute)
    if (parsed) {
      return { label: formatDateTime(parsed), absoluteDate: parsed }
    }

    return { label: data.deadlineAbsolute, absoluteDate: null }
  }

  if (data.deadlineType === "relative" && data.deadlineRelativeValue) {
    const unit = data.deadlineRelativeUnit === "hours" ? "hours" : "days"
    return { label: `+${data.deadlineRelativeValue} ${unit}`, absoluteDate: null }
  }

  return { label: "—", absoluteDate: null }
}

const getAssignmentInfo = (data?: NodeData | null): AssignmentInfo => {
  if (!data) {
    return { label: "Unassigned", notes: ["Assign a processor in the Process Designer."] }
  }

  const baseLabel =
    data.assignmentType === "role"
      ? data.assignedRole?.trim()
      : data.assignedProcessor?.trim()

  const notes: string[] = []

  if (data.allowReassignment) {
    notes.push("Reassignment allowed")
  }

  if (data.approver) {
    notes.push(`Approver: ${data.approver}`)
  }

  if (!baseLabel) {
    notes.push("Assign a processor in the Process Designer.")
  }

  return { label: baseLabel || "Unassigned", notes }
}

const getOutputRequirementInfo = (data?: NodeData | null): OutputRequirementInfo => {
  const requirementMap: Record<OutputRequirementType | undefined, string> = {
    markDone: "Status",
    file: "Upload supporting file",
    link: "Provide link or URL",
    text: "Submit text update",
    undefined: "Status",
  }

  const requirementType = data?.outputRequirementType ?? "markDone"
  const label = requirementMap[requirementType]
  const notes: string[] = []

  if (data?.outputStructuredDataTemplate) {
    notes.push("Structured data template provided")
  }

  if (data?.validationRequireOutput) {
    notes.push("Requires validation")
  }

  if (data?.validationNotes) {
    notes.push(data.validationNotes)
  }

  return { label, notes, type: requirementType }
}

const buildCompletionLog = (tasks: Task[], submission?: OutputSubmission): string[] => {
  const taskLogs = tasks
    .filter((task) => task.completed && task.completedAt)
    .map((task) => {
      const parsed = parseDateValue(task.completedAt)
      const dateLabel = parsed ? formatDateTime(parsed) : task.completedAt ?? ""
      const actor = task.completedBy || "Unknown processor"
      return `${actor} • ${dateLabel}`
    })

  if (!submission) {
    return taskLogs
  }

  const parsed = parseDateValue(submission.completedAt)
  const dateLabel = parsed ? formatDateTime(parsed) : submission.completedAt
  const actionLabel = OUTPUT_ACTION_LABELS[submission.type] || "Completed output"
  const actor = submission.completedBy || "Unknown processor"

  return [`${actor} • ${actionLabel} • ${dateLabel}`, ...taskLogs]
}

const OutputRequirementAction = ({
  nodeId,
  info,
  submission,
  onSubmit,
  variant = "table",
}: {
  nodeId: string
  info: OutputRequirementInfo
  submission?: OutputSubmission
  onSubmit: (nodeId: string, payload: OutputSubmissionPayload) => void
  variant?: "table" | "card"
}) => {
  const [isEditing, setIsEditing] = useState(info.type !== "markDone" && !submission)
  const [linkValue, setLinkValue] = useState(submission?.type === "link" ? submission.value : "")
  const [textValue, setTextValue] = useState(submission?.type === "text" ? submission.value : "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (info.type === "markDone") {
      setIsEditing(false)
      return
    }

    setIsEditing(!submission)
  }, [submission, info.type])

  useEffect(() => {
    if (submission?.type === "link") {
      setLinkValue(submission.value)
    } else if (!submission) {
      setLinkValue("")
    }
  }, [submission])

  useEffect(() => {
    if (submission?.type === "text") {
      setTextValue(submission.value)
    } else if (!submission) {
      setTextValue("")
    }
  }, [submission])

  useEffect(() => {
    if (!isEditing) {
      setSelectedFile(null)
    }
  }, [isEditing])

  const formattedCompletionDate = submission
    ? (() => {
        const parsed = parseDateValue(submission.completedAt)
        return parsed ? formatDateTime(parsed) : submission.completedAt
      })()
    : ""

  const handleMarkDone = () => {
    onSubmit(nodeId, { type: "markDone", value: "Marked complete" })
  }

  const handleFileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) return

    onSubmit(nodeId, {
      type: "file",
      value: selectedFile.name,
      fileName: selectedFile.name,
    })
    setSelectedFile(null)
    setIsEditing(false)
  }

  const handleLinkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = linkValue.trim()
    if (!trimmed) return

    onSubmit(nodeId, { type: "link", value: trimmed })
    setIsEditing(false)
  }

  const handleTextSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = textValue.trim()
    if (!trimmed) return

    onSubmit(nodeId, { type: "text", value: trimmed })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (submission?.type === "link") {
      setLinkValue(submission.value)
    } else if (!submission) {
      setLinkValue("")
    }

    if (submission?.type === "text") {
      setTextValue(submission.value)
    } else if (!submission) {
      setTextValue("")
    }

    setSelectedFile(null)
    setIsEditing(false)
  }

  let submissionDetail: ReactNode = null
  if (submission) {
    switch (submission.type) {
      case "file":
        submissionDetail = (
          <div className="text-emerald-700">
            File: <span className="font-medium break-all">{submission.fileName ?? submission.value}</span>
          </div>
        )
        break
      case "link":
        submissionDetail = (
          <a
            href={submission.value}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-emerald-700 underline"
          >
            Open submitted link
          </a>
        )
        break
      case "text":
        submissionDetail = (
          <div className="whitespace-pre-wrap text-emerald-700">{submission.value}</div>
        )
        break
      case "markDone":
      default:
        submissionDetail = null
        break
    }
  }

  const renderActionForm = () => {
    switch (info.type) {
      case "markDone":
        return (
          <Button type="button" size="sm" onClick={handleMarkDone} className="w-fit">
            Mark as done
          </Button>
        )
      case "file":
        return (
          <form onSubmit={handleFileSubmit} className="space-y-2">
            <Input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={!selectedFile}>
                Upload file
              </Button>
              {submission ? (
                <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
            {selectedFile ? (
              <p className="text-xs text-muted-foreground">
                Ready to upload: <span className="font-medium">{selectedFile.name}</span>
              </p>
            ) : null}
          </form>
        )
      case "link": {
        const trimmedLink = linkValue.trim()
        return (
          <form onSubmit={handleLinkSubmit} className="space-y-2">
            <Input
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://example.com/update"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={!trimmedLink}>
                Save link
              </Button>
              {submission ? (
                <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        )
      }
      case "text": {
        const trimmedText = textValue.trim()
        return (
          <form onSubmit={handleTextSubmit} className="space-y-2">
            <Textarea
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              rows={variant === "table" ? 3 : 4}
              placeholder="Provide an update for this step"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={!trimmedText}>
                Submit response
              </Button>
              {submission ? (
                <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        )
      }
      default:
        return null
    }
  }

  const actionForm = renderActionForm()
  const labelText = info.label

  return (
    <div className={cn("text-sm text-foreground", variant === "card" ? "space-y-3" : "space-y-2")}
    >
      <div className="font-medium">{labelText}</div>
      {info.notes.length > 0 ? (
        <div className="space-y-1 text-xs text-muted-foreground">
          {info.notes.map((note, index) => (
            <span key={index} className="block">
              {note}
            </span>
          ))}
        </div>
      ) : null}
      {submission && (!isEditing || info.type === "markDone") ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <div className="space-y-1">
              <div className="font-semibold text-emerald-800">
                {OUTPUT_ACTION_LABELS[submission.type] || "Completed output"}
              </div>
              {submissionDetail}
              <div className="text-emerald-600">
                Completed by {submission.completedBy} on {formattedCompletionDate}
              </div>
            </div>
          </div>
          {info.type !== "markDone" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start px-0 text-xs font-medium text-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
            >
              Update submission
            </Button>
          ) : null}
        </div>
      ) : (
        info.type === "markDone" ? <div className="pt-1">{actionForm}</div> : actionForm
      )}
    </div>
  )
}

const determineNodeStatus = (
  assignmentInfo: AssignmentInfo,
  nodeTasks: Task[],
  completionLog: string[],
): NodeStatus => {
  const normalizedAssignment = assignmentInfo.label?.trim().toLowerCase()

  if (!normalizedAssignment || normalizedAssignment === "unassigned") {
    return "unassigned"
  }

  if (completionLog.length > 0) {
    return "completed"
  }

  if (nodeTasks.length > 0) {
    const completedCount = nodeTasks.filter((task) => task.completed).length

    if (completedCount === nodeTasks.length) {
      return "completed"
    }

    if (completedCount > 0) {
      return "in-progress"
    }
  }

  return "pending"
}

interface CalendarViewProps {
  tasks: Task[]
  workflow: Workflow | null
  processName: string
  outputSubmissions: Record<string, OutputSubmission | undefined>
  onSubmitOutput: (nodeId: string, payload: OutputSubmissionPayload) => void
}

type CalendarEntry = {
  id: string
  task: Task | null
  node: WorkflowNode | null
  dueDate: Date
}

const CalendarView = ({
  tasks,
  workflow,
  processName,
  outputSubmissions,
  onSubmitOutput,
}: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const workflowNodes = workflow?.nodes ?? []

  const processNodes = useMemo(
    () => workflowNodes.filter((node) => node.type === "process"),
    [workflowNodes],
  )
  const inputNodes = useMemo(
    () => workflowNodes.filter((node) => node.type === "input"),
    [workflowNodes],
  )
  const outputNodes = useMemo(
    () => workflowNodes.filter((node) => node.type === "output"),
    [workflowNodes],
  )

  const tasksByNode = useMemo(() => {
    const map = new Map<string, Task[]>()

    tasks.forEach((task) => {
      if (!task.nodeId) return
      const current = map.get(task.nodeId) ?? []
      current.push(task)
      map.set(task.nodeId, current)
    })

    return map
  }, [tasks])

  const [statusFilter, setStatusFilter] = useState<NodeStatusFilter>("all")

  const processNodeDetails = useMemo(() => {
    return processNodes.map((node) => {
      const nodeData = node.data as NodeData | undefined
      const nodeTasks = tasksByNode.get(node.id) ?? []
      const submission = outputSubmissions[node.id]
      const completedTaskCount = nodeTasks.filter((task) => task.completed).length
      const totalActionCount = nodeTasks.length + 1
      const completedActionCount = completedTaskCount + (submission ? 1 : 0)
      const progressPercent = totalActionCount
        ? Math.round((completedActionCount / totalActionCount) * 100)
        : 0
      const deadlineInfo = getDeadlineInfo(nodeData)
      const assignmentInfo = getAssignmentInfo(nodeData)
      const outputInfo = getOutputRequirementInfo(nodeData)
      const completionLog = buildCompletionLog(nodeTasks, submission)
      const nodeStatus = determineNodeStatus(assignmentInfo, nodeTasks, completionLog)

      return {
        node,
        nodeData,
        nodeTasks,
        completedTaskCount,
        completedActionCount,
        totalActionCount,
        progressPercent,
        deadlineInfo,
        assignmentInfo,
        outputInfo,
        completionLog,
        outputSubmission: submission,
        nodeStatus,
      }
    })
  }, [processNodes, tasksByNode, outputSubmissions])

  const statusCounts = useMemo(
    () =>
      processNodeDetails.reduce<Record<NodeStatus, number>>(
        (acc, detail) => {
          acc[detail.nodeStatus] += 1
          return acc
        },
        { pending: 0, "in-progress": 0, completed: 0, unassigned: 0 },
      ),
    [processNodeDetails],
  )

  const filteredProcessNodes = useMemo(() => {
    if (statusFilter === "all") {
      return processNodeDetails
    }

    return processNodeDetails.filter((detail) => detail.nodeStatus === statusFilter)
  }, [processNodeDetails, statusFilter])

  const calendarEntries = useMemo(() => {
    const entries: CalendarEntry[] = []
    const processNodesById = new Map(processNodes.map((node) => [node.id, node]))

    tasks.forEach((task) => {
      const node = task.nodeId ? processNodesById.get(task.nodeId) ?? null : null
      let dueDate = parseDateValue(task.due)

      if (!dueDate && node) {
        const { absoluteDate } = getDeadlineInfo(node.data as NodeData)
        dueDate = absoluteDate
      }

      if (dueDate) {
        entries.push({
          id: `task-${task.id}-${dueDate.getTime()}`,
          task,
          node,
          dueDate,
        })
      }
    })

    processNodes.forEach((node) => {
      const { absoluteDate } = getDeadlineInfo(node.data as NodeData)
      if (!absoluteDate) return

      const alreadyIncluded = entries.some(
        (entry) => entry.node?.id === node.id && entry.dueDate.getTime() === absoluteDate.getTime(),
      )

      if (!alreadyIncluded) {
        entries.push({
          id: `node-${node.id}-${absoluteDate.getTime()}`,
          task: null,
          node,
          dueDate: absoluteDate,
        })
      }
    })

    return entries.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }, [tasks, processNodes])

  const entriesForMonth = useMemo(
    () =>
      calendarEntries.filter(
        (entry) =>
          entry.dueDate.getFullYear() === currentMonth.getFullYear() &&
          entry.dueDate.getMonth() === currentMonth.getMonth(),
      ),
    [calendarEntries, currentMonth],
  )

  useEffect(() => {
    if (entriesForMonth.length === 0) {
      setSelectedDate(null)
      return
    }

    if (
      !selectedDate ||
      selectedDate.getFullYear() !== currentMonth.getFullYear() ||
      selectedDate.getMonth() !== currentMonth.getMonth()
    ) {
      setSelectedDate(entriesForMonth[0].dueDate)
    }
  }, [entriesForMonth, selectedDate, currentMonth])

  const tasksByDate = useMemo(() => {
    return entriesForMonth.reduce<Record<string, CalendarEntry[]>>((acc, entry) => {
      const key = entry.dueDate.toDateString()
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(entry)
      return acc
    }, {})
  }, [entriesForMonth])

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const startWeekday = startOfMonth.getDay()
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const primaryInput = inputNodes[0]?.data as NodeData | undefined
  const primaryOutput = outputNodes[0]?.data as NodeData | undefined

  const inputLabel = primaryInput?.label || "Input"
  const inputDescription =
    primaryInput?.description ||
    "Add an input node in the Process Designer to describe what processors receive."
  const inputTriggerNote = primaryInput ? describeInputStartTrigger(primaryInput) : null

  const outputLabel = primaryOutput?.label || "Output"
  const outputDescription =
    primaryOutput?.description ||
    "Add an output node to capture the expected deliverable for this process."
  const outputCompletionNote = primaryOutput
    ? describeOutputCompletion(primaryOutput)
    : null
  const outputAlertsNote = primaryOutput
    ? describeOutputAlerts(primaryOutput.outputAlertChannels)
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Processor schedule</h3>
            <p className="text-sm text-gray-500">
              {processName
                ? `Due dates for ${processName}`
                : "Select a process to review upcoming work."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Prev
            </button>
            <div className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-900">
              {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: totalCells }).map((_, index) => {
            const dayNumber = index - startWeekday + 1
            if (dayNumber < 1 || dayNumber > daysInMonth) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-20 rounded-lg border border-dashed border-transparent"
                />
              )
            }

            const dateObj = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              dayNumber,
            )
            const dateKey = dateObj.toDateString()
            const entriesForDay = tasksByDate[dateKey] ?? []
            const isSelected = selectedDate?.toDateString() === dateKey

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => setSelectedDate(dateObj)}
                className={cn(
                  "flex h-20 flex-col rounded-lg border bg-white p-2 text-left transition",
                  entriesForDay.length > 0
                    ? "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                  isSelected && "ring-2 ring-blue-500",
                )}
              >
                <div className="text-sm font-semibold text-gray-900">{dayNumber}</div>
                <div className="mt-auto space-y-1">
                  {entriesForDay.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      className="truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      {entry.node?.data?.label ?? entry.task?.text ?? "Task"}
                    </div>
                  ))}
                  {entriesForDay.length > 2 ? (
                    <div className="text-[10px] text-blue-600">
                      +{entriesForDay.length - 2} more
                    </div>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>

      </div>

      <Card>
        <CardHeader className="gap-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {processName || "Select a process"}
            </CardTitle>
            <CardDescription>
              {processName
                ? "View the same configuration shown in the Process Designer."
                : "Choose a process to explore node assignments and expectations."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {NODE_STATUS_FILTERS.map((filter) => {
              const count =
                filter.value === "all"
                  ? processNodeDetails.length
                  : statusCounts[filter.value]
              const isActive = statusFilter === filter.value

              return (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className="rounded-full"
                  onClick={() => setStatusFilter(filter.value)}
                  disabled={processNodeDetails.length === 0 && filter.value !== "all"}
                >
                  {filter.label}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {count}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-6 border-b border-border/60 px-6 py-6 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                {inputLabel}
              </span>
              <p className="text-sm text-foreground">{inputDescription}</p>
              {inputTriggerNote ? (
                <p className="text-xs text-muted-foreground">Start trigger: {inputTriggerNote}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                {outputLabel}
              </span>
              <p className="text-sm text-foreground">{outputDescription}</p>
              {outputCompletionNote ? (
                <p className="text-xs text-muted-foreground">{outputCompletionNote}</p>
              ) : null}
              {outputAlertsNote ? (
                <p className="text-xs text-muted-foreground">{outputAlertsNote}</p>
              ) : null}
            </div>
          </div>
          {filteredProcessNodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="w-[260px] text-[11px] uppercase tracking-wide">
                    Process node
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Deadline
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">
                    Assignment
                  </TableHead>
                  <TableHead className="w-[260px] text-right text-[11px] uppercase tracking-wide">
                    Completion log
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcessNodes.map((detail) => (
                  <TableRow key={detail.node.id} className="border-border/60">
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="text-sm font-semibold text-foreground">
                                {detail.node.data?.label || "Process step"}
                              </span>
                              {detail.node.data?.description ? (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {detail.node.data.description}
                                </p>
                              ) : null}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "whitespace-nowrap border px-2.5 py-0.5 text-xs font-medium",
                                NODE_STATUS_BADGE_STYLES[detail.nodeStatus],
                              )}
                            >
                              {NODE_STATUS_LABELS[detail.nodeStatus]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                              {detail.completedActionCount}/{detail.totalActionCount} actions complete
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                              ID: {detail.node.id}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                              {detail.progressPercent}% complete
                            </span>
                          </div>
                        </div>
                        {detail.nodeTasks.length > 0 ? (
                          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                              Linked tasks
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {detail.nodeTasks.map((task) => (
                                <li key={task.id} className="leading-snug">
                                  • {task.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2 text-sm text-foreground">
                        <span className="font-medium">{detail.deadlineInfo.label}</span>
                        {detail.nodeTasks.some((task) => task.due) ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {detail.nodeTasks
                              .filter((task) => task.due)
                              .map((task) => {
                                const parsed = parseDateValue(task.due)
                                const label = parsed ? formatDateTime(parsed) : task.due

                                return <span key={`due-${task.id}`}>Task due: {label}</span>
                              })}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <OutputRequirementAction
                        nodeId={detail.node.id}
                        info={detail.outputInfo}
                        submission={detail.outputSubmission}
                        onSubmit={onSubmitOutput}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-2 text-sm text-foreground">
                        <span className="font-medium">{detail.assignmentInfo.label}</span>
                        {detail.assignmentInfo.notes.length > 0 ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {detail.assignmentInfo.notes.map((note, index) => (
                              <span key={index}>{note}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      {detail.completionLog.length > 0 ? (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {detail.completionLog.map((log, index) => (
                            <span key={index} className="block">
                              {log}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No completions recorded yet.
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 items-center justify-center px-6 text-sm text-muted-foreground">
              {processNodeDetails.length
                ? "No process nodes match the current filters."
                : "Configure process nodes in the Process Designer to populate the Processor Portal."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface ProcessSettingsViewProps {
  settings: ProcessSettings | null
  onChange: (settings: ProcessSettings) => void
}

const ProcessSettingsView = ({ settings, onChange }: ProcessSettingsViewProps) => {
  if (!settings) {
    return (
      <div className="text-sm text-gray-500">
        Select a Process from the catalog to configure its process settings.
      </div>
    )
  }

  const recurrenceOptions: { value: ProcessSettings["recurrence"]["frequency"]; label: string }[] = [
    { value: "custom", label: "Custom (selected days)" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
  ]

  const handleOwnerChange = (value: string) => {
    onChange({
      ...settings,
      owner: value,
    })
  }

  const handleProcessTypeChange = (value: string) => {
    onChange({
      ...settings,
      processType: value as ProcessSettings["processType"],
    })
  }

  const handleFrequencyChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: {
        ...settings.recurrence,
        frequency: value as ProcessSettings["recurrence"]["frequency"],
      },
    })
  }

  const handleTimeChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, time: value },
    })
  }

  const handleTimezoneChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, timezone: value },
    })
  }

  const toggleCustomDay = (day: string) => {
    const existingDays = settings.recurrence.customDays
    const nextDays = existingDays.includes(day)
      ? existingDays.filter((value) => value !== day)
      : [...existingDays, day]

    const orderedDays = DAY_OPTIONS.map((option) => option.value).filter((value) =>
      nextDays.includes(value),
    )

    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, customDays: orderedDays },
    })
  }

  const toggleVaultAccess = (tool: string) => {
    const { vaultAccess } = settings
    const nextTools = vaultAccess.includes(tool)
      ? vaultAccess.filter((value) => value !== tool)
      : [...vaultAccess, tool]

    onChange({
      ...settings,
      vaultAccess: nextTools,
    })
  }

  const recurrenceSummary = (() => {
    if (settings.processType === "one-time") {
      return "This process will run a single time. Use the process view to coordinate execution."
    }

    const time = settings.recurrence.time
    const timezone = settings.recurrence.timezone

    switch (settings.recurrence.frequency) {
      case "daily":
        return `Runs every day at ${time} (${timezone}).`
      case "weekly":
        return `Runs every week at ${time} (${timezone}).`
      case "monthly":
        return `Runs every month at ${time} (${timezone}).`
      case "quarterly":
        return `Runs every quarter at ${time} (${timezone}).`
      case "annually":
        return `Runs every year at ${time} (${timezone}).`
      case "custom":
      default: {
        const selectedDays = DAY_OPTIONS.filter((option) =>
          settings.recurrence.customDays.includes(option.value),
        ).map((option) => option.label)

        if (!selectedDays.length) {
          return `Recurring schedule saved. Select at least one day to define when the process runs at ${time} (${timezone}).`
        }

        return `Runs on ${selectedDays.join(", ")} at ${time} (${timezone}).`
      }
    }
  })()

  const deadlineInfo = (() => {
    const deadline = settings.oneTimeDeadline ?? null

    if (!deadline) {
      return {
        summary:
          "No deadline synced yet. Configure the final process step's deadline to populate this field.",
        source: null as string | null,
      }
    }

    if (deadline.type === "absolute") {
      let formatted = deadline.value
      const parsed = new Date(deadline.value)
      if (!Number.isNaN(parsed.getTime())) {
        formatted = parsed.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      }

      return {
        summary: `Due by ${formatted}.`,
        source: deadline.nodeLabel ?? null,
      }
    }

    const rawValue = deadline.value.trim()
    const displayValue = rawValue || deadline.value
    const numericValue = Number(rawValue)
    const isSingular = !Number.isNaN(numericValue) && Math.abs(numericValue) === 1
    const unitLabel =
      deadline.unit === "hours"
        ? isSingular
          ? "hour"
          : "hours"
        : isSingular
          ? "day"
          : "days"

    return {
      summary: `Due ${displayValue} ${unitLabel} after dependencies finish.`,
      source: deadline.nodeLabel ?? null,
    }
  })()

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Process owner</h3>
          <p className="text-xs text-gray-500">
            Enter the email address of the person accountable for the execution and maintenance of
            this process.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="process-owner">Owner email</Label>
          <Input
            id="process-owner"
            type="email"
            autoComplete="email"
            placeholder="owner@example.com"
            value={settings.owner}
            onChange={(event) => handleOwnerChange(event.target.value)}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Scheduling</h3>
          <p className="text-xs text-gray-500">
            Configure when this process should run as a one-time handoff or a recurring workflow.
          </p>
        </div>

        <Tabs value={settings.processType} onValueChange={handleProcessTypeChange}>
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="one-time">One-time process</TabsTrigger>
            <TabsTrigger value="recurring">Recurring process</TabsTrigger>
          </TabsList>
          <TabsContent value="one-time" className="mt-4 space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              This process will execute once. Use assignments and due dates in the process view to
              manage work.
            </div>
            <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">Deadline</div>
                <p className="text-xs text-gray-500">
                  Synced from the final process step&apos;s deadline rules in the Process Designer.
                </p>
              </div>
              <p className="text-sm text-gray-700">{deadlineInfo.summary}</p>
              {deadlineInfo.source ? (
                <p className="text-xs text-gray-500">Source step: “{deadlineInfo.source}”</p>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="recurring" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Frequency</Label>
                <RadioGroup
                  className="grid gap-2 md:grid-cols-2"
                  value={settings.recurrence.frequency}
                  onValueChange={handleFrequencyChange}
                >
                  {recurrenceOptions.map((option) => {
                    const id = `recurrence-${option.value}`
                    return (
                      <div
                        key={option.value}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <RadioGroupItem id={id} value={option.value} className="mt-1" />
                        <div>
                          <Label htmlFor={id} className="text-sm font-medium">
                            {option.label}
                          </Label>
                        </div>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {settings.recurrence.frequency === "custom" && (
                <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium">Select days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const id = `custom-day-${day.value}`
                      const checked = settings.recurrence.customDays.includes(day.value)
                      return (
                        <div
                          key={day.value}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2",
                            checked && "border-blue-500 bg-blue-50",
                          )}
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={() => toggleCustomDay(day.value)}
                          />
                          <Label htmlFor={id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrence-time">Start time</Label>
                  <Input
                    id="recurrence-time"
                    type="time"
                    value={settings.recurrence.time}
                    onChange={(event) => handleTimeChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence-timezone">Timezone</Label>
                  <Select
                    value={settings.recurrence.timezone}
                    onValueChange={handleTimezoneChange}
                  >
                    <SelectTrigger id="recurrence-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Vault access</h3>
          <p className="text-xs text-gray-500">
            Grant processors access to the tools they need when this process runs.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {VAULT_OPTIONS.map((tool) => {
            const id = `vault-${tool}`
            const checked = settings.vaultAccess.includes(tool)
            return (
              <div
                key={tool}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  checked && "border-emerald-500 bg-emerald-50",
                )}
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleVaultAccess(tool)}
                />
                <div>
                  <Label htmlFor={id} className="text-sm font-medium">
                    {tool}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {checked ? "Access will be provisioned automatically." : "Click to provision access."}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600 shadow-sm">
        {recurrenceSummary}
      </div>
    </div>
  )
}

const filterData = (data: Category[], query: string) => {
  if (!query) return data

  const lowerQuery = query.toLowerCase()

  return data
    .map((category) => {
      const matchingSops = category.sops.filter((sop) =>
        [sop.title, sop.owner].some((field) => field.toLowerCase().includes(lowerQuery)),
      )

      const matchesCategory = category.title.toLowerCase().includes(lowerQuery)

      if (!matchingSops.length && !matchesCategory) {
        return null
      }

      return {
        ...category,
        sops: matchesCategory ? category.sops : matchingSops,
      }
    })
    .filter((category): category is Category => Boolean(category))
}

export default function OpsCatalog({ query }: OpsCatalogProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedSOP, setSelectedSOP] = useState<Sop | null>(null)
  const [data, setData] = useState<Category[]>(SAMPLE_DATA)
  const [fullscreen, setFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<"editor" | "process" | "calendar" | "settings">(
    "editor",
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [processSettings, setProcessSettings] = useState<ProcessSettings | null>(null)
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [outputSubmissions, setOutputSubmissions] = useState<
    Record<string, OutputSubmission | undefined>
  >({})

  const supabase = useSupabaseClient<Database>()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateUrlForSelectedSop = useCallback(
    (sop: Sop | null) => {
      const currentProcessId = searchParams.get("processId")
      const nextProcessId = sop?.id ?? null

      if (currentProcessId === nextProcessId || (!currentProcessId && !nextProcessId)) {
        return
      }

      const params = new URLSearchParams(searchParams)
      if (nextProcessId) {
        params.set("processId", nextProcessId)
      } else {
        params.delete("processId")
      }

      const queryString = params.toString()
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(nextUrl, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handleSelectSop = useCallback(
    (sop: Sop) => {
      setSelectedSOP(sop)
      setViewMode("editor")
      updateUrlForSelectedSop(sop)
    },
    [updateUrlForSelectedSop],
  )

  const clearSelectedSop = useCallback(() => {
    setSelectedSOP(null)
    setViewMode("editor")
    updateUrlForSelectedSop(null)
  }, [updateUrlForSelectedSop])

  const findSopById = useCallback(
    (id: string) => {
      for (const category of data) {
        const sop = category.sops.find((item) => item.id === id)
        if (sop) {
          return { sop, categoryId: category.id }
        }
      }
      return null
    },
    [data],
  )

  const processIdFromParams = searchParams.get("processId")

  useEffect(() => {
    if (!processIdFromParams) {
      if (selectedSOP) {
        clearSelectedSop()
      }
      return
    }

    if (selectedSOP?.id === processIdFromParams) {
      return
    }

    const match = findSopById(processIdFromParams)
    if (match) {
      handleSelectSop(match.sop)
      setExpanded((prev) => {
        if (prev[match.categoryId]) {
          return prev
        }
        return { ...prev, [match.categoryId]: true }
      })
      return
    }

    if (selectedSOP) {
      clearSelectedSop()
    }
  }, [
    processIdFromParams,
    selectedSOP,
    clearSelectedSop,
    findSopById,
    handleSelectSop,
  ])

  const handleWorkflowUpdate = useCallback((workflow: Workflow) => {
    setCurrentWorkflow(workflow)
  }, [])

  const handleOutputSubmission = useCallback(
    (nodeId: string, payload: OutputSubmissionPayload) => {
      const timestamp = new Date().toISOString()

      setOutputSubmissions((prev) => ({
        ...prev,
        [nodeId]: {
          nodeId,
          type: payload.type,
          value: payload.value,
          fileName: payload.fileName,
          completedBy: CURRENT_PROCESSOR_NAME,
          completedAt: timestamp,
        },
      }))
    },
    [],
  )

  const [newCategoryTitle, setNewCategoryTitle] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("")
  const [newSopInputs, setNewSopInputs] = useState<
    Record<string, { title: string; owner: string; content: string }>
  >({})
  const [showAddSop, setShowAddSop] = useState<Record<string, boolean>>({})
  const [aiPromptCategory, setAiPromptCategory] = useState<string | null>(null)
  const [aiPromptDraft, setAiPromptDraft] = useState("")
  const [processViewerPromptTitle, setProcessViewerPromptTitle] = useState("")
  const [processViewerPrompt, setProcessViewerPrompt] = useState("")
  const [pendingProcessViewerPrompt, setPendingProcessViewerPrompt] = useState<
    { title: string; prompt: string } | null
  >(null)
  const [showCategorySelection, setShowCategorySelection] = useState(false)
  const [selectedCategoryForViewerPrompt, setSelectedCategoryForViewerPrompt] = useState("")
  const [editingSop, setEditingSop] = useState<
    { id: string; categoryId: string; title: string; owner: string } | null
  >(null)


  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = !prev[id]

      if (!next) {
        setShowAddSop((prevVisible) => ({ ...prevVisible, [id]: false }))
        if (aiPromptCategory === id) {
          setAiPromptCategory(null)
          setAiPromptDraft("")
        }
      }

      return { ...prev, [id]: next }
    })

  const handleToggleAddSop = (categoryId: string) => {
    setShowAddSop((prev) => {
      const next = !prev[categoryId]

      if (next) {
        setExpanded((prevExpanded) => ({ ...prevExpanded, [categoryId]: true }))
      } else if (aiPromptCategory === categoryId) {
        setAiPromptCategory(null)
        setAiPromptDraft("")
      }

      return { ...prev, [categoryId]: next }
    })
  }

  const updateSOP = (id: string, newContent: string) => {
    const today = new Date().toISOString().split("T")[0]

    setData((prev) =>
      prev.map((category) => ({
        ...category,
        sops: category.sops.map((sop) =>
          sop.id === id ? { ...sop, content: newContent, lastUpdated: today } : sop,
        ),
      })),
    )

    if (selectedSOP?.id === id) {
      setSelectedSOP((prev) =>
        prev ? { ...prev, content: newContent, lastUpdated: today } : prev,
      )
    }
  }

  const handleAddCategory = async () => {
    const trimmed = newCategoryTitle.trim()
    if (!trimmed) return

    const baseId = slugify(trimmed) || `category-${Date.now()}`
    const uniqueId = data.some((category) => category.id === baseId)
      ? `${baseId}-${Date.now()}`
      : baseId
    const defaultSubcategoryId = `${uniqueId}-general`

    const { data: insertedCategory, error } = await supabase
      .from("operations_categories")
      .insert({ title: trimmed })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to persist category", error)
      return
    }

    const nextCategory: Category = {
      id: uniqueId,
      title: trimmed,
      subcategories: [{ id: defaultSubcategoryId, title: "General" }],
      sops: [],
      supabaseId: insertedCategory?.id,
    }

    setData((prev) => [...prev, nextCategory])
    setExpanded((prev) => ({ ...prev, [uniqueId]: true }))
    setNewCategoryTitle("")
  }

  const handleToggleAddCategory = () => {
    setShowAddCategory((prev) => {
      if (prev) {
        setNewCategoryTitle("")
      }

      return !prev
    })
  }

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditingCategoryTitle(category.title)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryTitle("")
  }

  const saveCategoryTitle = () => {
    if (!editingCategoryId) return
    const trimmed = editingCategoryTitle.trim()
    if (!trimmed) return

    setData((prev) =>
      prev.map((category) =>
        category.id === editingCategoryId ? { ...category, title: trimmed } : category,
      ),
    )

    setEditingCategoryId(null)
    setEditingCategoryTitle("")
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = data.find((item) => item.id === categoryId)
    if (!category) return

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete category "${category.title}" and all associated Processes?`,
      )
      if (!confirmed) return
    }

    const containsSelected = selectedSOP
      ? category.sops.some((sop) => sop.id === selectedSOP.id)
      : false

    if (category.supabaseId) {
      const { error } = await supabase
        .from("operations_categories")
        .delete()
        .eq("id", category.supabaseId)

      if (error) {
        console.error("Failed to remove category", error)
        return
      }
    }

    setData((prev) => prev.filter((item) => item.id !== categoryId))
    setExpanded((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })

    setNewSopInputs((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })

    if (editingCategoryId === categoryId) {
      cancelEditCategory()
    }

    if (editingSop?.categoryId === categoryId) {
      setEditingSop(null)
    }

    if (containsSelected) {
      clearSelectedSop()
    }
  }

  const handleNewSopInputChange = (
    categoryId: string,
    field: "title" | "owner" | "content",
    value: string,
  ) => {
    setNewSopInputs((prev) => {
      const existing = prev[categoryId] ?? {
        title: "",
        owner: PROCESS_CREATOR_NAME,
        content: "",
      }

      return {
        ...prev,
        [categoryId]: {
          ...existing,
          [field]: value,
        },
      }
    })
  }

  const handleAddSop = (categoryId: string) => {
    const category = data.find((item) => item.id === categoryId)
    if (!category) return

    const form = newSopInputs[categoryId] ?? {
      title: "",
      owner: PROCESS_CREATOR_NAME,
      content: "",
    }

    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) return

    const owner = form.owner.trim() || PROCESS_CREATOR_NAME
    const prompt = form.content.trim()
    const content = buildSopContent(trimmedTitle, prompt)

    const today = new Date().toISOString().split("T")[0]
    const baseId = slugify(trimmedTitle) || "sop"
    const sopId = `${baseId}-${Date.now()}`
    const firstSubcategoryId = category.subcategories[0]?.id ?? `${categoryId}-general`

    const newSop: Sop = {
      id: sopId,
      title: trimmedTitle,
      subcategoryId: firstSubcategoryId,
      owner,
      lastUpdated: today,
      status: "in-design",
      content,
      processSettings: {
        owner,
        processType: "one-time",
        oneTimeDeadline: null,
        recurrence: {
          frequency: "monthly",
          customDays: [],
          time: "09:00",
          timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
        },
        vaultAccess: [],
      },
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.id !== categoryId) return item

        const hasSubcategories = item.subcategories.length > 0
        return {
          ...item,
          subcategories: hasSubcategories
            ? item.subcategories
            : [{ id: firstSubcategoryId, title: "General" }],
          sops: [...item.sops, newSop],
        }
      }),
    )

    setNewSopInputs((prev) => ({
      ...prev,
      [categoryId]: { title: "", owner: PROCESS_CREATOR_NAME, content: "" },
    }))
  }

  const handleSubmitProcessViewerPrompt = () => {
    const trimmedTitle = processViewerPromptTitle.trim()
    const trimmedPrompt = processViewerPrompt.trim()

    if (!trimmedTitle || !trimmedPrompt || data.length === 0) {
      return
    }

    setPendingProcessViewerPrompt({ title: trimmedTitle, prompt: trimmedPrompt })
    setSelectedCategoryForViewerPrompt((prev) => {
      if (prev && data.some((category) => category.id === prev)) {
        return prev
      }
      return data[0]?.id ?? ""
    })
    setShowCategorySelection(true)
  }

  const handleConfirmProcessViewerPrompt = () => {
    if (!pendingProcessViewerPrompt) {
      return
    }

    const fallbackCategoryId = data[0]?.id ?? ""
    const resolvedCategoryId = data.some((category) => category.id === selectedCategoryForViewerPrompt)
      ? selectedCategoryForViewerPrompt
      : fallbackCategoryId

    if (!resolvedCategoryId) {
      return
    }

    const category = data.find((item) => item.id === resolvedCategoryId)
    if (!category) {
      return
    }

    const timestamp = Date.now()
    const baseId = slugify(pendingProcessViewerPrompt.title) || "sop"
    const sopId = `${baseId}-${timestamp}`
    const firstSubcategoryId = category.subcategories[0]?.id ?? `${resolvedCategoryId}-general`
    const owner = PROCESS_CREATOR_NAME
    const today = new Date().toISOString().split("T")[0]
    const content = buildSopContent(
      pendingProcessViewerPrompt.title,
      pendingProcessViewerPrompt.prompt,
    )

    const newSop: Sop = {
      id: sopId,
      title: pendingProcessViewerPrompt.title,
      subcategoryId: firstSubcategoryId,
      owner,
      lastUpdated: today,
      status: "in-design",
      content,
      processSettings: {
        owner,
        processType: "one-time",
        oneTimeDeadline: null,
        recurrence: {
          frequency: "monthly",
          customDays: [],
          time: "09:00",
          timezone: TIMEZONE_OPTIONS[0] ?? "UTC",
        },
        vaultAccess: [],
      },
    }

    setData((prev) =>
      prev.map((item) => {
        if (item.id !== resolvedCategoryId) return item

        const hasSubcategories = item.subcategories.length > 0

        return {
          ...item,
          subcategories: hasSubcategories
            ? item.subcategories
            : [{ id: firstSubcategoryId, title: "General" }],
          sops: [...item.sops, newSop],
        }
      }),
    )

    setExpanded((prev) => ({ ...prev, [resolvedCategoryId]: true }))
    setShowCategorySelection(false)
    setPendingProcessViewerPrompt(null)
    setProcessViewerPromptTitle("")
    setProcessViewerPrompt("")
    setSelectedCategoryForViewerPrompt(resolvedCategoryId)
    handleSelectSop(newSop)
  }

  const handleDeleteSop = (categoryId: string, sopId: string) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Delete this Process?")
      if (!confirmed) return
    }

    setData((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, sops: category.sops.filter((sop) => sop.id !== sopId) }
          : category,
      ),
    )

    if (selectedSOP?.id === sopId) {
      clearSelectedSop()
    }

    if (editingSop?.id === sopId) {
      setEditingSop(null)
    }
  }

  const startEditSop = (categoryId: string, sop: Sop) => {
    setEditingSop({
      id: sop.id,
      categoryId,
      title: sop.title,
      owner: sop.owner,
    })
  }

  const cancelEditSop = () => {
    setEditingSop(null)
  }

  const saveSopEdit = () => {
    if (!editingSop) return

    const trimmedTitle = editingSop.title.trim()
    if (!trimmedTitle) return

    const owner = editingSop.owner.trim() || OWNER_OPTIONS[0] || "Process Owner"
    const today = new Date().toISOString().split("T")[0]

    setData((prev) =>
      prev.map((category) => {
        if (category.id !== editingSop.categoryId) return category

        return {
          ...category,
          sops: category.sops.map((sop) =>
            sop.id === editingSop.id
              ? {
                  ...sop,
                  title: trimmedTitle,
                  owner,
                  lastUpdated: today,
                  processSettings: { ...sop.processSettings, owner },
                }
              : sop,
          ),
        }
      }),
    )

    if (selectedSOP?.id === editingSop.id) {
      setSelectedSOP((prev) =>
        prev
          ? {
              ...prev,
              title: trimmedTitle,
              owner,
              lastUpdated: today,
              processSettings: { ...prev.processSettings, owner },
            }
          : prev,
      )
    }

    setEditingSop(null)
  }

  const handleProcessSettingsChange = useCallback(
    (settings: ProcessSettings) => {
      if (!selectedSOP) return

      setProcessSettings(settings)

      setData((prev) =>
        prev.map((category) => ({
          ...category,
          sops: category.sops.map((sop) =>
            sop.id === selectedSOP.id
              ? { ...sop, owner: settings.owner, processSettings: settings }
              : sop,
          ),
        })),
      )

      setSelectedSOP((prev) =>
        prev ? { ...prev, owner: settings.owner, processSettings: settings } : prev,
      )
    },
    [selectedSOP],
  )

  const handleOneTimeDeadlineUpdate = useCallback(
    (deadline: ProcessDeadline | null) => {
      if (!processSettings || !selectedSOP) {
        return
      }

      const current = processSettings.oneTimeDeadline ?? null
      if (deadlinesAreEqual(current, deadline)) {
        return
      }

      const nextSettings = { ...processSettings, oneTimeDeadline: deadline }
      handleProcessSettingsChange(nextSettings)
    },
    [processSettings, selectedSOP, handleProcessSettingsChange],
  )

  useEffect(() => {
    setOutputSubmissions({})

    if (!selectedSOP) {
      setTasks([])
      setProcessSettings(null)
      setCurrentWorkflow(null)
      return
    }

    const steps = extractPlainText(selectedSOP.content)
      .split(/\n+/)
      .filter((line) => line.trim().match(/^\d+\./))
      .map((line, index) => ({
        id: index + 1,
        text: line.replace(/^\d+\.\s*/, ""),
        due: "",
        completed: false,
        completedBy: "",
        completedAt: null,
        nodeId: null,
      }))

    setTasks(steps)
    setProcessSettings(selectedSOP.processSettings)
    setCurrentWorkflow(null)
  }, [selectedSOP])

  const filteredData = filterData(data, query)
  const processViewerPromptDisabled =
    !processViewerPromptTitle.trim() || !processViewerPrompt.trim() || data.length === 0
  const pendingProcessViewerTitle =
    pendingProcessViewerPrompt?.title ?? processViewerPromptTitle.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={cn(
          "mx-auto grid max-w-6xl gap-6 px-4 py-6",
          fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
        )}
      >
        {!fullscreen && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Add category</h3>
                  <p className="text-xs text-gray-500">
                    Group related processes by department or team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAddCategory}
                  aria-label="Toggle Add Category"
                  aria-pressed={showAddCategory}
                  className={cn(
                    "rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                    showAddCategory && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                  )}
                >
                  <Plus
                    className={cn("h-4 w-4 transition", showAddCategory && "rotate-45")}
                  />
                </button>
              </div>
              {showAddCategory && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newCategoryTitle}
                    onChange={(event) => setNewCategoryTitle(event.target.value)}
                    placeholder="e.g. Facilities Management"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryTitle.trim()}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
              )}
            </div>

            {filteredData.map((category) => {
              const sopForm =
                newSopInputs[category.id] ?? {
                  title: "",
                  owner: PROCESS_CREATOR_NAME,
                  content: "",
                }
              const isEditingCategory = editingCategoryId === category.id
              const newSopDisabled = !sopForm.title.trim()
              const addSopVisible = Boolean(showAddSop[category.id])

              return (
                <div
                  key={category.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    {isEditingCategory ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editingCategoryTitle}
                          onChange={(event) => setEditingCategoryTitle(event.target.value)}
                          className="h-9"
                          placeholder="Update category name"
                        />
                        <button
                          onClick={saveCategoryTitle}
                          disabled={!editingCategoryTitle.trim()}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggle(category.id)}
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          {expanded[category.id] ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <span className="font-semibold">{category.title}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAddSop(category.id)}
                            aria-pressed={addSopVisible}
                            aria-label="Toggle Add Process"
                            className={cn(
                              "rounded-full p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                              addSopVisible && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                            )}
                          >
                            <Plus
                              className={cn(
                                "h-4 w-4 transition",
                                addSopVisible && "rotate-45",
                              )}
                            />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                aria-label={`Category actions for ${category.title}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault()
                                  startEditCategory(category)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault()
                                  void handleDeleteCategory(category.id)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>

                  {expanded[category.id] && (
                    <div className="transition-all">
                      <ul className="divide-y">
                        {category.sops.map((sop) => {
                          const isEditingSop = editingSop?.id === sop.id

                          return (
                            <li key={sop.id} className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <FileText className="mt-1 h-5 w-5 shrink-0" />
                                  <div className="min-w-0 space-y-2">
                                    {isEditingSop ? (
                                      <Input
                                        value={editingSop?.title ?? sop.title}
                                        onChange={(event) =>
                                          setEditingSop((prev) =>
                                            prev && prev.id === sop.id
                                              ? { ...prev, title: event.target.value }
                                              : prev,
                                          )
                                        }
                                        className="h-9"
                                        placeholder="Update Process title"
                                      />
                                    ) : (
                                      <>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleSelectSop(sop)}
                                            className="min-w-0 flex-1 truncate text-left font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                          >
                                            {sop.title}
                                          </button>
                                          <span
                                            className={cn(
                                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                              SOP_STATUS_BADGE_STYLES[sop.status],
                                            )}
                                          >
                                            {SOP_STATUS_LABELS[sop.status]}
                                          </span>
                                        </div>
                                        <div className="truncate text-xs text-gray-500">
                                          {sop.owner} • Updated {sop.lastUpdated}
                                        </div>
                                      </>
                                    )}

                                    {isEditingSop && (
                                      <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wide text-gray-500">
                                          Owner
                                        </Label>
                                        <select
                                          className="w-full rounded-lg border px-3 py-2 text-sm"
                                          value={editingSop?.owner ?? sop.owner}
                                          onChange={(event) =>
                                            setEditingSop((prev) =>
                                              prev && prev.id === sop.id
                                                ? { ...prev, owner: event.target.value }
                                                : prev,
                                            )
                                          }
                                        >
                                          {OWNER_OPTIONS.map((owner) => (
                                            <option key={owner} value={owner}>
                                              {owner}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center gap-2">
                                  {isEditingSop ? (
                                    <>
                                      <button
                                        onClick={saveSopEdit}
                                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditSop}
                                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                          aria-label={`Process actions for ${sop.title}`}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault()
                                            startEditSop(category.id, sop)
                                          }}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault()
                                            handleDeleteSop(category.id, sop.id)
                                          }}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>

                      {addSopVisible && (
                        <div className="space-y-4 border-t bg-gray-50 p-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">Add Process</h4>
                            <p className="text-xs text-gray-500">
                              Capture a quick description and starter steps.
                            </p>
                          </div>
                          <Input
                            value={sopForm.title}
                            onChange={(event) =>
                              handleNewSopInputChange(category.id, "title", event.target.value)
                            }
                            placeholder="Process title"
                          />
                          <div className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Process owner
                            </div>
                            <div className="font-medium text-gray-900">{PROCESS_CREATOR_NAME}</div>
                            <p className="mt-1 text-xs text-gray-500">
                              Automatically assigned to the process creator.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Import or start from
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SOP_IMPORT_OPTIONS.map((option) => (
                                <button
                                  key={`${category.id}-${option.id}`}
                                  type="button"
                                  title={option.name}
                                  className="group flex min-w-[72px] flex-col items-center gap-1.5 rounded-md border border-dashed border-gray-200 bg-white p-2 text-[11px] font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
                                >
                                  <option.Logo />
                                  <span className="text-center leading-tight">{option.name}</span>
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setAiPromptDraft(sopForm.content || "")
                                  setAiPromptCategory(category.id)
                                }}
                                aria-label="Generate Process with AI"
                                className={cn(
                                  "group flex min-w-[72px] flex-col items-center gap-1.5 rounded-md border border-dashed border-gray-200 bg-white p-2 text-[11px] font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600",
                                  sopForm.content.trim() && "border-blue-300 text-blue-600 hover:border-blue-300",
                                )}
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-center leading-tight">AI process</span>
                              </button>
                            </div>
                          </div>
                          {sopForm.content.trim() && (
                            <div className="rounded-lg border border-dashed bg-white px-3 py-2 text-xs text-gray-600">
                              <div className="font-semibold text-gray-700">AI prompt captured</div>
                              <p className="mt-1 whitespace-pre-wrap">{sopForm.content}</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleAddSop(category.id)}
                            disabled={newSopDisabled}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Plus className="h-4 w-4" /> Add Process
                          </button>
                          <Dialog
                            open={aiPromptCategory === category.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setAiPromptCategory(null)
                                setAiPromptDraft("")
                              }
                            }}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Generate Process with AI</DialogTitle>
                                <DialogDescription>
                                  Describe the process you want to document and we will craft a starter process.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                value={aiPromptDraft}
                                onChange={(event) => setAiPromptDraft(event.target.value)}
                                placeholder="e.g. Create an onboarding checklist for new customer success hires"
                              />
                              <DialogFooter>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAiPromptCategory(null)
                                    setAiPromptDraft("")
                                  }}
                                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmedPrompt = aiPromptDraft.trim()
                                    if (trimmedPrompt) {
                                      handleNewSopInputChange(category.id, "content", trimmedPrompt)
                                    }
                                    setAiPromptCategory(null)
                                    setAiPromptDraft("")
                                  }}
                                  disabled={!aiPromptDraft.trim()}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Use prompt
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div
          className={cn(
            "flex flex-col bg-white",
            fullscreen
              ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-0 shadow-none"
              : "rounded-2xl border shadow-sm",
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFullscreen((prev) => !prev)}
                className="rounded-lg p-1 hover:bg-gray-50"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <div className="font-semibold">Process Viewer</div>
            </div>
            {selectedSOP && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("editor")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "editor" && "bg-gray-100",
                  )}
                >
                  <Pencil className="h-4 w-4" /> Process Editor
                </button>
                <button
                  onClick={() => setViewMode("process")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "process" && "bg-gray-100",
                  )}
                >
                  <ListChecks className="h-4 w-4" /> Process Designer
                </button>
                <button
                  onClick={() => setViewMode("settings")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "settings" && "bg-gray-100",
                  )}
                >
                  <Settings className="h-4 w-4" /> Process Settings
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "calendar" && "bg-gray-100",
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Processor Portal
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {!selectedSOP ? (
              <div className="flex h-full flex-col items-center justify-center gap-8 p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-blue-50 p-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bring your Processes into Operations Catalog
                    </h3>
                    <p className="max-w-xl text-sm text-gray-500">
                      Upload process documents from the tools your teams already use so everything lives in one organized
                      workspace.
                    </p>
                  </div>
                </div>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {SOP_IMPORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <option.Logo />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{option.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
                <div className="w-full max-w-2xl text-left">
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-900">Generate a new process with AI</h4>
                        <p className="text-xs text-gray-500">
                          Describe the process you need and add it directly to your catalog.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Input
                        value={processViewerPromptTitle}
                        onChange={(event) => setProcessViewerPromptTitle(event.target.value)}
                        placeholder="Process title"
                      />
                      <Textarea
                        value={processViewerPrompt}
                        onChange={(event) => setProcessViewerPrompt(event.target.value)}
                        placeholder="Describe the process you want to generate"
                        className="min-h-[120px]"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-400">
                          You'll choose a category after submitting your prompt.
                        </p>
                        <button
                          type="button"
                          onClick={handleSubmitProcessViewerPrompt}
                          disabled={processViewerPromptDisabled}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Sparkles className="h-4 w-4" /> Continue
                        </button>
                      </div>
                    </div>
                  </div>
                  <Dialog
                    open={showCategorySelection}
                    onOpenChange={(open) => {
                      if (!open) {
                        setShowCategorySelection(false)
                        setPendingProcessViewerPrompt(null)
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select a category</DialogTitle>
                        <DialogDescription>
                          {pendingProcessViewerTitle
                            ? `Choose where “${pendingProcessViewerTitle}” belongs in your catalog.`
                            : "Choose where this process belongs in your catalog."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select
                          value={selectedCategoryForViewerPrompt}
                          onValueChange={setSelectedCategoryForViewerPrompt}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pendingProcessViewerPrompt && (
                          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                            <div className="font-semibold text-gray-700">AI prompt</div>
                            <p className="mt-1 whitespace-pre-wrap">{pendingProcessViewerPrompt.prompt}</p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategorySelection(false)
                            setPendingProcessViewerPrompt(null)
                          }}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmProcessViewerPrompt}
                          disabled={!selectedCategoryForViewerPrompt}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Add process
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-gray-400">
                  More import options coming soon. You can also upload files directly from your device.
                </p>
              </div>
            ) : (
              <div className="h-full">
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto",
                    viewMode !== "editor" && "hidden",
                  )}
                >
                  <ProcessEditor
                    value={selectedSOP.content}
                    onChange={(value) => updateSOP(selectedSOP.id, value)}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-hidden",
                    viewMode !== "process" && "hidden",
                  )}
                >
                  <ProcessView
                    tasks={tasks}
                    setTasks={setTasks}
                    onLastProcessDeadlineChange={handleOneTimeDeadlineUpdate}
                    onWorkflowUpdate={handleWorkflowUpdate}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto p-4",
                    viewMode !== "calendar" && "hidden",
                  )}
                >
                  <CalendarView
                    tasks={tasks}
                    workflow={currentWorkflow}
                    processName={selectedSOP?.title ?? ""}
                    outputSubmissions={outputSubmissions}
                    onSubmitOutput={handleOutputSubmission}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto p-4",
                    viewMode !== "settings" && "hidden",
                  )}
                >
                  <ProcessSettingsView
                    settings={processSettings}
                    onChange={handleProcessSettingsChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
