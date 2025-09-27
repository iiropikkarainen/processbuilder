import type { ServiceDeskRequest, ServiceDeskRequestStatus } from "@/lib/data/service-desk-requests"

const DB_STATUS_TO_UI: Record<string, ServiceDeskRequestStatus> = {
  open: "New",
  new: "New",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  waiting: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
}

const DB_PRIORITY_TO_UI: Record<string, ServiceDeskRequest["priority"]> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "High",
}

export type TicketRow = {
  id?: string
  code?: string | null
  title?: string | null
  description?: string | null
  status?: string | null
  priority?: string | null
  requested_by?: string | null
  submitted_at?: string | null
  created_at?: string | null
  service_desk_id?: string | null
  sla_due_at?: string | null
  linked_process_id?: string | null
  assignee_name?: string | null
  assigned_to?: string | null
}

export function mapTicketRowToRequest(row: TicketRow): ServiceDeskRequest | null {
  const deskId = (row.service_desk_id ?? undefined) as string | undefined
  const ticketId = row.code ?? row.id ?? undefined

  if (!deskId || !ticketId) {
    return null
  }

  const normalizedStatus = (row.status ?? "").toLowerCase()
  const normalizedPriority = (row.priority ?? "").toLowerCase()

  const status = DB_STATUS_TO_UI[normalizedStatus] ?? "New"
  const priority = DB_PRIORITY_TO_UI[normalizedPriority] ?? "Medium"

  const submittedAt = row.submitted_at ?? row.created_at ?? new Date().toISOString()

  const request: ServiceDeskRequest = {
    id: ticketId,
    deskId,
    title: row.title ?? ticketId,
    summary: row.description ?? "No summary provided.",
    requestedBy: row.requested_by ?? "Unspecified",
    submittedAt,
    status,
    priority,
  }

  if (row.assignee_name || row.assigned_to) {
    request.assignedTo = row.assignee_name ?? row.assigned_to ?? undefined
  }

  if (row.sla_due_at) {
    request.slaDueAt = row.sla_due_at
  }

  if (row.linked_process_id) {
    request.linkedProcessId = row.linked_process_id
  }

  return request
}

export function sortRequests(requests: ServiceDeskRequest[]) {
  return [...requests].sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })
}

