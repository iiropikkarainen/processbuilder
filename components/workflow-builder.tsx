"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Panel,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from "reactflow"
import "reactflow/dist/style.css"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Save, Upload, Play } from "lucide-react"
import NodeLibrary from "./node-library"
import NodeConfigPanel from "./node-config-panel"
import CustomEdge from "./custom-edge"
import { InputNode } from "./nodes/input-node"
import { OutputNode } from "./nodes/output-node"
import { ProcessNode } from "./nodes/process-node"
import { ConditionalNode } from "./nodes/conditional-node"
import { CodeNode } from "./nodes/code-node"
import { generateNodeId, createNode, deadlinesAreEqual } from "@/lib/workflow-utils"
import { cn } from "@/lib/utils"
import type {
  Task,
  WorkflowNode,
  NodeData,
  ProcessDeadline,
  Workflow,
} from "@/lib/types"

const nodeTypes: NodeTypes = {
  input: InputNode,
  output: OutputNode,
  process: ProcessNode,
  conditional: ConditionalNode,
  code: CodeNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

const areTaskListsEqual = (a?: Task[], b: Task[] = []): boolean => {
  if (!a && b.length === 0) {
    return true
  }

  if (!a || a.length !== b.length) {
    return false
  }

  return a.every((task, index) => {
    const other = b[index]
    return (
      task.id === other.id &&
      task.text === other.text &&
      task.due === other.due &&
      task.completed === other.completed &&
      task.completedBy === other.completedBy &&
      task.completedAt === other.completedAt &&
      task.nodeId === other.nodeId
    )
  })
}

const DEFAULT_HORIZONTAL_POSITION = 250
const VERTICAL_NODE_SPACING = 180

const generateSequentialFlow = (tasks: Task[]) => {
  const generatedNodes: Node<NodeData>[] = []
  const generatedEdges: Edge[] = []
  const processNodeIds: string[] = []

  const inputNode = createNode({
    type: "input",
    position: { x: DEFAULT_HORIZONTAL_POSITION, y: 0 },
    id: generateNodeId("input"),
  })

  generatedNodes.push(inputNode)

  let previousNodeId = inputNode.id

  tasks.forEach((task, index) => {
    const processNode = createNode({
      type: "process",
      position: {
        x: DEFAULT_HORIZONTAL_POSITION,
        y: VERTICAL_NODE_SPACING * (index + 1),
      },
      id: generateNodeId("process"),
    })

    const trimmedText = task.text.trim()

    generatedNodes.push({
      ...processNode,
      data: {
        ...processNode.data,
        label: trimmedText || processNode.data.label,
        description: `Step ${index + 1}`,
      },
    })

    generatedEdges.push({
      id: `edge-${previousNodeId}-${processNode.id}`,
      source: previousNodeId,
      target: processNode.id,
      type: "custom",
    })

    previousNodeId = processNode.id
    processNodeIds.push(processNode.id)
  })

  const outputNode = createNode({
    type: "output",
    position: {
      x: DEFAULT_HORIZONTAL_POSITION,
      y: VERTICAL_NODE_SPACING * (tasks.length + 1),
    },
    id: generateNodeId("output"),
  })

  generatedNodes.push(outputNode)

  generatedEdges.push({
    id: `edge-${previousNodeId}-${outputNode.id}`,
    source: previousNodeId,
    target: outputNode.id,
    type: "custom",
  })

  return { nodes: generatedNodes, edges: generatedEdges, processNodeIds }
}

type WorkflowBuilderProps = {
  className?: string
  tasks?: Task[]
  availableTasks?: Task[]
  onAssignTask?: (taskId: number, nodeId: string | null) => void
  onCreateTask?: (nodeId: string, text: string) => void
  onUpdateTaskDueDate?: (taskId: number, due: string) => void
  onMarkTaskDone?: (taskId: number) => void
  onLastProcessDeadlineChange?: (deadline: ProcessDeadline | null) => void
  onWorkflowUpdate?: (workflow: Workflow) => void
}

export default function WorkflowBuilder({
  className,
  tasks,
  availableTasks,
  onAssignTask,
  onCreateTask,
  onUpdateTaskDueDate,
  onMarkTaskDone,
  onLastProcessDeadlineChange,
  onWorkflowUpdate,
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const lastDeadlineRef = useRef<ProcessDeadline | null>(null)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: "custom" }, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow")

      if (typeof type === "undefined" || !type) {
        return
      }

      if (reactFlowBounds && reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        const newNode = createNode({
          type,
          position,
          id: generateNodeId(type),
        })

        setNodes((nds) => nds.concat(newNode))
      }
    },
    [reactFlowInstance, setNodes],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  useEffect(() => {
    setNodes((nds) => {
      if (!nds.length) {
        return nds
      }

      let hasChanges = false

      const nextNodes = nds.map((node) => {
        const nodeTasks = (tasks ?? []).filter((task) => task.nodeId === node.id)
        const tasksChanged = !areTaskListsEqual(node.data.tasks, nodeTasks)
        const availableChanged = !areTaskListsEqual(node.data.availableTasks, availableTasks ?? [])
        const assignChanged = node.data.assignTask !== onAssignTask
        const createChanged = node.data.createTask !== onCreateTask
        const dueChanged = node.data.updateTaskDueDate !== onUpdateTaskDueDate
        const markChanged = node.data.markTaskDone !== onMarkTaskDone

        if (
          !tasksChanged &&
          !availableChanged &&
          !assignChanged &&
          !createChanged &&
          !dueChanged &&
          !markChanged
        ) {
          return node
        }

        hasChanges = true

        return {
          ...node,
          data: {
            ...node.data,
            tasks: nodeTasks,
            availableTasks: availableTasks ?? [],
            assignTask: onAssignTask,
            createTask: onCreateTask,
            updateTaskDueDate: onUpdateTaskDueDate,
            markTaskDone: onMarkTaskDone,
          },
        }
      })

      return hasChanges ? nextNodes : nds
    })
  }, [
    nodes,
    tasks,
    availableTasks,
    onAssignTask,
    onCreateTask,
    onUpdateTaskDueDate,
    onMarkTaskDone,
    setNodes,
  ])

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    const updated = nodes.find((node) => node.id === selectedNode.id)

    if (!updated) {
      setSelectedNode(null)
      return
    }

    if (updated !== selectedNode) {
      setSelectedNode(updated)
    }
  }, [nodes, selectedNode])

  useEffect(() => {
    if (!onWorkflowUpdate) {
      return
    }

    onWorkflowUpdate({ nodes, edges })
  }, [nodes, edges, onWorkflowUpdate])

  useEffect(() => {
    if (!onLastProcessDeadlineChange) {
      return
    }

    const processNodes = nodes.filter((node) => node.type === "process")
    const configuredProcessNodes = processNodes.filter((node) => {
      const data = node.data ?? {}
      if (data.deadlineType === "absolute") {
        return Boolean(data.deadlineAbsolute)
      }

      if (data.deadlineType === "relative") {
        return data.deadlineRelativeValue !== undefined && data.deadlineRelativeValue !== ""
      }

      return false
    })

    let computedDeadline: ProcessDeadline | null = null

    if (configuredProcessNodes.length > 0) {
      const sortedNodes = [...configuredProcessNodes].sort(
        (a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0),
      )
      const lastNode = sortedNodes[sortedNodes.length - 1]
      const data = lastNode.data ?? {}

      if (data.deadlineType === "absolute" && data.deadlineAbsolute) {
        computedDeadline = {
          type: "absolute",
          value: data.deadlineAbsolute,
          nodeId: lastNode.id,
          nodeLabel: data.label,
        }
      } else if (
        data.deadlineType === "relative" &&
        data.deadlineRelativeValue !== undefined &&
        data.deadlineRelativeValue !== ""
      ) {
        computedDeadline = {
          type: "relative",
          value: data.deadlineRelativeValue,
          unit: data.deadlineRelativeUnit === "hours" ? "hours" : "days",
          nodeId: lastNode.id,
          nodeLabel: data.label,
        }
      }
    }

    if (!deadlinesAreEqual(lastDeadlineRef.current, computedDeadline)) {
      lastDeadlineRef.current = computedDeadline
      onLastProcessDeadlineChange(computedDeadline)
    }
  }, [nodes, onLastProcessDeadlineChange])

  const saveWorkflow = () => {
    if (nodes.length === 0) {
      toast({
        title: "Nothing to save",
        description: "Add some nodes to your workflow first",
        variant: "destructive",
      })
      return
    }

    const workflow = { nodes, edges }
    const workflowString = JSON.stringify(workflow)
    localStorage.setItem("workflow", workflowString)

    toast({
      title: "Workflow saved",
      description: "Your workflow has been saved successfully",
    })
  }

  const loadWorkflow = () => {
    if (Array.isArray(tasks)) {
      const { nodes: generatedNodes, edges: generatedEdges, processNodeIds } =
        generateSequentialFlow(tasks)

      setNodes(generatedNodes)
      setEdges(generatedEdges)
      setSelectedNode(null)

      if (onAssignTask) {
        tasks.forEach((task, index) => {
          onAssignTask(task.id, processNodeIds[index] ?? null)
        })
      }

      if (reactFlowInstance) {
        requestAnimationFrame(() => {
          reactFlowInstance?.fitView?.({ padding: 0.2 })
        })
      }

      toast({
        title: "Process flow generated",
        description:
          tasks.length > 0
            ? "Nodes were created automatically from the Process steps."
            : "A default input and output were created for this process.",
      })

      return
    }

    const savedWorkflow = localStorage.getItem("workflow")

    if (!savedWorkflow) {
      toast({
        title: "No saved workflow",
        description: "There is no workflow saved in your browser",
        variant: "destructive",
      })
      return
    }

    try {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedWorkflow)
      setNodes(savedNodes)
      setEdges(savedEdges)
      toast({
        title: "Workflow loaded",
        description: "Your workflow has been loaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error loading workflow",
        description: "There was an error loading your workflow",
        variant: "destructive",
      })
    }
  }

  const executeWorkflow = () => {
    if (nodes.length === 0) {
      toast({
        title: "Nothing to execute",
        description: "Add some nodes to your workflow first",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Executing workflow",
      description: "Your workflow is being executed (simulation only in this MVP)",
    })

    setTimeout(() => {
      toast({
        title: "Workflow executed",
        description: "Your workflow has been executed successfully",
      })
    }, 2000)
  }

  return (
    <ReactFlowProvider>
      <div className={cn("flex h-full min-h-[600px] w-full bg-white", className)}>
        <div className="w-64 border-r border-gray-200 p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Node Library</h2>
          <NodeLibrary />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultEdgeOptions={{ type: "custom" }}
            >
              <Background />
              <Controls />
              <MiniMap />
              <Panel position="top-right">
                <div className="flex gap-2">
                  <Button onClick={saveWorkflow} size="sm" variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={loadWorkflow} size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                  <Button onClick={executeWorkflow} size="sm" variant="default">
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {selectedNode && (
          <div className="w-[28rem] border-l border-gray-200 p-4 bg-gray-50">
            <NodeConfigPanel
              node={selectedNode as WorkflowNode}
              updateNodeData={updateNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
      </div>
    </ReactFlowProvider>
  )
}
