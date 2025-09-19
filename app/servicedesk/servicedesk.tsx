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

const SERVICE_DESKS = [
  {
    id: "hr",
    name: "HR Service Desk",
    purpose: "Employee requests, onboarding, benefits, and compliance.",
    samples: [
      "Request employment verification letter.",
      "Submit new hire onboarding form.",
      "Update personal details (address, emergency contact).",
      "Apply for parental leave.",
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting Service Desk",
    purpose: "Payments, expenses, payroll, and reporting.",
    samples: [
      "Submit reimbursement for client dinner.",
      "Request approval for vendor payment.",
      "Generate quarterly expense report.",
      "Correct error in payroll.",
    ],
  },
  {
    id: "it",
    name: "IT Service Desk",
    purpose: "Tech support, access management, and security.",
    samples: [
      "Reset laptop password.",
      "Request access to Salesforce.",
      "Report phishing email.",
      "Install VPN on new device.",
    ],
  },
  {
    id: "legal",
    name: "Legal & Compliance Service Desk",
    purpose: "Contracts, risk, and compliance checks.",
    samples: [
      "Review and approve NDA with vendor.",
      "Request contract template for new client.",
      "Submit data privacy concern.",
      "Report incident for compliance review.",
    ],
  },
  {
    id: "sales",
    name: "Sales & Customer Success Service Desk",
    purpose: "Client operations, deal support, and renewals.",
    samples: [
      "Create proposal for ACME Corp.",
      "Request pricing approval for enterprise discount.",
      "Log client complaint about onboarding.",
      "Initiate renewal workflow for key account.",
    ],
  },
  {
    id: "operations",
    name: "Operations & Facilities Service Desk",
    purpose: "Office management, logistics, and supplies.",
    samples: [
      "Order new ergonomic chair.",
      "Schedule courier pickup for client shipment.",
      "Report Wi-Fi outage in office.",
      "Book meeting space for board meeting.",
    ],
  },
] as const

type ServiceDeskId = (typeof SERVICE_DESKS)[number]["id"]

type ServiceDesk = (typeof SERVICE_DESKS)[number]

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

    setStatusMessage(`Request drafted for the ${selectedDesk.name}. We'll route it to the right team.`)
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
