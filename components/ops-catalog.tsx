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
  Minimize2,
  Search,
  Settings,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
        content: `# SOP: Payroll & Benefits Processing (Canada)

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
]

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
        className="min-h-[300px] w-full rounded-xl border bg-white p-4 text-sm leading-6 shadow-sm focus:outline-none"
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
    <div className="min-h-[600px] overflow-hidden rounded-2xl border bg-white shadow-sm">
      <WorkflowBuilder
        className="bg-white"
        tasks={tasks}
        availableTasks={unassignedTasks}
        onAssignTask={assignTaskToNode}
        onUpdateTaskDueDate={handleDueDateChange}
        onMarkTaskDone={handleMarkDone}
        onCreateTask={handleCreateTask}
      />
    </div>
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
        Select an SOP from the catalog to configure its process settings.
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

export default function OpsCatalog() {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedSOP, setSelectedSOP] = useState<Sop | null>(null)
  const [data, setData] = useState<Category[]>(SAMPLE_DATA)
  const [fullscreen, setFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<"editor" | "process" | "calendar" | "settings">(
    "editor",
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [processSettings, setProcessSettings] = useState<ProcessSettings | null>(null)

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const updateSOP = (id: string, newContent: string) => {
    setData((prev) =>
      prev.map((category) => ({
        ...category,
        sops: category.sops.map((sop) => (sop.id === id ? { ...sop, content: newContent } : sop)),
      })),
    )

    if (selectedSOP?.id === id) {
      setSelectedSOP((prev) => (prev ? { ...prev, content: newContent } : prev))
    }
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
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <div className="text-xl font-semibold">Standard Operating Procedures</div>
          <div className="relative ml-auto w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              className="w-full rounded-xl border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
              placeholder="Search categories or SOPs…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mx-auto grid max-w-6xl gap-6 px-4 py-6",
          fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
        )}
      >
        {!fullscreen && (
          <div className="space-y-4">
            {filteredData.map((category) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <button
                  onClick={() => toggle(category.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {expanded[category.id] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <span className="font-semibold">{category.title}</span>
                  </div>
                </button>

                {expanded[category.id] && (
                  <div className="transition-all">
                    <ul className="divide-y">
                      {category.sops.map((sop) => (
                        <li key={sop.id} className="flex items-center justify-between p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0" />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{sop.title}</div>
                              <div className="truncate text-xs text-gray-500">
                                {sop.owner} • Updated {sop.lastUpdated}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSOP(sop)
                              setViewMode("process")
                            }}
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Open SOP
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
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
              <div className="font-semibold">SOP Viewer</div>
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

          <div className="flex-1 min-h-0 overflow-hidden p-4">
            {!selectedSOP ? (
              <div className="text-sm text-gray-500">
                Select an SOP from the left to preview.
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
                    "flex h-full flex-col overflow-y-auto",
                    viewMode !== "calendar" && "hidden",
                  )}
                >
                  <CalendarView tasks={tasks} />
                </div>
                <div
                  className={cn(
                    "flex h-full flex-col overflow-y-auto",
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
