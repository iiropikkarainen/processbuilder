"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Code } from "lucide-react"
import type { NodeData } from "@/lib/types"
import { NodeTaskList } from "./node-task-list"

export const CodeNode = memo(({ id, data, isConnectable }: NodeProps<NodeData>) => {
  const showTaskList =
    (data.tasks?.length ?? 0) > 0 ||
    (data.availableTasks?.length ?? 0) > 0 ||
    Boolean(data.createTask)

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-gray-500 min-w-[150px]">
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500">
          <Code className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label || "Code"}</div>
          <div className="text-xs text-gray-500">{data.description || "Custom code execution"}</div>
        </div>
      </div>

      {data.codeLanguage && <div className="mt-2 text-xs bg-gray-100 p-1 rounded">Language: {data.codeLanguage}</div>}

      {showTaskList ? (
        <NodeTaskList
          nodeId={id}
          tasks={data.tasks ?? []}
          availableTasks={data.availableTasks}
          onAddTask={data.createTask}
          onAttachTask={data.assignTask}
          onDueDateChange={data.updateTaskDueDate}
          onMarkDone={data.markTaskDone}
          title="Tasks"
          variant="node"
          className="mt-3"
        />
      ) : null}

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-gray-500" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-gray-500" />
    </div>
  )
})

CodeNode.displayName = "CodeNode"
