"use client"

import { useCallback, useMemo } from "react"

import WorkflowBuilder from "../workflow-builder"

import type { ProcessViewProps } from "./types"
import { CURRENT_PROCESSOR_NAME } from "./data"

const ProcessView = ({
  tasks,
  setTasks,
  onLastProcessDeadlineChange,
  onWorkflowUpdate,
}: ProcessViewProps) => {
  const unassignedTasks = useMemo(() => tasks.filter((task) => !task.nodeId), [tasks])

  const assignTaskToNode = useCallback(
    (taskId: number, nodeId: string | null) => {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, nodeId } : task)))
    },
    [setTasks],
  )

  const handleDueDateChange = useCallback(
    (taskId: number, date: string) => {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, due: date } : task)))
    },
    [setTasks],
  )

  const handleMarkDone = useCallback(
    (taskId: number) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: true,
                completedBy: CURRENT_PROCESSOR_NAME,
                completedAt: new Date().toLocaleString(),
              }
            : task,
        ),
      )
    },
    [setTasks],
  )

  const handleCreateTask = useCallback(
    (nodeId: string, text: string) => {
      setTasks((prev) => [
        ...prev,
        {
          id: Date.now(),
          text,
          due: "",
          completed: false,
          completedBy: "",
          completedAt: null,
          nodeId,
        },
      ])
    },
    [setTasks],
  )

  return (
    <WorkflowBuilder
      className="h-full bg-white"
      tasks={tasks}
      availableTasks={unassignedTasks}
      onAssignTask={assignTaskToNode}
      onUpdateTaskDueDate={handleDueDateChange}
      onMarkTaskDone={handleMarkDone}
      onCreateTask={handleCreateTask}
      onLastProcessDeadlineChange={onLastProcessDeadlineChange}
      onWorkflowUpdate={onWorkflowUpdate}
    />
  )
}

export default ProcessView

