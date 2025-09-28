"use client"

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

import { CheckCircle2 } from "lucide-react"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Textarea } from "../ui/textarea"

import { cn } from "@/lib/utils"
import {
  describeInputStartTrigger,
  describeOutputAlerts,
  describeOutputCompletion,
} from "@/lib/workflow-utils"
import type { OutputSubmission, Task } from "@/lib/types"

import type {
  AssignmentInfo,
  CalendarEntry,
  CalendarViewProps,
  NodeStatus,
  NodeStatusFilter,
  OutputRequirementInfo,
  OutputSubmissionPayload,
} from "./types"
import {
  buildCompletionLog,
  determineNodeStatus,
  formatDateTime,
  getAssignmentInfo,
  getDeadlineInfo,
  getOutputRequirementInfo,
  OUTPUT_ACTION_LABELS,
  parseDateValue,
} from "./utils"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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
          <div className="text-emerald-700">
            Link: <span className="font-medium break-all">{submission.value}</span>
          </div>
        )
        break
      case "text":
        submissionDetail = (
          <div className="text-emerald-700">
            Response: <span className="font-medium break-all">{submission.value}</span>
          </div>
        )
        break
      default:
        submissionDetail = null
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
    <div className={cn("text-sm text-foreground", variant === "card" ? "space-y-3" : "space-y-2")}>
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
      ) : info.type === "markDone" ? (
        <div className="pt-1">{actionForm}</div>
      ) : (
        actionForm
      )}
    </div>
  )
}

const buildStatusCounts = (details: {
  nodeStatus: NodeStatus
}[]): Record<NodeStatus, number> =>
  details.reduce<Record<NodeStatus, number>>(
    (acc, detail) => {
      acc[detail.nodeStatus] += 1
      return acc
    },
    { pending: 0, "in-progress": 0, completed: 0, unassigned: 0 },
  )

const buildTasksByNode = (tasks: Task[]) => {
  const map = new Map<string, Task[]>()

  tasks.forEach((task) => {
    if (!task.nodeId) return
    const current = map.get(task.nodeId) ?? []
    current.push(task)
    map.set(task.nodeId, current)
  })

  return map
}

const buildCalendarEntries = (
  tasks: Task[],
  processNodes: CalendarEntry["node"][],
): CalendarEntry[] => {
  const entries: CalendarEntry[] = []
  const processNodesById = new Map(processNodes.map((node) => [node?.id, node]))

  tasks.forEach((task) => {
    const node = task.nodeId ? processNodesById.get(task.nodeId) ?? null : null
    let dueDate = parseDateValue(task.due)

    if (!dueDate && node) {
      const { absoluteDate } = getDeadlineInfo(node?.data)
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
    if (!node) return
    const { absoluteDate } = getDeadlineInfo(node.data)
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

  const tasksByNode = useMemo(() => buildTasksByNode(tasks), [tasks])

  const [statusFilter, setStatusFilter] = useState<NodeStatusFilter>("all")

  const processNodeDetails = useMemo(() => {
    return processNodes.map((node) => {
      const nodeData = node.data
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

  const statusCounts = useMemo(() => buildStatusCounts(processNodeDetails), [processNodeDetails])

  const filteredProcessNodes = useMemo(() => {
    if (statusFilter === "all") {
      return processNodeDetails
    }

    return processNodeDetails.filter((detail) => detail.nodeStatus === statusFilter)
  }, [processNodeDetails, statusFilter])

  const calendarEntries = useMemo(
    () => buildCalendarEntries(tasks, processNodes),
    [tasks, processNodes],
  )

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

  const primaryInput = inputNodes[0]?.data
  const primaryOutput = outputNodes[0]?.data

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

export default CalendarView

