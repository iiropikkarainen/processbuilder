import type { ServiceDeskId } from "./service-desks"

export type ServiceDeskRequestStatus =
  | "New"
  | "In Progress"
  | "Waiting on Customer"
  | "Resolved"
  | "Closed"

export type ServiceDeskRequestPriority = "Low" | "Medium" | "High"

export interface ServiceDeskRequest {
  id: string
  deskId: ServiceDeskId
  title: string
  summary: string
  requestedBy: string
  submittedAt: string
  status: ServiceDeskRequestStatus
  priority: ServiceDeskRequestPriority
  assignedTo?: string
  slaDueAt?: string
}

export interface ServiceDeskRequestCategory {
  id: ServiceDeskId
  name: string
  description: string
  requests: ServiceDeskRequest[]
}

export const SAMPLE_SERVICE_DESK_REQUESTS: ServiceDeskRequestCategory[] = [
  {
    id: "hr",
    name: "HR Service Desk",
    description: "Requests related to onboarding, employee changes, and benefits.",
    requests: [
      {
        id: "REQ-HR-2391",
        deskId: "hr",
        title: "Update home address",
        summary: "Employee requested to update their home address and emergency contact details in the HRIS system.",
        requestedBy: "Priya Patel",
        submittedAt: "2024-11-18T15:24:00.000Z",
        status: "Waiting on Customer",
        priority: "Medium",
        assignedTo: "Kelly Shaw",
        slaDueAt: "2024-11-25T15:24:00.000Z",
      },
      {
        id: "REQ-HR-2386",
        deskId: "hr",
        title: "Onboarding for new SDR",
        summary: "Initiate onboarding checklist for new sales development representative starting next Monday.",
        requestedBy: "Marcus Holloway",
        submittedAt: "2024-11-12T09:12:00.000Z",
        status: "In Progress",
        priority: "High",
        assignedTo: "Taylor Brooks",
        slaDueAt: "2024-11-19T09:12:00.000Z",
      },
      {
        id: "REQ-HR-2379",
        deskId: "hr",
        title: "Benefits enrollment question",
        summary: "Clarify eligibility window for dependent coverage changes ahead of open enrollment.",
        requestedBy: "Yara Gomez",
        submittedAt: "2024-11-05T18:02:00.000Z",
        status: "Resolved",
        priority: "Low",
        assignedTo: "Kelly Shaw",
        slaDueAt: "2024-11-08T18:02:00.000Z",
      },
    ],
  },
  {
    id: "finance",
    name: "Finance & Accounting Service Desk",
    description: "Expenses, invoicing, vendor payments, and payroll issues.",
    requests: [
      {
        id: "REQ-FIN-3110",
        deskId: "finance",
        title: "Quarterly software renewals budget",
        summary: "Review and approve the budget variance for Q4 software renewals and advise on cost-saving options.",
        requestedBy: "Jamie Chen",
        submittedAt: "2024-11-21T12:30:00.000Z",
        status: "New",
        priority: "High",
        assignedTo: "Sasha Fields",
        slaDueAt: "2024-11-28T12:30:00.000Z",
      },
      {
        id: "REQ-FIN-3098",
        deskId: "finance",
        title: "Reimbursement for client dinner",
        summary: "Upload itemized receipt for dinner with ACME stakeholders and confirm cost center coding.",
        requestedBy: "Logan Irwin",
        submittedAt: "2024-11-17T20:45:00.000Z",
        status: "In Progress",
        priority: "Medium",
        assignedTo: "Victor Ramos",
        slaDueAt: "2024-11-24T20:45:00.000Z",
      },
      {
        id: "REQ-FIN-3079",
        deskId: "finance",
        title: "Vendor payment status",
        summary: "Follow up on payment status for DesignCo invoice #8741 due at the end of the month.",
        requestedBy: "Sienna Blake",
        submittedAt: "2024-11-04T11:18:00.000Z",
        status: "Resolved",
        priority: "Low",
        assignedTo: "Maya Desai",
        slaDueAt: "2024-11-07T11:18:00.000Z",
      },
    ],
  },
  {
    id: "it",
    name: "IT Service Desk",
    description: "Access management, hardware provisioning, and incident response.",
    requests: [
      {
        id: "REQ-IT-4521",
        deskId: "it",
        title: "MFA reset for contractor",
        summary: "Contractor lost authenticator device and needs multi-factor authentication reset before Monday onboarding.",
        requestedBy: "Connor Davis",
        submittedAt: "2024-11-22T07:55:00.000Z",
        status: "New",
        priority: "High",
        assignedTo: "Jordan Bates",
        slaDueAt: "2024-11-23T07:55:00.000Z",
      },
      {
        id: "REQ-IT-4516",
        deskId: "it",
        title: "Salesforce access for new AE",
        summary: "Provision Salesforce license and role permissions for newly promoted account executive.",
        requestedBy: "Mira Solis",
        submittedAt: "2024-11-19T16:05:00.000Z",
        status: "In Progress",
        priority: "Medium",
        assignedTo: "Dylan Price",
        slaDueAt: "2024-11-21T16:05:00.000Z",
      },
      {
        id: "REQ-IT-4499",
        deskId: "it",
        title: "Laptop replacement",
        summary: "Laptop battery swelling observed; request urgent replacement and secure disposal of old hardware.",
        requestedBy: "Amelia Stone",
        submittedAt: "2024-11-10T10:40:00.000Z",
        status: "Resolved",
        priority: "High",
        assignedTo: "Jordan Bates",
        slaDueAt: "2024-11-11T10:40:00.000Z",
      },
    ],
  },
  {
    id: "legal",
    name: "Legal & Compliance Service Desk",
    description: "Contract reviews, compliance checks, and incident reporting.",
    requests: [
      {
        id: "REQ-LEG-1270",
        deskId: "legal",
        title: "Partner NDA review",
        summary: "Need legal review of NDA updates requested by strategic partner. Highlight changes in clause 4 and 6.",
        requestedBy: "Alex Morgan",
        submittedAt: "2024-11-20T14:22:00.000Z",
        status: "In Progress",
        priority: "Medium",
        assignedTo: "Harper Quinn",
        slaDueAt: "2024-11-27T14:22:00.000Z",
      },
      {
        id: "REQ-LEG-1264",
        deskId: "legal",
        title: "Privacy incident follow-up",
        summary: "Provide compliance guidance on reported privacy incident from EU customer account.",
        requestedBy: "Diego Martinez",
        submittedAt: "2024-11-15T09:37:00.000Z",
        status: "Waiting on Customer",
        priority: "High",
        assignedTo: "Rowan Leigh",
        slaDueAt: "2024-11-22T09:37:00.000Z",
      },
      {
        id: "REQ-LEG-1250",
        deskId: "legal",
        title: "Vendor contract template",
        summary: "Request most recent approved vendor agreement template for new facilities supplier onboarding.",
        requestedBy: "Zuri Okafor",
        submittedAt: "2024-11-02T13:11:00.000Z",
        status: "Resolved",
        priority: "Low",
        assignedTo: "Harper Quinn",
        slaDueAt: "2024-11-06T13:11:00.000Z",
      },
    ],
  },
  {
    id: "sales",
    name: "Sales & Customer Success Service Desk",
    description: "Deal support, customer escalations, and renewals.",
    requests: [
      {
        id: "REQ-SALES-3820",
        deskId: "sales",
        title: "Enterprise pricing exception",
        summary: "Need approval for 18% discount on ACME Corp renewal to secure two-year contract extension.",
        requestedBy: "Noah Walters",
        submittedAt: "2024-11-23T18:02:00.000Z",
        status: "New",
        priority: "High",
        assignedTo: "Morgan Lee",
        slaDueAt: "2024-11-26T18:02:00.000Z",
      },
      {
        id: "REQ-SALES-3814",
        deskId: "sales",
        title: "Customer onboarding escalation",
        summary: "Escalation from CSM regarding delayed onboarding milestones for Beacon Analytics pilot.",
        requestedBy: "Ivy Rhodes",
        submittedAt: "2024-11-18T08:50:00.000Z",
        status: "In Progress",
        priority: "Medium",
        assignedTo: "Morgan Lee",
        slaDueAt: "2024-11-25T08:50:00.000Z",
      },
      {
        id: "REQ-SALES-3799",
        deskId: "sales",
        title: "Renewal playbook request",
        summary: "Share the renewal battlecard and playbook for manufacturing accounts ahead of Q1 planning.",
        requestedBy: "Aiden Brooks",
        submittedAt: "2024-11-06T17:25:00.000Z",
        status: "Resolved",
        priority: "Low",
        assignedTo: "Jordan Avery",
        slaDueAt: "2024-11-09T17:25:00.000Z",
      },
    ],
  },
  {
    id: "operations",
    name: "Operations & Facilities Service Desk",
    description: "Office logistics, supplies, and facilities support.",
    requests: [
      {
        id: "REQ-OPS-2045",
        deskId: "operations",
        title: "Board meeting room setup",
        summary: "Coordinate A/V setup, catering, and visitor badges for upcoming board meeting.",
        requestedBy: "Quinn Harper",
        submittedAt: "2024-11-21T10:15:00.000Z",
        status: "In Progress",
        priority: "High",
        assignedTo: "Isaiah Cole",
        slaDueAt: "2024-11-27T10:15:00.000Z",
      },
      {
        id: "REQ-OPS-2036",
        deskId: "operations",
        title: "Wi-Fi reliability issues",
        summary: "Investigate intermittent Wi-Fi drops on the 8th floor and coordinate with ISP for fix.",
        requestedBy: "Lena Ortiz",
        submittedAt: "2024-11-16T12:05:00.000Z",
        status: "Waiting on Customer",
        priority: "Medium",
        assignedTo: "Isaiah Cole",
        slaDueAt: "2024-11-22T12:05:00.000Z",
      },
      {
        id: "REQ-OPS-2011",
        deskId: "operations",
        title: "Ergonomic chair replacement",
        summary: "Request replacement of worn-out ergonomic chair for design team pod B.",
        requestedBy: "Riley Bennett",
        submittedAt: "2024-11-03T09:48:00.000Z",
        status: "Resolved",
        priority: "Low",
        assignedTo: "Amari Shaw",
        slaDueAt: "2024-11-06T09:48:00.000Z",
      },
    ],
  },
]
