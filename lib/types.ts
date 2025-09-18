import type { Node } from "reactflow"

export interface Task {
  id: number
  text: string
  due: string
  completed: boolean
  completedBy: string
  completedAt: string | null
  nodeId: string | null
}

export interface NodeData {
  label: string
  description?: string
  required?: boolean

  // Input node properties
  dataSource?: "manual" | "api" | "database" | "file"
  sampleData?: string

  // Output node properties
  outputType?: "console" | "api" | "database" | "file"
  outputFormat?: "json" | "csv" | "xml" | "text"

  // Process node properties
  processType?: "transform" | "filter" | "aggregate" | "sort"
  processConfig?: string

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
  assignTask?: (taskId: number, nodeId: string | null) => void
  createTask?: (nodeId: string, text: string) => void
  updateTaskDueDate?: (taskId: number, due: string) => void
  markTaskDone?: (taskId: number) => void
}

export type WorkflowNode = Node<NodeData>

export interface Workflow {
  nodes: WorkflowNode[]
  edges: any[]
}
