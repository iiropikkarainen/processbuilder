"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { CalendarClock, Clock, Settings, UserCircle2 } from "lucide-react"
import type { NodeData } from "@/lib/types"
export const ProcessNode = memo(({ id, data, isConnectable }: NodeProps<NodeData>) => {
  const assignmentLabel =
    data.assignmentType === "role"
      ? data.assignedRole
      : data.assignedProcessor

  let deadlineDisplay: string | undefined
  if (data.deadlineType === "absolute" && data.deadlineAbsolute) {
    const parsedDate = new Date(data.deadlineAbsolute)
    deadlineDisplay = Number.isNaN(parsedDate.getTime())
      ? data.deadlineAbsolute
      : parsedDate.toLocaleString()
  } else if (data.deadlineType === "relative" && data.deadlineRelativeValue) {
    const unit = data.deadlineRelativeUnit === "hours" ? "hrs" : "days"
    deadlineDisplay = `+${data.deadlineRelativeValue} ${unit}`
  }

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[150px]">
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-500">
          <Settings className="h-4 w-4" />
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label || "Process"}</div>
          <div className="text-xs text-gray-500">
            {data.description || "Data processing node"}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {assignmentLabel ? (
          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-[10px] font-medium text-purple-700">
            <UserCircle2 className="h-3 w-3" />
            {assignmentLabel}
          </span>
        ) : null}
        {data.expectedDuration ? (
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">
            <Clock className="h-3 w-3" />
            {data.expectedDuration}
          </span>
        ) : null}
        {deadlineDisplay ? (
          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-700">
            <CalendarClock className="h-3 w-3" />
            {deadlineDisplay}
          </span>
        ) : null}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  )
})

ProcessNode.displayName = "ProcessNode"
