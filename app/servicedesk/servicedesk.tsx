"use client"

import { useMemo, useState, type FormEvent } from "react"
import { LifeBuoy } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  SERVICE_DESKS,
  type ServiceDesk,
  type ServiceDeskId,
} from "@/lib/data/service-desks"
import type { ServiceDeskRequest } from "@/lib/data/service-desk-requests"
import { addStoredRequest } from "@/lib/service-desk-storage"

function generateTicketId(deskId: ServiceDeskId) {
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

export default function ServiceDeskPage() {
  const [selectedDeskId, setSelectedDeskId] = useState<ServiceDeskId>(SERVICE_DESKS[0].id)
  const [requestDetails, setRequestDetails] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const selectedDesk = useMemo<ServiceDesk>(() => {
    return SERVICE_DESKS.find((desk) => desk.id === selectedDeskId) ?? SERVICE_DESKS[0]
  }, [selectedDeskId])

  function handleCardSelect(id: ServiceDeskId) {
    setSelectedDeskId(id)
    setStatusMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!requestDetails.trim()) {
      setStatusMessage("Please include a short summary of your request before submitting.")
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

  return (
    <DashboardShell
      header={{
        title: "Service Desk",
        description: "Route operational work to the specialists who can help.",
        icon: LifeBuoy,
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[1.7fr,1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICE_DESKS.map((desk) => {
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
                    {isSelected ? (
                      <Badge variant="secondary" className="shrink-0">
                        Selected
                      </Badge>
                    ) : null}
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
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a service request</CardTitle>
              <CardDescription>
                Share the details of what you need and we'll notify the {selectedDesk.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="service-desk">Service desk</Label>
                  <Select
                    value={selectedDeskId}
                    onValueChange={(value) => handleCardSelect(value as ServiceDeskId)}
                  >
                    <SelectTrigger id="service-desk">
                      <SelectValue placeholder="Select a service desk" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_DESKS.map((desk) => (
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
                    placeholder={`Describe what you need from the ${selectedDesk.name}.`}
                    value={requestDetails}
                    onChange={(event) => {
                      setRequestDetails(event.target.value)
                      if (statusMessage) {
                        setStatusMessage(null)
                      }
                    }}
                    rows={6}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit request
                </Button>
                {statusMessage ? (
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                ) : null}
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What this team handles</CardTitle>
              <CardDescription>
                A quick reminder of when to reach out to the {selectedDesk.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Purpose</p>
                <p className="pt-1 leading-6">{selectedDesk.purpose}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Popular requests</p>
                <ul className="mt-2 space-y-2">
                  {selectedDesk.samples.map((sample) => (
                    <li key={sample} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{sample}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
