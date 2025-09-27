export interface ServiceDesk {
  id: ServiceDeskId
  name: string
  purpose: string
  samples: string[]
}

export type ServiceDeskId = string

export const SERVICE_DESKS: ServiceDesk[] = [
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
]

export function getServiceDeskById(id: string) {
  return SERVICE_DESKS.find((desk) => desk.id === id)
}
