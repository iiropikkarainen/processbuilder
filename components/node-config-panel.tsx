"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { WorkflowNode } from "@/lib/types"
import CodeEditor from "./code-editor"

interface NodeConfigPanelProps {
  node: WorkflowNode
  updateNodeData: (nodeId: string, data: any) => void
  onClose: () => void
}

export default function NodeConfigPanel({ node, updateNodeData, onClose }: NodeConfigPanelProps) {
  const [localData, setLocalData] = useState({ ...node.data })
  const handleChange = (key: string, value: any) => {
    setLocalData((prev) => ({
      ...prev,
      [key]: value,
    }))
    updateNodeData(node.id, { [key]: value })
  }

  const renderInputFields = () => {
    switch (node.type) {
      case "input":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select
                value={localData.dataSource || "manual"}
                onValueChange={(value) => handleChange("dataSource", value)}
              >
                <SelectTrigger id="dataSource">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Input</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleData">Sample Data (JSON)</Label>
              <Textarea
                id="sampleData"
                value={localData.sampleData || ""}
                onChange={(e) => handleChange("sampleData", e.target.value)}
                className="h-32"
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        )

      case "output":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="outputType">Output Type</Label>
              <Select
                value={localData.outputType || "console"}
                onValueChange={(value) => handleChange("outputType", value)}
              >
                <SelectTrigger id="outputType">
                  <SelectValue placeholder="Select output type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="console">Console</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputFormat">Output Format</Label>
              <Select
                value={localData.outputFormat || "json"}
                onValueChange={(value) => handleChange("outputFormat", value)}
              >
                <SelectTrigger id="outputFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case "process": {
        const assignmentType = (localData.assignmentType ?? "user") as "user" | "role"
        const deadlineType = (localData.deadlineType ?? "absolute") as "relative" | "absolute"
        const reminderEnabled = Boolean(localData.reminderEnabled)
        const deadlineRelativeUnit = (localData.deadlineRelativeUnit ?? "days") as "hours" | "days"
        const reminderUnit = (localData.reminderLeadTimeUnit ?? "hours") as "hours" | "days"

        const deadlineAbsoluteDate = (() => {
          const value = localData.deadlineAbsolute

          if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? undefined : value
          }

          if (typeof value === "string" && value) {
            const parsed = new Date(value)
            return Number.isNaN(parsed.getTime()) ? undefined : parsed
          }

          return undefined
        })()

        const deadlineAbsoluteTimeValue = (() => {
          if (!deadlineAbsoluteDate) {
            return ""
          }

          const hours = deadlineAbsoluteDate.getHours().toString().padStart(2, "0")
          const minutes = deadlineAbsoluteDate.getMinutes().toString().padStart(2, "0")

          return `${hours}:${minutes}`
        })()

        const handleAbsoluteDateChange = (date: Date | undefined) => {
          if (!date) {
            handleChange("deadlineAbsolute", undefined)
            return
          }

          const nextDate = new Date(date)

          if (deadlineAbsoluteDate) {
            nextDate.setHours(
              deadlineAbsoluteDate.getHours(),
              deadlineAbsoluteDate.getMinutes(),
              0,
              0,
            )
          }

          handleChange("deadlineAbsolute", nextDate.toISOString())
        }

        const handleAbsoluteTimeChange = (value: string) => {
          if (!value) {
            if (!deadlineAbsoluteDate) {
              handleChange("deadlineAbsolute", undefined)
              return
            }

            const resetDate = new Date(deadlineAbsoluteDate)
            resetDate.setHours(0, 0, 0, 0)
            handleChange("deadlineAbsolute", resetDate.toISOString())
            return
          }

          const [hoursPart, minutesPart] = value.split(":")
          const hours = Number.parseInt(hoursPart ?? "", 10)
          const minutes = Number.parseInt(minutesPart ?? "", 10)

          if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return
          }

          const baseDate = deadlineAbsoluteDate ? new Date(deadlineAbsoluteDate) : new Date()
          baseDate.setHours(hours, minutes, 0, 0)

          handleChange("deadlineAbsolute", baseDate.toISOString())
        }

        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Assignment &amp; Ownership
                </h3>
                <p className="text-xs text-gray-500">
                  Decide who runs this step and who needs to sign off before the work is complete.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Processor Assignment</Label>
                <RadioGroup
                  value={assignmentType}
                  onValueChange={(value) => handleChange("assignmentType", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="assignment-user" />
                    <Label htmlFor="assignment-user" className="font-normal">
                      Specific processor
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="role" id="assignment-role" />
                    <Label htmlFor="assignment-role" className="font-normal">
                      Role or team
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {assignmentType === "role" ? (
                <div className="space-y-2">
                  <Label htmlFor="assignedRole">Assigned role</Label>
                  <Input
                    id="assignedRole"
                    value={localData.assignedRole || ""}
                    onChange={(event) => handleChange("assignedRole", event.target.value)}
                    placeholder="e.g., Finance Team"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="assignedProcessor">Assigned processor</Label>
                  <Input
                    id="assignedProcessor"
                    value={localData.assignedProcessor || ""}
                    onChange={(event) => handleChange("assignedProcessor", event.target.value)}
                    placeholder="Name or email"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="allowReassignment"
                  checked={localData.allowReassignment ?? false}
                  onCheckedChange={(checked) => handleChange("allowReassignment", checked)}
                />
                <Label htmlFor="allowReassignment">Allow reassignment if workload shifts</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver">Approver (optional)</Label>
                <Input
                  id="approver"
                  value={localData.approver || ""}
                  onChange={(event) => handleChange("approver", event.target.value)}
                  placeholder="Who signs off on completion?"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Scheduling &amp; Time Controls
                </h3>
                <p className="text-xs text-gray-500">
                  Estimate how long the work takes, define deadlines, and automate reminders.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDuration">Expected duration</Label>
                <Input
                  id="expectedDuration"
                  value={localData.expectedDuration || ""}
                  onChange={(event) => handleChange("expectedDuration", event.target.value)}
                  placeholder="e.g., 2h or 1d"
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline rules</Label>
                <RadioGroup
                  value={deadlineType}
                  defaultValue="absolute"
                  onValueChange={(value) => handleChange("deadlineType", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="absolute" id="deadline-absolute" />
                    <Label htmlFor="deadline-absolute" className="font-normal">
                      Absolute calendar deadline
                    </Label>
                  </div>
                  {deadlineType === "absolute" ? (
                    <div className="ml-6 mt-2 space-y-3">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown-buttons"
                        defaultMonth={deadlineAbsoluteDate ?? new Date()}
                        selected={deadlineAbsoluteDate}
                        onSelect={handleAbsoluteDateChange}
                        className="rounded-lg border shadow-sm"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="deadline-absolute-time"
                          className="text-xs font-medium text-gray-500"
                        >
                          Due time
                        </Label>
                        <Input
                          id="deadline-absolute-time"
                          type="time"
                          value={deadlineAbsoluteTimeValue}
                          onChange={(event) => handleAbsoluteTimeChange(event.target.value)}
                          className="w-40"
                        />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relative" id="deadline-relative" />
                    <Label htmlFor="deadline-relative" className="font-normal">
                      Relative to a predecessor
                    </Label>
                  </div>
                  {deadlineType === "relative" ? (
                    <div className="ml-6 mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={localData.deadlineRelativeValue || ""}
                        onChange={(event) => handleChange("deadlineRelativeValue", event.target.value)}
                        placeholder="0"
                      />
                      <Select
                        value={deadlineRelativeUnit}
                        onValueChange={(value) => handleChange("deadlineRelativeUnit", value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-gray-500">after dependencies finish</span>
                    </div>
                  ) : null}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Reminder settings</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onCheckedChange={(checked) => handleChange("reminderEnabled", checked)}
                  />
                  <Label htmlFor="reminderEnabled" className="font-normal">
                    Notify the processor before the deadline
                  </Label>
                </div>
                {reminderEnabled ? (
                  <div className="ml-6 mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={localData.reminderLeadTime || ""}
                      onChange={(event) => handleChange("reminderLeadTime", event.target.value)}
                      placeholder="4"
                    />
                    <Select
                      value={reminderUnit}
                      onValueChange={(value) => handleChange("reminderLeadTimeUnit", value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-500">before it&apos;s due</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Outputs &amp; Validation
                </h3>
                <p className="text-xs text-gray-500">
                  Capture what this step should produce and the rules for marking it complete.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputRequirementType">Output requirements</Label>
                <Select
                  value={localData.outputRequirementType || "markDone"}
                  onValueChange={(value) => handleChange("outputRequirementType", value)}
                >
                  <SelectTrigger id="outputRequirementType">
                    <SelectValue placeholder="Select output type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markDone">Mark as done</SelectItem>
                    <SelectItem value="file">File upload</SelectItem>
                    <SelectItem value="link">Link or URL</SelectItem>
                    <SelectItem value="text">Text / form response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      }

      case "conditional":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={localData.condition || ""}
                onChange={(e) => handleChange("condition", e.target.value)}
                placeholder="data.value > 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trueLabel">True Path Label</Label>
              <Input
                id="trueLabel"
                value={localData.trueLabel || "Yes"}
                onChange={(e) => handleChange("trueLabel", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="falseLabel">False Path Label</Label>
              <Input
                id="falseLabel"
                value={localData.falseLabel || "No"}
                onChange={(e) => handleChange("falseLabel", e.target.value)}
              />
            </div>
          </>
        )

      case "code":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="codeLanguage">Language</Label>
              <Select
                value={localData.codeLanguage || "javascript"}
                onValueChange={(value) => handleChange("codeLanguage", value)}
              >
                <SelectTrigger id="codeLanguage">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <CodeEditor
                value={
                  localData.code ||
                  "// Write your code here\nfunction process(data) {\n  // Transform data\n  return data;\n}"
                }
                onChange={(value) => handleChange("code", value)}
                language={localData.codeLanguage || "javascript"}
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Configure {node.data.label}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="label">Node Label</Label>
          <Input id="label" value={localData.label || ""} onChange={(e) => handleChange("label", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={localData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe what this node does"
          />
        </div>

        <div className="flex items-center space-x-2 py-2">
          <Switch
            id="required"
            checked={localData.required || false}
            onCheckedChange={(checked) => handleChange("required", checked)}
          />
          <Label htmlFor="required">Required Node</Label>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        {renderInputFields()}

        <div className="border-t border-gray-200 my-4"></div>
      </div>
    </div>
  )
}
