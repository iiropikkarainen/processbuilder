"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, ClipboardList, Ticket } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SAMPLE_SERVICE_DESK_REQUESTS,
  type ServiceDeskRequest,
  type ServiceDeskRequestStatus,
} from "@/lib/data/service-desk-requests"
import { getServiceDeskById } from "@/lib/data/service-desks"
import {
  loadStoredRequests,
  useStoredRequestsSubscription,
} from "@/lib/service-desk-storage"
import { cn } from "@/lib/utils"

const STATUS_BADGE_MAP: Record<ServiceDeskRequestStatus, string> = {
  New: "bg-blue-100 text-blue-700 border-transparent",
  "In Progress": "bg-amber-100 text-amber-700 border-transparent",
  "Waiting on Customer": "bg-purple-100 text-purple-700 border-transparent",
  Resolved: "bg-emerald-100 text-emerald-700 border-transparent",
  Closed: "bg-slate-200 text-slate-700 border-transparent",
}

const PRIORITY_BADGE_MAP: Record<ServiceDeskRequest["priority"], string> = {
  High: "bg-red-100 text-red-700 border-transparent",
  Medium: "bg-amber-100 text-amber-700 border-transparent",
  Low: "bg-slate-100 text-slate-700 border-transparent",
}

const SAMPLE_REQUEST_LOOKUP = SAMPLE_SERVICE_DESK_REQUESTS.flatMap((category) => category.requests)

export default function ServiceDeskRequestDetailPage() {
  const params = useParams<{ ticketId: string }>()
  const ticketId = params?.ticketId ?? ""

  const [storedRequests, setStoredRequests] = useState<ServiceDeskRequest[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setStoredRequests(loadStoredRequests())
    setIsHydrated(true)
  }, [])

  useStoredRequestsSubscription(setStoredRequests)

  const request = useMemo(() => {
    if (!ticketId) {
      return null
    }

    const sampleMatch = SAMPLE_REQUEST_LOOKUP.find((item) => item.id === ticketId)
    if (sampleMatch) {
      return sampleMatch
    }

    return storedRequests.find((item) => item.id === ticketId) ?? null
  }, [ticketId, storedRequests])

  const serviceDesk = request ? getServiceDeskById(request.deskId) : null

  if (!request) {
    return (
      <DashboardShell
        header={{
          title: "Service ticket",
          description: isHydrated
            ? "We couldn't find the request you were looking for."
            : "Loading ticket details...",
          icon: Ticket,
        }}
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/30 p-12 text-center">
          {isHydrated ? (
            <>
              <p className="text-lg font-semibold text-foreground">Ticket not found</p>
              <p className="max-w-md text-sm text-muted-foreground">
                The request may have been removed or is no longer available. Return to the queue to browse active tickets.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Preparing ticket details…</p>
          )}
          <Link
            href="/servicedesk/requests"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const submittedDate = format(new Date(request.submittedAt), "PPP p")
  const relativeSubmitted = formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })
  const slaDue = request.slaDueAt
    ? {
        absolute: format(new Date(request.slaDueAt), "PPP p"),
        relative: formatDistanceToNow(new Date(request.slaDueAt), { addSuffix: true }),
      }
    : null

  return (
    <DashboardShell
      header={{
        title: request.title,
        description: `Ticket ${request.id}`,
        icon: Ticket,
      }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("capitalize", STATUS_BADGE_MAP[request.status])}>
              {request.status}
            </Badge>
            <Badge variant="outline" className={cn("capitalize", PRIORITY_BADGE_MAP[request.priority])}>
              {request.priority} priority
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {serviceDesk?.name ?? "Service Desk"}
            </Badge>
          </div>
          <Link
            href={`/servicedesk/requests?desk=${request.deskId}`}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {serviceDesk?.name ?? "Requests"}
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Request summary
            </CardTitle>
            <CardDescription>
              Submitted by {request.requestedBy} on {submittedDate} ({relativeSubmitted}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-6 text-muted-foreground">
            <p className="whitespace-pre-line text-foreground">{request.summary}</p>
            <Separator />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket ID</p>
                <p className="mt-1 text-base font-medium text-foreground">{request.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service desk</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {serviceDesk?.name ?? request.deskId}
                </p>
                {serviceDesk ? (
                  <p className="mt-1 text-xs text-muted-foreground">{serviceDesk.purpose}</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned to</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {request.assignedTo ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-base font-medium text-foreground">{request.status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</p>
                <p className="mt-1 text-base font-medium text-foreground">{request.priority}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SLA due</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {slaDue ? `${slaDue.absolute} (${slaDue.relative})` : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
