// @ts-nocheck
"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, ClipboardList, Ticket } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  SAMPLE_SERVICE_DESK_REQUESTS,
  type ServiceDeskRequest,
  type ServiceDeskRequestStatus,
} from "@/lib/data/service-desk-requests"
import { getServiceDeskById } from "@/lib/data/service-desks"
import {
  OPERATIONS_PROCESSES,
  getOperationsProcessById,
} from "@/lib/data/operations-catalog"
import {
  addStoredRequest,
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

const STATUS_OPTIONS: ServiceDeskRequestStatus[] = [
  "New",
  "In Progress",
  "Waiting on Customer",
  "Resolved",
  "Closed",
]

const PRIORITY_OPTIONS: ServiceDeskRequest["priority"][] = ["High", "Medium", "Low"]

const NO_LINKED_PROCESS_VALUE = "__no_linked_process__"

function formatDateTimeForInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const offsetMinutes = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offsetMinutes * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

export default function ServiceDeskRequestDetailPage() {
  const params = useParams<{ ticketId: string }>()
  const ticketId = params?.ticketId ?? ""

  const [storedRequests, setStoredRequests] = useState<ServiceDeskRequest[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [status, setStatus] = useState<ServiceDeskRequestStatus>("New")
  const [priority, setPriority] = useState<ServiceDeskRequest["priority"]>("Medium")
  const [assignedTo, setAssignedTo] = useState("")
  const [slaDueAt, setSlaDueAt] = useState("")
  const [linkedProcessId, setLinkedProcessId] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  const [comments, setComments] = useState<string>("")
  const [commentList, setCommentList] = useState<{ id: string; content: string; createdAt: string }[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    setStoredRequests(loadStoredRequests())
    setIsHydrated(true)
    // Fetch comments for this ticket
    if (ticketId) {
      supabase
        .from("service_desk_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("createdAt", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setCommentList(data)
          }
        })
    }
  }, [])
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!comments.trim() || !request) return
    const { data, error } = await supabase
      .from("service_desk_comments")
      .insert({ ticket_id: request.id, content: comments })
      .select()
    if (!error && data) {
      setCommentList((prev) => [...prev, data[0]])
      setComments("")
    }
  }

  useStoredRequestsSubscription(setStoredRequests)

  const request = useMemo(() => {
    if (!ticketId) {
      return null
    }

    const storedMatch = storedRequests.find((item) => item.id === ticketId)
    if (storedMatch) {
      return storedMatch
    }

    const sampleMatch = SAMPLE_REQUEST_LOOKUP.find((item) => item.id === ticketId)
    if (sampleMatch) {
      return sampleMatch
    }

    return null
  }, [ticketId, storedRequests])

  const serviceDesk = request ? getServiceDeskById(request.deskId) : null

  useEffect(() => {
    if (!request) {
      return
    }

    setStatus(request.status)
    setPriority(request.priority)
    setAssignedTo(request.assignedTo ?? "")
    setSlaDueAt(request.slaDueAt ? formatDateTimeForInput(request.slaDueAt) : "")
    setLinkedProcessId(request.linkedProcessId ?? "")
  }, [request])

  const normalizedAssignedTo = useMemo(() => assignedTo.trim(), [assignedTo])

  const sortedProcesses = useMemo(() => {
    return [...OPERATIONS_PROCESSES].sort((a, b) => {
      const categoryComparison = a.category.localeCompare(b.category)
      if (categoryComparison !== 0) {
        return categoryComparison
      }

      return a.title.localeCompare(b.title)
    })
  }, [])

  const selectedProcess = linkedProcessId ? getOperationsProcessById(linkedProcessId) : null

  const slaDueSummary = useMemo(() => {
    if (!slaDueAt) {
      return null
    }

    const parsed = new Date(slaDueAt)
    if (!isValidDate(parsed)) {
      return null
    }

    return {
      absolute: format(parsed, "PPP p"),
      relative: formatDistanceToNow(parsed, { addSuffix: true }),
    }
  }, [slaDueAt])

  const hasChanges = useMemo(() => {
    if (!request) {
      return false
    }

    const initialAssignedTo = request.assignedTo?.trim() ?? ""
    const initialSla = request.slaDueAt ? formatDateTimeForInput(request.slaDueAt) : ""
    const initialProcess = request.linkedProcessId ?? ""

    return (
      status !== request.status ||
      priority !== request.priority ||
      normalizedAssignedTo !== initialAssignedTo ||
      slaDueAt !== initialSla ||
      (linkedProcessId || "") !== initialProcess
    )
  }, [request, status, priority, normalizedAssignedTo, slaDueAt, linkedProcessId])

  const showUnsavedMessage = hasChanges && saveState !== "saved"

  useEffect(() => {
    if (!ticketId) {
      return
    }

    setSaveState("idle")
  }, [ticketId])

  useEffect(() => {
    if (saveState !== "saved") {
      return
    }

    const timeout = window.setTimeout(() => {
      setSaveState("idle")
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [saveState])

  const handleReset = () => {
    if (!request) {
      return
    }

    setStatus(request.status)
    setPriority(request.priority)
    setAssignedTo(request.assignedTo ?? "")
    setSlaDueAt(request.slaDueAt ? formatDateTimeForInput(request.slaDueAt) : "")
    setLinkedProcessId(request.linkedProcessId ?? "")
    setSaveState("idle")
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!request) {
      return
    }

    if (!hasChanges) {
      setSaveState("idle")
      return
    }

    setSaveState("saving")

    const nextSlaDate = slaDueAt ? new Date(slaDueAt) : null
    const nextSlaIso = nextSlaDate && isValidDate(nextSlaDate) ? nextSlaDate.toISOString() : undefined
    const trimmedAssignedTo = normalizedAssignedTo

    const updatedRequest: ServiceDeskRequest = {
      ...request,
      status,
      priority,
      assignedTo: trimmedAssignedTo ? trimmedAssignedTo : undefined,
      slaDueAt: nextSlaIso,
      linkedProcessId: linkedProcessId || undefined,
    }

    supabase
      .from("service_desk_requests")
      .upsert(updatedRequest)
      .then(({ error }) => {
        if (error) {
          console.error("Error saving request:", error)
          setSaveState("idle")
        } else {
          setSaveState("saved")
        }
      })
  }

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
          <Badge variant="outline" className={cn("capitalize", STATUS_BADGE_MAP[status])}>
            {status}
          </Badge>
          <Badge variant="outline" className={cn("capitalize", PRIORITY_BADGE_MAP[priority])}>
            {priority} priority
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
                  {normalizedAssignedTo || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-base font-medium text-foreground">{status}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</p>
                <p className="mt-1 text-base font-medium text-foreground">{priority}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SLA due</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {slaDueSummary ? `${slaDueSummary.absolute} (${slaDueSummary.relative})` : "Not set"}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked process</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {selectedProcess ? selectedProcess.title : "Not linked"}
                </p>
                {selectedProcess ? (
                  <p className="mt-1 text-xs text-muted-foreground">{selectedProcess.category}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ticket controls</CardTitle>
            <CardDescription>
              Update ownership, deadlines, and connect this ticket to an Operations Catalog process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as ServiceDeskRequestStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as ServiceDeskRequest["priority"])}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned to</Label>
                  <Input
                    id="assigned-to"
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    placeholder="Unassigned"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sla-due">SLA due</Label>
                  <Input
                    id="sla-due"
                    type="datetime-local"
                    value={slaDueAt}
                    onChange={(event) => setSlaDueAt(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {slaDueSummary
                      ? `Due ${slaDueSummary.absolute} (${slaDueSummary.relative})`
                      : "Set a target completion deadline."}
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="linked-process">Linked process</Label>
                  <Select
                    value={linkedProcessId || NO_LINKED_PROCESS_VALUE}
                    onValueChange={(value) =>
                      setLinkedProcessId(value === NO_LINKED_PROCESS_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger id="linked-process">
                      <SelectValue placeholder="Link to a process" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_LINKED_PROCESS_VALUE}>No linked process</SelectItem>
                      {sortedProcesses.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{process.title}</span>
                            <span className="text-xs text-muted-foreground">{process.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedProcess
                      ? `Connected to ${selectedProcess.title} (${selectedProcess.category}).`
                      : "Link this ticket to a documented process for quick reference."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-h-[1.25rem] text-sm text-muted-foreground">
                  {saveState === "saved"
                    ? "Changes saved to this ticket."
                    : showUnsavedMessage
                      ? "You have unsaved changes."
                      : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges || saveState === "saving"}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={!hasChanges || saveState === "saving"}>
                    {saveState === "saving" ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Comments Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comments</CardTitle>
            <CardDescription>Leave and view comments for this ticket.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddComment} className="space-y-2">
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Write a comment..."
              />
              <Button type="submit" disabled={!comments.trim()}>Add Comment</Button>
            </form>
            <div className="space-y-3">
              {commentList.map((c) => (
                <div key={c.id} className="rounded border p-2 text-sm">
                  <p className="text-foreground">{c.content}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                </div>
              ))}
              {commentList.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
