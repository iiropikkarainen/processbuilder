"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { FolderKanban, Ticket } from "lucide-react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SERVICE_DESKS,
  type ServiceDesk,
  type ServiceDeskId,
} from "@/lib/data/service-desks"
import {
  SAMPLE_SERVICE_DESK_REQUESTS,
  type ServiceDeskRequest,
  type ServiceDeskRequestCategory,
  type ServiceDeskRequestStatus,
} from "@/lib/data/service-desk-requests"
import {
  loadStoredRequests,
  useStoredRequestsSubscription,
} from "@/lib/service-desk-storage"
import { cn } from "@/lib/utils"
import {
  mapTicketRowToRequest,
  sortRequests,
  type TicketRow,
} from "@/lib/service-desk-ticket-mapper"
import type { Database } from "@/types/supabase"

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

type ServiceDeskRow = Database["public"]["Tables"]["service_desks"]["Row"]

function buildBaseCategories(serviceDesks: ServiceDesk[]) {
  return serviceDesks.map<ServiceDeskRequestCategory>((desk) => {
    const sampleCategory = SAMPLE_SERVICE_DESK_REQUESTS.find((category) => category.id === desk.id)

    return {
      id: desk.id,
      name: desk.name,
      description: sampleCategory?.description ?? desk.purpose,
      requests: sampleCategory ? sortRequests(sampleCategory.requests) : [],
    }
  })
}

export default function ServiceDeskRequestsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useSupabaseClient<Database>()
  const [activeDeskId, setActiveDeskId] = useState<ServiceDeskId>(SERVICE_DESKS[0].id)
  const [storedRequests, setStoredRequests] = useState<ServiceDeskRequest[]>([])
  const [serviceDesks, setServiceDesks] = useState<ServiceDeskRow[]>([])
  const [dbRequests, setDbRequests] = useState<ServiceDeskRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setStoredRequests(loadStoredRequests())
  }, [])

  useStoredRequestsSubscription(setStoredRequests)

  useEffect(() => {
    let isActive = true

    const loadData = async () => {
      setIsLoading(true)
      setLoadError(null)

      const [desksResult, ticketsResult] = await Promise.all([
        supabase
          .from("service_desks")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("tickets")
          .select(
            "id, code, title, description, status, priority, requested_by, submitted_at, created_at, service_desk_id, sla_due_at, linked_process_id"
          )
          .order("submitted_at", { ascending: false, nullsLast: false })
          .order("created_at", { ascending: false, nullsLast: false }),
      ])

      if (!isActive) {
        return
      }

      const { data: deskData, error: deskError } = desksResult
      const { data: ticketData, error: ticketError } = ticketsResult

      if (deskError || ticketError) {
        console.error("Failed to load service desk data", deskError ?? ticketError)
        setLoadError("Unable to load service desk data. Showing sample data.")
      }

      if (deskData && deskData.length) {
        setServiceDesks(deskData)
      } else {
        setServiceDesks([])
      }

      if (ticketData && ticketData.length) {
        const mapped = ticketData
          .map((row) => mapTicketRowToRequest(row as TicketRow))
          .filter((row): row is ServiceDeskRequest => Boolean(row))
        setDbRequests(mapped)
      } else {
        setDbRequests([])
      }

      setIsLoading(false)
    }

    void loadData()

    const ticketChannel = supabase
      .channel("requests-tickets-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => {
          setDbRequests((previous) => {
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as TicketRow | null)?.code ?? (payload.old as TicketRow | null)?.id
              if (!deletedId) {
                return previous
              }
              return previous.filter((item) => item.id !== deletedId)
            }

            const mapped = mapTicketRowToRequest(payload.new as TicketRow)
            if (!mapped) {
              return previous
            }

            const next = previous.some((item) => item.id === mapped.id)
              ? previous.map((item) => (item.id === mapped.id ? mapped : item))
              : [...previous, mapped]

            return sortRequests(next)
          })
        },
      )
      .subscribe()

    const deskChannel = supabase
      .channel("requests-service-desks-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_desks" },
        (payload) => {
          setServiceDesks((previous) => {
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as ServiceDeskRow | null)?.id
              if (!deletedId) {
                return previous
              }
              return previous.filter((desk) => desk.id !== deletedId)
            }

            const nextRow = (payload.new as ServiceDeskRow | null) ?? null
            if (!nextRow) {
              return previous
            }

            const exists = previous.some((desk) => desk.id === nextRow.id)
            if (exists) {
              return previous.map((desk) => (desk.id === nextRow.id ? nextRow : desk))
            }

            return [...previous, nextRow].sort((a, b) => a.name.localeCompare(b.name))
          })
        },
      )
      .subscribe()

    return () => {
      isActive = false
      void supabase.removeChannel(ticketChannel)
      void supabase.removeChannel(deskChannel)
    }
  }, [supabase])

  useEffect(() => {
    const deskParam = searchParams.get("desk")
    if (!deskParam) {
      return
    }

    if (!SERVICE_DESKS.some((desk) => desk.id === deskParam)) {
      return
    }

    if (deskParam !== activeDeskId) {
      setActiveDeskId(deskParam as ServiceDeskId)
    }
  }, [searchParams, activeDeskId])

  const categories = useMemo(() => {
    const supabaseCategories: ServiceDeskRequestCategory[] = serviceDesks.map((desk) => {
      const deskRequests = dbRequests.filter((request) => request.deskId === desk.id)
      return {
        id: desk.id as ServiceDeskId,
        name: desk.name,
        description:
          desk.purpose ??
          SAMPLE_SERVICE_DESK_REQUESTS.find((sample) => sample.id === desk.id)?.description ??
          "Service desk queue",
        requests: sortRequests(deskRequests),
      }
    })

    const base = supabaseCategories.length ? supabaseCategories : buildBaseCategories(SERVICE_DESKS)

    if (!storedRequests.length) {
      return base
    }

    const requestsByDesk = storedRequests.reduce<Record<ServiceDeskId, ServiceDeskRequest[]>>(
      (accumulator, request) => {
        const deskId = request.deskId
        if (!accumulator[deskId]) {
          accumulator[deskId] = []
        }

        accumulator[deskId].push(request)
        return accumulator
      },
      {} as Record<ServiceDeskId, ServiceDeskRequest[]>,
    )

    return base.map((category) => {
      const storedForDesk = requestsByDesk[category.id] ?? []
      if (!storedForDesk.length) {
        return category
      }

      const deduped = new Map<string, ServiceDeskRequest>()
      for (const request of category.requests) {
        deduped.set(request.id, request)
      }

      for (const request of storedForDesk) {
        deduped.set(request.id, request)
      }

      return {
        ...category,
        requests: sortRequests(Array.from(deduped.values())),
      }
    })
  }, [serviceDesks, dbRequests, storedRequests])

  useEffect(() => {
    if (!categories.length) {
      return
    }

    if (!categories.some((category) => category.id === activeDeskId)) {
      setActiveDeskId(categories[0].id)
    }
  }, [categories, activeDeskId])

  const activeCategory = categories.find((category) => category.id === activeDeskId) ?? categories[0]

  const handleTabChange = (value: string) => {
    const nextDeskId = value as ServiceDeskId
    setActiveDeskId(nextDeskId)

    const params = new URLSearchParams(searchParams.toString())
    params.set("desk", nextDeskId)
    const queryString = params.toString()
    router.replace(`/servicedesk/requests${queryString ? `?${queryString}` : ""}`, { scroll: false })
  }

  return (
    <DashboardShell
      header={{
        title: "Requests",
        description: "Monitor submitted service desk tickets and drill into their details.",
        icon: Ticket,
      }}
    >
      <div className="flex flex-col gap-6">
        {loadError ? (
          <Card className="border-amber-200 bg-amber-50 text-amber-900">
            <CardContent className="py-4 text-sm">
              {loadError}
            </CardContent>
          </Card>
        ) : null}
        {isLoading && !categories.length ? (
          <Card className="border-muted bg-muted/50">
            <CardContent className="py-4 text-sm text-muted-foreground">
              Loading service desk data...
            </CardContent>
          </Card>
        ) : null}
        <Tabs value={activeDeskId} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 sm:w-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="shrink-0">
                  {category.requests.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => {
            const statusCounts = category.requests.reduce<Record<ServiceDeskRequestStatus, number>>(
              (accumulator, request) => {
                accumulator[request.status] = (accumulator[request.status] ?? 0) + 1
                return accumulator
              },
              {} as Record<ServiceDeskRequestStatus, number>,
            )

            const openCount =
              (statusCounts["New"] ?? 0) +
              (statusCounts["In Progress"] ?? 0) +
              (statusCounts["Waiting on Customer"] ?? 0)
            const resolvedCount = statusCounts["Resolved"] ?? 0
            const waitingOnCustomer = statusCounts["Waiting on Customer"] ?? 0

            return (
              <TabsContent key={category.id} value={category.id} className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Open</p>
                        <p className="mt-2 text-2xl font-semibold">{openCount}</p>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Resolved</p>
                        <p className="mt-2 text-2xl font-semibold">{resolvedCount}</p>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Waiting on customer</p>
                        <p className="mt-2 text-2xl font-semibold">{waitingOnCustomer}</p>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="mt-2 text-2xl font-semibold">{category.requests.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Requests</CardTitle>
                      <CardDescription>
                        Ticketed submissions appear here once they are logged from the Service Desk.
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/servicedesk">Submit new request</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {category.requests.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead className="min-w-[220px]">Summary</TableHead>
                            <TableHead>Requester</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="w-[80px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.requests.map((request) => (
                            <TableRow key={request.id} className="transition hover:bg-muted/40">
                              <TableCell className="font-medium text-foreground">{request.id}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{request.title}</p>
                                  <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {request.summary}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{request.requestedBy}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", STATUS_BADGE_MAP[request.status])}>
                                  {request.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", PRIORITY_BADGE_MAP[request.priority])}>
                                  {request.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(request.submittedAt), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild size="sm" variant="ghost">
                                  <Link href={`/servicedesk/requests/${request.id}`}>View</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted-foreground">
                        <p>No requests yet for this service desk.</p>
                        <p>Submit a request to start tracking tickets in this queue.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
        {activeCategory ? null : (
          <p className="text-sm text-muted-foreground">
            Select a service desk to see its ticket queue.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
