"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { LifeBuoy, Plus, Settings } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { SERVICE_DESKS, type ServiceDesk } from "@/lib/data/service-desks"
import type { ServiceDeskRequest } from "@/lib/data/service-desk-requests"
import { addStoredRequest } from "@/lib/service-desk-storage"

interface ManagedServiceDesk extends ServiceDesk {
  ownerEmail: string
  owningTeam: string
  aiEnabled: boolean
}

function generateTicketId(deskId: string) {
  const timestamp = Date.now().toString(36).toUpperCase()
  return `REQ-${deskId.toUpperCase()}-${timestamp}`
}

function buildRequestTitle(details: string) {
  const trimmed = details.trim()
  if (!trimmed) {
    return "New service request"
  }

  const firstLine = trimmed.split(/\n|\./)[0] ?? trimmed
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

function createDeskIdentifier(name: string, existingIds: string[]) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  if (!base) {
    let fallbackIndex = 1
    let fallback = `desk-${Date.now().toString(36)}`
    while (existingIds.includes(fallback)) {
      fallback = `desk-${Date.now().toString(36)}-${fallbackIndex++}`
    }
    return fallback
  }

  if (!existingIds.includes(base)) {
    return base
  }

  let counter = 2
  let candidate = `${base}-${counter}`
  while (existingIds.includes(candidate)) {
    counter += 1
    candidate = `${base}-${counter}`
  }
  return candidate
}

export default function ServiceDeskPage() {
  const [serviceDesks, setServiceDesks] = useState<ManagedServiceDesk[]>(() =>
    SERVICE_DESKS.map((desk) => ({
      ...desk,
      ownerEmail: `${desk.id}@processops.io`,
      owningTeam: desk.name,
      aiEnabled: false,
    })),
  )
  const [selectedDeskId, setSelectedDeskId] = useState<string>(SERVICE_DESKS[0]?.id ?? "")
  const [requestDetails, setRequestDetails] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    deskId: "",
    ownerEmail: "",
    owningTeam: "",
    aiEnabled: false,
  })
  const [createForm, setCreateForm] = useState({
    name: "",
    purpose: "",
    samples: "",
  })

  useEffect(() => {
    if (!serviceDesks.find((desk) => desk.id === selectedDeskId)) {
      setSelectedDeskId(serviceDesks[0]?.id ?? "")
    }
  }, [selectedDeskId, serviceDesks])

  const selectedDesk = useMemo(() => {
    return serviceDesks.find((desk) => desk.id === selectedDeskId)
  }, [selectedDeskId, serviceDesks])

  const filteredDesks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) {
      return serviceDesks
    }

    return serviceDesks.filter((desk) => {
      return (
        desk.name.toLowerCase().includes(term) ||
        desk.purpose.toLowerCase().includes(term) ||
        desk.samples.some((sample) => sample.toLowerCase().includes(term)) ||
        desk.ownerEmail.toLowerCase().includes(term) ||
        desk.owningTeam.toLowerCase().includes(term)
      )
    })
  }, [searchTerm, serviceDesks])

  function handleCardSelect(id: string) {
    setSelectedDeskId(id)
    setStatusMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!requestDetails.trim()) {
      setStatusMessage("Please include a short summary of your request before submitting.")
      return
    }

    if (!selectedDesk) {
      setStatusMessage("Select a service desk before submitting your request.")
      return
    }

    const requestPayload: ServiceDeskRequest = {
      id: generateTicketId(selectedDesk.id),
      deskId: selectedDesk.id,
      title: buildRequestTitle(requestDetails),
      summary: requestDetails.trim(),
      requestedBy: "Olivia Martin",
      submittedAt: new Date().toISOString(),
      status: "New",
      priority: "Medium",
    }

    addStoredRequest(requestPayload)

    setStatusMessage(
      `Request ${requestPayload.id} drafted for the ${selectedDesk.name}. Track it from the Requests page.`,
    )
    setRequestDetails("")
  }

  function handleOpenSettings(desk: ManagedServiceDesk) {
    setSettingsForm({
      deskId: desk.id,
      ownerEmail: desk.ownerEmail,
      owningTeam: desk.owningTeam,
      aiEnabled: desk.aiEnabled,
    })
    setIsSettingsDialogOpen(true)
  }

  function handleSaveSettings() {
    setServiceDesks((previous) =>
      previous.map((desk) =>
        desk.id === settingsForm.deskId
          ? {
              ...desk,
              ownerEmail: settingsForm.ownerEmail,
              owningTeam: settingsForm.owningTeam,
              aiEnabled: settingsForm.aiEnabled,
            }
          : desk,
      ),
    )
    setIsSettingsDialogOpen(false)
    setSettingsForm({ deskId: "", ownerEmail: "", owningTeam: "", aiEnabled: false })
  }

  function handleDeleteDesk() {
    const deskId = settingsForm.deskId
    setServiceDesks((previous) => {
      const updated = previous.filter((desk) => desk.id !== deskId)
      setSelectedDeskId((current) => {
        if (current === deskId) {
          return updated[0]?.id ?? ""
        }
        return current
      })
      return updated
    })
    setIsSettingsDialogOpen(false)
    setSettingsForm({ deskId: "", ownerEmail: "", owningTeam: "", aiEnabled: false })
  }

  function handleCreateDesk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!createForm.name.trim()) {
      return
    }

    const newDeskId = createDeskIdentifier(createForm.name, serviceDesks.map((desk) => desk.id))

    const sampleEntries = createForm.samples
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)

    const newDesk: ManagedServiceDesk = {
      id: newDeskId,
      name: createForm.name.trim(),
      purpose: createForm.purpose.trim() || "Describe how this desk supports your teams.",
      samples: sampleEntries.length > 0 ? sampleEntries : ["Capture a common request."],
      ownerEmail: "",
      owningTeam: "",
      aiEnabled: false,
    }

    setServiceDesks((previous) => [...previous, newDesk])
    setSelectedDeskId(newDesk.id)
    setCreateForm({ name: "", purpose: "", samples: "" })
    setIsCreateDialogOpen(false)
  }

  return (
    <DashboardShell
      header={{
        title: "Service Desk",
        description: "Route operational work to the specialists who can help.",
        icon: LifeBuoy,
      }}
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: "Find a service desk...",
      }}
      action={{
        label: "New Service Desk",
        icon: Plus,
        onClick: () => setIsCreateDialogOpen(true),
      }}
      defaultSearchPlaceholder="Find a service desk..."
    >
      <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDesks.length > 0 ? (
            filteredDesks.map((desk) => {
              const isSelected = desk.id === selectedDeskId

              return (
                <Card
                  key={desk.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardSelect(desk.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleCardSelect(desk.id)
                    }
                  }}
                  className={cn(
                    "relative flex h-full flex-col gap-4 border-2 border-transparent transition",
                    "cursor-pointer bg-card/80 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected && "border-primary shadow-md",
                  )}
                >
                  <CardHeader className="space-y-3 pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold leading-tight text-foreground">
                          {desk.name}
                        </CardTitle>
                        <CardDescription className="pt-1 text-sm leading-5 text-muted-foreground">
                          {desk.purpose}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <Badge variant="secondary" className="shrink-0">
                            Selected
                          </Badge>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleOpenSettings(desk)
                          }}
                        >
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Manage service desk settings</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sample requests
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {desk.samples.map((sample) => (
                        <li key={sample} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>{sample}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {desk.ownerEmail ? (
                        <p>
                          <span className="font-medium text-foreground">Owner:</span> {desk.ownerEmail}
                        </p>
                      ) : null}
                      {desk.owningTeam ? (
                        <p>
                          <span className="font-medium text-foreground">Team:</span> {desk.owningTeam}
                        </p>
                      ) : null}
                      <p>
                        <span className="font-medium text-foreground">AI agent:</span> {desk.aiEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>No service desks match your search just yet.</p>
              <p className="mt-1">Create a new desk to get started.</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a service request</CardTitle>
              <CardDescription>
                Share the details of what you need and we'll notify the {selectedDesk?.name ?? "Service Desk"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="service-desk">Service desk</Label>
                  <Select
                    value={selectedDeskId}
                    onValueChange={(value) => handleCardSelect(value)}
                    disabled={serviceDesks.length === 0}
                  >
                    <SelectTrigger id="service-desk">
                      <SelectValue placeholder="Select a service desk" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceDesks.map((desk) => (
                        <SelectItem key={desk.id} value={desk.id}>
                          {desk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-request">Request details</Label>
                  <Textarea
                    id="service-request"
                    placeholder={`Describe what you need from the ${selectedDesk?.name ?? "team"}.`}
                    value={requestDetails}
                    onChange={(event) => {
                      setRequestDetails(event.target.value)
                      if (statusMessage) {
                        setStatusMessage(null)
                      }
                    }}
                    rows={6}
                    disabled={!selectedDesk}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!selectedDesk}>
                  Submit request
                </Button>
              </form>
            </CardContent>
          </Card>
          {statusMessage ? (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
        </div>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setCreateForm({ name: "", purpose: "", samples: "" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new service desk</DialogTitle>
            <DialogDescription>
              Outline the basics for the new desk and fine-tune its settings later from the gear icon.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateDesk}>
            <div className="space-y-2">
              <Label htmlFor="new-desk-name">Service desk name</Label>
              <Input
                id="new-desk-name"
                placeholder="People Operations Service Desk"
                value={createForm.name}
                onChange={(event) => setCreateForm((previous) => ({ ...previous, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desk-purpose">Purpose</Label>
              <Textarea
                id="new-desk-purpose"
                placeholder="Summarize what this desk helps teammates accomplish."
                value={createForm.purpose}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, purpose: event.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-desk-samples">Sample requests</Label>
              <Textarea
                id="new-desk-samples"
                placeholder={"Add one request idea per line to help teammates get started."}
                value={createForm.samples}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, samples: event.target.value }))
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create service desk</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSettingsDialogOpen}
        onOpenChange={(open) => {
          setIsSettingsDialogOpen(open)
          if (!open) {
            setSettingsForm({ deskId: "", ownerEmail: "", owningTeam: "", aiEnabled: false })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service desk settings</DialogTitle>
            <DialogDescription>
              Update the ownership details or toggle the AI agent that supports this desk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desk-owner-email">Owner email</Label>
              <Input
                id="desk-owner-email"
                type="email"
                placeholder="owner@company.com"
                value={settingsForm.ownerEmail}
                onChange={(event) =>
                  setSettingsForm((previous) => ({ ...previous, ownerEmail: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desk-owning-team">Owning team</Label>
              <Input
                id="desk-owning-team"
                placeholder="Revenue Operations"
                value={settingsForm.owningTeam}
                onChange={(event) =>
                  setSettingsForm((previous) => ({ ...previous, owningTeam: event.target.value }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="space-y-1">
                <Label htmlFor="desk-ai-toggle" className="text-sm font-medium">
                  AI agent automation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let an AI teammate triage requests and suggest next steps automatically.
                </p>
              </div>
              <Switch
                id="desk-ai-toggle"
                checked={settingsForm.aiEnabled}
                onCheckedChange={(checked) =>
                  setSettingsForm((previous) => ({ ...previous, aiEnabled: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDeleteDesk} disabled={!settingsForm.deskId}>
              Remove service desk
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveSettings} disabled={!settingsForm.deskId}>
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
