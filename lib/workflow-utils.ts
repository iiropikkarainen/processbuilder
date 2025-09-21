import type { Node, XYPosition } from "reactflow"
import type { NodeData, ProcessDeadline } from "./types"

let nodeIdCounter = 0

export const generateNodeId = (type: string): string => {
  nodeIdCounter++
  return `${type}-${nodeIdCounter}`
}

export const createNode = ({
  type,
  position,
  id,
}: {
  type: string
  position: XYPosition
  id: string
}): Node<NodeData> => {
  const baseNode = {
    id,
    type,
    position,
    data: {
      label: getDefaultLabel(type),
      description: getDefaultDescription(type),
      tasks: [],
    },
  }

  switch (type) {
    case "input":
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          dataSource: "manual",
          sampleData: '{"example": "data"}',
        },
      }
    case "output":
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          outputType: "console",
          outputFormat: "json",
        },
      }
    case "process":
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          assignmentType: "user",
          assignedProcessor: "",
          assignedRole: "",
          allowReassignment: true,
          approver: "",
          predecessorNodeIds: [],
          conditionalLogic: "",
          expectedDuration: "",
          deadlineType: "relative",
          deadlineRelativeValue: "",
          deadlineRelativeUnit: "days",
          deadlineAbsolute: "",
          reminderEnabled: false,
          reminderLeadTime: "",
          reminderLeadTimeUnit: "hours",
          outputRequirementType: "markDone",
          outputStructuredDataTemplate: "",
          validationRequireOutput: false,
          validationNotes: "",
        },
      }
    case "conditional":
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          condition: "data.value > 0",
          trueLabel: "Yes",
          falseLabel: "No",
        },
      }
    case "code":
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          codeLanguage: "javascript",
          code: "// Write your code here\nfunction process(data) {\n  // Transform data\n  return data;\n}",
        },
      }
    default:
      return baseNode
  }
}

const getDefaultLabel = (type: string): string => {
  switch (type) {
    case "input":
      return "Input"
    case "output":
      return "Output"
    case "process":
      return "Process"
    case "conditional":
      return "Conditional"
    case "code":
      return "Code"
    default:
      return "Node"
  }
}

const getDefaultDescription = (type: string): string => {
  switch (type) {
    case "input":
      return "Data input node"
    case "output":
      return "Data output node"
    case "process":
      return "Data processing node"
    case "conditional":
      return "Conditional branching"
    case "code":
      return "Custom code execution"
    default:
      return "Workflow node"
  }
}

export const deadlinesAreEqual = (
  a: ProcessDeadline | null,
  b: ProcessDeadline | null,
): boolean => {
  if (a === b) return true
  if (!a || !b) return false
  if (a.type !== b.type) return false
  if (a.nodeId !== b.nodeId) return false
  if ((a.nodeLabel ?? "") !== (b.nodeLabel ?? "")) return false

  if (a.type === "absolute" && b.type === "absolute") {
    return a.value === b.value
  }

  if (a.type === "relative" && b.type === "relative") {
    return a.value === b.value && a.unit === b.unit
  }

  return false
}
