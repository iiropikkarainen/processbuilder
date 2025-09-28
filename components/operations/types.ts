import type { Dispatch, SetStateAction, JSX } from "react"

import type {
  OutputRequirementType,
  OutputSubmission,
  ProcessDeadline,
  Task,
  Workflow,
  WorkflowNode,
} from "@/lib/types"

export type Subcategory = {
  id: string
  title: string
}

export type ProcessSettings = {
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

export type SopStatus = "active" | "in-design" | "inactive"

export type Sop = {
  id: string
  title: string
  subcategoryId: string
  owner: string
  lastUpdated: string
  status: SopStatus
  content: string
  processSettings: ProcessSettings
}

export type Category = {
  id: string
  title: string
  subcategories: Subcategory[]
  sops: Sop[]
  supabaseId?: string
}

export interface OpsCatalogProps {
  query: string
}

export type SopImportOption = {
  id: string
  name: string
  description: string
  Logo: () => JSX.Element
}

export type OutputSubmissionPayload = {
  type: OutputRequirementType
  value: string
  fileName?: string
}

export type DeadlineInfo = { label: string; absoluteDate: Date | null }

export type AssignmentInfo = { label: string; notes: string[] }

export type OutputRequirementInfo = {
  label: string
  notes: string[]
  type: OutputRequirementType
}

export type NodeStatus = "pending" | "in-progress" | "completed" | "unassigned"

export type NodeStatusFilter = NodeStatus | "all"

export type CalendarEntry = {
  id: string
  task: Task | null
  node: WorkflowNode | null
  dueDate: Date
}

export type CalendarViewProps = {
  tasks: Task[]
  workflow: Workflow | null
  processName: string
  outputSubmissions: Record<string, OutputSubmission | undefined>
  onSubmitOutput: (nodeId: string, payload: OutputSubmissionPayload) => void
}

export type ProcessViewProps = {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
  onLastProcessDeadlineChange?: (deadline: ProcessDeadline | null) => void
  onWorkflowUpdate?: (workflow: Workflow) => void
}

export type ProcessSettingsViewProps = {
  settings: ProcessSettings | null
  onChange: (settings: ProcessSettings) => void
}

