"use client"

import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "../ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Separator } from "../ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

import { cn } from "@/lib/utils"

import type { ProcessSettingsViewProps } from "./types"
import { DAY_OPTIONS, TIMEZONE_OPTIONS, VAULT_OPTIONS } from "./data"

const ProcessSettingsView = ({ settings, onChange }: ProcessSettingsViewProps) => {
  if (!settings) {
    return (
      <div className="text-sm text-gray-500">
        Select a Process from the catalog to configure its process settings.
      </div>
    )
  }

  const recurrenceOptions: {
    value: (typeof settings.recurrence)["frequency"]
    label: string
  }[] = [
    { value: "custom", label: "Custom (selected days)" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "annually", label: "Annually" },
  ]

  const handleOwnerChange = (value: string) => {
    onChange({
      ...settings,
      owner: value,
    })
  }

  const handleProcessTypeChange = (value: string) => {
    onChange({
      ...settings,
      processType: value as typeof settings.processType,
    })
  }

  const handleFrequencyChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: {
        ...settings.recurrence,
        frequency: value as typeof settings.recurrence.frequency,
      },
    })
  }

  const handleTimeChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, time: value },
    })
  }

  const handleTimezoneChange = (value: string) => {
    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, timezone: value },
    })
  }

  const toggleCustomDay = (day: string) => {
    const existingDays = settings.recurrence.customDays
    const nextDays = existingDays.includes(day)
      ? existingDays.filter((value) => value !== day)
      : [...existingDays, day]

    const orderedDays = DAY_OPTIONS.map((option) => option.value).filter((value) =>
      nextDays.includes(value),
    )

    onChange({
      ...settings,
      recurrence: { ...settings.recurrence, customDays: orderedDays },
    })
  }

  const toggleVaultAccess = (tool: string) => {
    const { vaultAccess } = settings
    const nextTools = vaultAccess.includes(tool)
      ? vaultAccess.filter((value) => value !== tool)
      : [...vaultAccess, tool]

    onChange({
      ...settings,
      vaultAccess: nextTools,
    })
  }

  const recurrenceSummary = (() => {
    if (settings.processType === "one-time") {
      return "This process will run a single time. Use the process view to coordinate execution."
    }

    const time = settings.recurrence.time
    const timezone = settings.recurrence.timezone

    switch (settings.recurrence.frequency) {
      case "daily":
        return `Runs every day at ${time} (${timezone}).`
      case "weekly":
        return `Runs every week at ${time} (${timezone}).`
      case "monthly":
        return `Runs every month at ${time} (${timezone}).`
      case "quarterly":
        return `Runs every quarter at ${time} (${timezone}).`
      case "annually":
        return `Runs every year at ${time} (${timezone}).`
      case "custom":
      default: {
        const selectedDays = DAY_OPTIONS.filter((option) =>
          settings.recurrence.customDays.includes(option.value),
        ).map((option) => option.label)

        if (!selectedDays.length) {
          return `Recurring schedule saved. Select at least one day to define when the process runs at ${time} (${timezone}).`
        }

        return `Runs on ${selectedDays.join(", ")} at ${time} (${timezone}).`
      }
    }
  })()

  const deadlineInfo = (() => {
    const deadline = settings.oneTimeDeadline ?? null

    if (!deadline) {
      return {
        summary:
          "No deadline synced yet. Configure the final process step's deadline to populate this field.",
        source: null as string | null,
      }
    }

    if (deadline.type === "absolute") {
      let formatted = deadline.value
      const parsed = new Date(deadline.value)
      if (!Number.isNaN(parsed.getTime())) {
        formatted = parsed.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      }

      return {
        summary: `Due by ${formatted}.`,
        source: deadline.nodeLabel ?? null,
      }
    }

    const rawValue = deadline.value.trim()
    const displayValue = rawValue || deadline.value
    const numericValue = Number(rawValue)
    const isSingular = !Number.isNaN(numericValue) && Math.abs(numericValue) === 1
    const unitLabel =
      deadline.unit === "hours"
        ? isSingular
          ? "hour"
          : "hours"
        : isSingular
          ? "day"
          : "days"

    return {
      summary: `Due ${displayValue} ${unitLabel} after dependencies finish.`,
      source: deadline.nodeLabel ?? null,
    }
  })()

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Process owner</h3>
          <p className="text-xs text-gray-500">
            Enter the email address of the person accountable for the execution and maintenance of
            this process.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="process-owner">Owner email</Label>
          <Input
            id="process-owner"
            type="email"
            autoComplete="email"
            placeholder="owner@example.com"
            value={settings.owner}
            onChange={(event) => handleOwnerChange(event.target.value)}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Scheduling</h3>
          <p className="text-xs text-gray-500">
            Configure when this process should run as a one-time handoff or a recurring workflow.
          </p>
        </div>

        <Tabs value={settings.processType} onValueChange={handleProcessTypeChange}>
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="one-time">One-time process</TabsTrigger>
            <TabsTrigger value="recurring">Recurring process</TabsTrigger>
          </TabsList>
          <TabsContent value="one-time" className="mt-4 space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              This process will execute once. Use assignments and due dates in the process view to
              manage work.
            </div>
            <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900">Deadline</div>
                <p className="text-xs text-gray-500">
                  Synced from the final process step&apos;s deadline rules in the Process Designer.
                </p>
              </div>
              <p className="text-sm text-gray-700">{deadlineInfo.summary}</p>
              {deadlineInfo.source ? (
                <p className="text-xs text-gray-500">Source step: “{deadlineInfo.source}”</p>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="recurring" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Frequency</Label>
                <RadioGroup
                  className="grid gap-2 md:grid-cols-2"
                  value={settings.recurrence.frequency}
                  onValueChange={handleFrequencyChange}
                >
                  {recurrenceOptions.map((option) => {
                    const id = `recurrence-${option.value}`
                    return (
                      <div key={option.value} className="flex items-start gap-3 rounded-lg border p-3">
                        <RadioGroupItem id={id} value={option.value} className="mt-1" />
                        <div>
                          <Label htmlFor={id} className="text-sm font-medium">
                            {option.label}
                          </Label>
                        </div>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {settings.recurrence.frequency === "custom" && (
                <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium">Select days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((day) => {
                      const id = `custom-day-${day.value}`
                      const checked = settings.recurrence.customDays.includes(day.value)
                      return (
                        <div
                          key={day.value}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2",
                            checked && "border-blue-500 bg-blue-50",
                          )}
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={() => toggleCustomDay(day.value)}
                          />
                          <Label htmlFor={id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurrence-time">Start time</Label>
                  <Input
                    id="recurrence-time"
                    type="time"
                    value={settings.recurrence.time}
                    onChange={(event) => handleTimeChange(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrence-timezone">Timezone</Label>
                  <Select
                    value={settings.recurrence.timezone}
                    onValueChange={handleTimezoneChange}
                  >
                    <SelectTrigger id="recurrence-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Vault access</h3>
          <p className="text-xs text-gray-500">
            Grant processors access to the tools they need when this process runs.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {VAULT_OPTIONS.map((tool) => {
            const id = `vault-${tool}`
            const checked = settings.vaultAccess.includes(tool)
            return (
              <div
                key={tool}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3",
                  checked && "border-emerald-500 bg-emerald-50",
                )}
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleVaultAccess(tool)}
                />
                <div>
                  <Label htmlFor={id} className="text-sm font-medium">
                    {tool}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {checked
                      ? "Access will be provisioned automatically."
                      : "Click to provision access."}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="rounded-xl border bg-white p-4 text-sm text-gray-600 shadow-sm">
        {recurrenceSummary}
      </div>
    </div>
  )
}

export default ProcessSettingsView

