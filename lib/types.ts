import type { Node } from "reactflow"

export interface Task {
  id: string
  text: string
  due: string
  completed: boolean
  completedBy: string
  completedAt: string | null
  nodeId: string | null
}

export type OutputCompletionType = "markDone" | "scheduled"
export type OutputAlertChannel = "slack" | "teams" | "email"
export type OutputRequirementType = "markDone" | "file" | "link" | "text"

export interface OutputSubmission {
  nodeId: string
  type: OutputRequirementType
  value: string
  fileName?: string
  completedBy: string
  completedAt: string
}

export type ProcessDeadline =
  | {
      type: "relative"
      value: string
      unit: "hours" | "days"
      nodeId: string
      nodeLabel?: string
    }
  | {
      type: "absolute"
      value: string
      nodeId: string
      nodeLabel?: string
    }

export interface NodeData {
  label: string
  description?: string
  required?: boolean

  // Input node properties
  startTriggerType?: "schedule" | "process" | "serviceDesk"
  startTriggerScheduledAt?: string
  startTriggerProcessCategory?: string
  startTriggerProcessId?: string
  startTriggerServiceDeskRequests?: string[]

  // Output node properties
  outputCompletionType?: OutputCompletionType
  outputCompletionScheduledAt?: string
  outputAlertChannels?: OutputAlertChannel[]
  outputMarkServiceDeskDone?: boolean

  // Process node properties
  assignmentType?: "user" | "role"
  assignedProcessor?: string
  assignedRole?: string
  allowReassignment?: boolean
  approver?: string
  predecessorNodeIds?: string[]
  conditionalLogic?: string
  expectedDuration?: string
  deadlineType?: "relative" | "absolute"
  deadlineRelativeValue?: string
  deadlineRelativeUnit?: "hours" | "days"
  deadlineAbsolute?: string
  reminderEnabled?: boolean
  reminderLeadTime?: string
  reminderLeadTimeUnit?: "hours" | "days"
  outputRequirementType?: OutputRequirementType
  outputStructuredDataTemplate?: string
  validationRequireOutput?: boolean
  validationNotes?: string

  // Conditional node properties
  condition?: string
  trueLabel?: string
  falseLabel?: string

  // Code node properties
  codeLanguage?: "javascript" | "typescript"
  code?: string

  // Task management
  tasks?: Task[]
  availableTasks?: Task[]
  assignTask?: (taskId: string, nodeId: string | null) => void
  createTask?: (nodeId: string, text: string) => void
  updateTaskDueDate?: (taskId: string, due: string) => void
  markTaskDone?: (taskId: string) => void
}

export type WorkflowNode = Node<NodeData>

export interface Workflow {
  nodes: WorkflowNode[]
  edges: any[]
}
