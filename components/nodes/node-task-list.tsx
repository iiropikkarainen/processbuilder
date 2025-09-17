"use client"

import { useState, type ChangeEvent } from "react"

import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface NodeTaskListProps {
  nodeId: string
  tasks: Task[]
  availableTasks?: Task[]
  className?: string
  title?: string
  onAddTask?: (nodeId: string, text: string) => void
  onAttachTask?: (taskId: number, nodeId: string) => void
  onDueDateChange?: (taskId: number, due: string) => void
  onMarkDone?: (taskId: number) => void
}

const placeholderOption = ""

export function NodeTaskList({
  nodeId,
  tasks,
  availableTasks,
  className,
  title = "Task Checklist",
  onAddTask,
  onAttachTask,
  onDueDateChange,
  onMarkDone,
}: NodeTaskListProps) {
  const [newTaskText, setNewTaskText] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string>(placeholderOption)

  const handleCreateTask = () => {
    const trimmed = newTaskText.trim()
    if (!trimmed || !onAddTask) return

    onAddTask(nodeId, trimmed)
    setNewTaskText("")
  }

  const handleAssignExisting = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setSelectedTaskId(value)

    if (!value || !onAttachTask) return

    const parsedId = Number(value)
    if (Number.isNaN(parsedId)) return

    onAttachTask(parsedId, nodeId)
    setSelectedTaskId(placeholderOption)
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-md border border-dashed border-gray-200 bg-gray-50 p-2",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {onAttachTask && availableTasks && availableTasks.length > 0 ? (
          <select
            value={selectedTaskId}
            onChange={handleAssignExisting}
            className="rounded border px-2 py-1 text-[10px] text-gray-700"
          >
            <option value={placeholderOption}>Add from checklist</option>
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.text}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-1 rounded border bg-white p-2">
              <div className="text-xs font-medium text-gray-800">{task.text}</div>
              <input
                type="datetime-local"
                value={task.due}
                onChange={(event) => onDueDateChange?.(task.id, event.target.value)}
                className="w-full rounded border px-2 py-1 text-[10px]"
                disabled={!onDueDateChange}
              />
              <button
                type="button"
                onClick={() => onMarkDone?.(task.id)}
                disabled={task.completed || !onMarkDone}
                className={`w-full rounded px-2 py-1 text-[10px] font-medium ${
                  task.completed
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } ${!onMarkDone ? "opacity-50" : ""}`}
              >
                {task.completed ? "Done" : "Mark as done"}
              </button>
              {task.completed && (
                <div className="text-[10px] text-gray-500">
                  Completed by {task.completedBy}
                  {task.completedAt ? ` at ${task.completedAt}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-gray-300 bg-white p-2 text-[10px] text-gray-500">
          No tasks yet. Use the field below to create one.
        </div>
      )}

      {onAddTask ? (
        <div className="flex items-center gap-2">
          <input
            value={newTaskText}
            onChange={(event) => setNewTaskText(event.target.value)}
            placeholder="Add action item"
            className="flex-1 rounded border px-2 py-1 text-[10px]"
          />
          <button
            type="button"
            onClick={handleCreateTask}
            className="rounded bg-blue-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      ) : null}
    </div>
  )
}
