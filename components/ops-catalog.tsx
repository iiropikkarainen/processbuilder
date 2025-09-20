"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  Calendar as CalendarIcon,
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

import WorkflowBuilder from "./workflow-builder"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

type Subcategory = {
  id: string
  title: string
}

type ProcessSettings = {
  owner: string
  processType: "one-time" | "recurring"
  recurrence: {
    frequency: "custom" | "daily" | "weekly" | "monthly" | "quarterly" | "annually"
    customDays: string[]
    time: string
    timezone: string
  }
  vaultAccess: string[]
}

type Sop = {
  id: string
  title: string
  subcategoryId: string
  owner: string
  lastUpdated: string
  content: string
  processSettings: ProcessSettings
}

type Category = {
  id: string
  title: string
  subcategories: Subcategory[]
  sops: Sop[]
}

type SlashMenuPosition = {
  top: number
  left: number
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

const slashMenuOptions = [
  { category: "AI", items: ["AI Prompt"] },
  {
    category: "Attach from",
    items: ["PDF", "Notion", "Google Doc", "Word", "Scribe", "Loom"],
  },
]

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

interface SlashMenuProps {
  position: SlashMenuPosition | null
  onSelect: (item: string) => void
}

const SlashMenu = ({ position, onSelect }: SlashMenuProps) => {
  if (!position) return null

  return (
    <div
      className="absolute z-50 w-56 rounded-xl border bg-white shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {slashMenuOptions.map((option) => (
        <div key={option.category} className="p-2">
          <div className="mb-1 text-xs font-semibold text-gray-500">
            {option.category}
          </div>
          {option.items.map((item) => (
            <div
              key={item}
              onClick={() => onSelect(item)}
              className="cursor-pointer rounded px-3 py-1 text-sm hover:bg-gray-100"
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

interface EditorProps {
  content: string
  onChange: (value: string) => void
}

const Editor = ({ content, onChange }: EditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [slashPos, setSlashPos] = useState<SlashMenuPosition | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== content) {
      editorRef.current.innerText = content
    }
  }, [content])

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.innerText
    onChange(text)

    if (typeof window === "undefined") return

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = editorRef.current?.getBoundingClientRect()

      const anchorText = selection.anchorNode?.textContent ?? ""
      const textBefore = anchorText.slice(0, selection.anchorOffset)

      if (containerRect && textBefore.endsWith("/")) {
        setSlashPos({
          top: rect.bottom - containerRect.top + 20,
          left: rect.left - containerRect.left,
        })
      } else {
        setSlashPos(null)
      }
    }
  }

  const handleSelect = (item: string) => {
    if (typeof window === "undefined") return

    const selection = window.getSelection()
    const anchorNode = selection?.anchorNode

    if (anchorNode && anchorNode.textContent) {
      anchorNode.textContent = anchorNode.textContent.replace(/\/$/, `${item} `)
      onChange(editorRef.current?.innerText ?? "")
    }

    setSlashPos(null)
  }

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[300px] w-full bg-transparent p-4 text-sm leading-6 focus:outline-none"
      />
      <SlashMenu position={slashPos} onSelect={handleSelect} />
    </div>
  )
}

interface ProcessViewProps {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
}

const ProcessView = ({ tasks, setTasks }: ProcessViewProps) => {
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
                completedBy: "Current User",
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
    />
  )
}

interface CalendarViewProps {
  tasks: Task[]
}

const CalendarView = ({ tasks }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = endOfMonth.getDate()

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (task.due) {
      const dateKey = new Date(task.due).toDateString()
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(task)
    }
    return acc
  }, {})

  const renderDay = (day: number) => {
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateKey = dateObj.toDateString()
    const hasTasks = tasksByDate[dateKey]

    return (
      <div
        key={day}
        onClick={() => setSelectedDate(dateObj)}
        className={cn(
          "flex cursor-pointer flex-col rounded-lg border p-2 hover:bg-gray-100",
          selectedDate?.toDateString() === dateKey && "bg-blue-100",
        )}
      >
        <div className="text-sm font-semibold">{day}</div>
        {hasTasks && (
          <div className="mt-1 text-xs text-blue-600">
            {hasTasks.length} task{hasTasks.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded border px-2 py-1 hover:bg-gray-100">
          Prev
        </button>
        <div className="font-semibold">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </div>
        <button onClick={nextMonth} className="rounded border px-2 py-1 hover:bg-gray-100">
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, index) => renderDay(index + 1))}
      </div>

      {selectedDate && (
        <div>
          <div className="mb-2 font-medium">Tasks for {selectedDate.toDateString()}</div>
          {tasksByDate[selectedDate.toDateString()] ? (
            tasksByDate[selectedDate.toDateString()].map((task) => (
              <div key={task.id} className="mb-2 rounded border bg-white p-2 shadow-sm">
                <div className="text-sm font-medium">{task.text}</div>
                <div className="text-xs text-gray-500">
                  Due: {new Date(task.due).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No tasks scheduled.</div>
          )}
        </div>
      )}
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

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Process owner</h3>
          <p className="text-xs text-gray-500">
            Select who is accountable for the execution and maintenance of this process.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="process-owner">Owner</Label>
          <Select value={settings.owner} onValueChange={handleOwnerChange}>
            <SelectTrigger id="process-owner">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {OWNER_OPTIONS.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <TabsContent value="one-time" className="mt-4">
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              This process will execute once. Use assignments and due dates in the process view to
              manage work.
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
  const [newCategoryTitle, setNewCategoryTitle] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryTitle, setEditingCategoryTitle] = useState("")
  const [newSopInputs, setNewSopInputs] = useState<
    Record<string, { title: string; owner: string; content: string }>
  >({})
  const [showAddSop, setShowAddSop] = useState<Record<string, boolean>>({})
  const [aiPromptCategory, setAiPromptCategory] = useState<string | null>(null)
  const [aiPromptDraft, setAiPromptDraft] = useState("")
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

  const handleAddCategory = () => {
    const trimmed = newCategoryTitle.trim()
    if (!trimmed) return

    const baseId = slugify(trimmed) || `category-${Date.now()}`
    const uniqueId = data.some((category) => category.id === baseId)
      ? `${baseId}-${Date.now()}`
      : baseId
    const defaultSubcategoryId = `${uniqueId}-general`

    const nextCategory: Category = {
      id: uniqueId,
      title: trimmed,
      subcategories: [{ id: defaultSubcategoryId, title: "General" }],
      sops: [],
    }

    setData((prev) => [...prev, nextCategory])
    setExpanded((prev) => ({ ...prev, [uniqueId]: true }))
    setNewCategoryTitle("")
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

  const handleDeleteCategory = (categoryId: string) => {
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
      setSelectedSOP(null)
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
    const baseTemplate = `# Process: ${trimmedTitle}

## Purpose
Describe the goal of the procedure.

## Process
1. Document the first step.
2. Capture supporting tasks.
3. Confirm completion with stakeholders.`
    const content = prompt
      ? `${baseTemplate}

---
_AI generation prompt_
${prompt}`
      : baseTemplate

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
      content,
      processSettings: {
        owner,
        processType: "one-time",
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
      setSelectedSOP(null)
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

  const handleProcessSettingsChange = (settings: ProcessSettings) => {
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
  }

  useEffect(() => {
    if (!selectedSOP) {
      setTasks([])
      setProcessSettings(null)
      return
    }

    const steps = selectedSOP.content
      .split("\n")
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
  }, [selectedSOP])

  const filteredData = filterData(data, query)

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
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Add category</h3>
                <p className="text-xs text-gray-500">
                  Group related processes by department or team.
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newCategoryTitle}
                  onChange={(event) => setNewCategoryTitle(event.target.value)}
                  placeholder="e.g. Facilities Management"
                  className="flex-1"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryTitle.trim()}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
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
                                  handleDeleteCategory(category.id)
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
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedSOP(sop)
                                            setViewMode("editor")
                                          }}
                                          className="w-full truncate text-left font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                        >
                                          {sop.title}
                                        </button>
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
                className="rounded-lg border p-1 hover:bg-gray-50"
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
                    "rounded-lg border px-2 py-1 text-xs",
                    viewMode === "editor" && "bg-gray-100",
                  )}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode("process")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "process" && "bg-gray-100",
                  )}
                >
                  <ListChecks className="h-4 w-4" /> Process View
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                    viewMode === "calendar" && "bg-gray-100",
                  )}
                >
                  <CalendarIcon className="h-4 w-4" /> Calendar View
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
                  <Editor
                    content={selectedSOP.content}
                    onChange={(value) => updateSOP(selectedSOP.id, value)}
                  />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-hidden",
                    viewMode !== "process" && "hidden",
                  )}
                >
                  <ProcessView tasks={tasks} setTasks={setTasks} />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto p-4",
                    viewMode !== "calendar" && "hidden",
                  )}
                >
                  <CalendarView tasks={tasks} />
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
