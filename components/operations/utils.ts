import type { NodeData, OutputSubmission, Task } from "@/lib/types"

import type {
  AssignmentInfo,
  Category,
  DeadlineInfo,
  NodeStatus,
  OutputRequirementInfo,
  OutputSubmissionPayload,
} from "./types"

export const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")

export const buildSopContent = (title: string, prompt?: string) => {
  const baseTemplate = `# Process: ${title}

## Purpose
Describe the goal of the procedure.

## Process
1. Document the first step.
2. Capture supporting tasks.
3. Confirm completion with stakeholders.`

  const trimmedPrompt = prompt?.trim()
  if (!trimmedPrompt) {
    return baseTemplate
  }

  return `${baseTemplate}

---
_AI generation prompt_
${trimmedPrompt}`
}

export const filterData = (data: Category[], query: string) => {
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

export const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

export const formatDateTime = (date: Date): string =>
  date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export const getDeadlineInfo = (data?: NodeData | null): DeadlineInfo => {
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

export const getAssignmentInfo = (data?: NodeData | null): AssignmentInfo => {
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

export const OUTPUT_ACTION_LABELS: Record<OutputSubmissionPayload["type"], string> = {
  markDone: "Marked step complete",
  file: "Uploaded supporting file",
  link: "Provided link or URL",
  text: "Submitted text update",
}

export const getOutputRequirementInfo = (data?: NodeData | null): OutputRequirementInfo => {
  const requirementMap: Record<OutputSubmissionPayload["type"] | undefined, string> = {
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

export const buildCompletionLog = (tasks: Task[], submission?: OutputSubmission): string[] => {
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

export const determineNodeStatus = (
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

