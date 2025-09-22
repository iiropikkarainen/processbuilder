"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { CalendarClock } from "lucide-react"
import type { NodeData } from "@/lib/types"
import { describeInputStartTrigger } from "@/lib/workflow-utils"
export const InputNode = memo(({ id, data, isConnectable }: NodeProps<NodeData>) => {
  const triggerDescription = describeInputStartTrigger(data)
  const triggerTypeLabel = (() => {
    switch (data.startTriggerType) {
      case "process":
        return "Process dependency"
      case "serviceDesk":
        return "Service desk trigger"
      case "schedule":
      default:
        return "Scheduled start"
    }
  })()

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[150px]">
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-500">
          <CalendarClock className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label || "Input"}</div>
          <div className="text-xs text-gray-500">
            {data.description || "Data input node"}
          </div>
        </div>
      </div>

      {triggerDescription ? (
        <div className="mt-3 space-y-1 text-xs">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">
            {triggerTypeLabel}
          </span>
          <p className="text-gray-500">{triggerDescription}</p>
        </div>
      ) : null}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  )
})

InputNode.displayName = "InputNode"
