export interface OperationsProcessSummary {
  id: string
  title: string
  category: string
}

export const OPERATIONS_PROCESSES: OperationsProcessSummary[] = [
  {
    id: "sop-payroll",
    title: "Payroll & Benefits (Canada, Bi-weekly, Deel)",
    category: "Finance & Accounting",
  },
  {
    id: "sop-hr-onboarding",
    title: "New Hire Onboarding Checklist",
    category: "Human Resources",
  },
  {
    id: "sop-sales-pipeline",
    title: "Quarterly Pipeline Review",
    category: "Sales & Business Development",
  },
  {
    id: "sop-support-escalation",
    title: "Critical Incident Escalation",
    category: "Customer Support",
  },
  {
    id: "sop-it-provisioning",
    title: "Provisioning New Employee Accounts",
    category: "IT & Security",
  },
  {
    id: "sop-marketing-newsletter",
    title: "Weekly Newsletter Production",
    category: "Marketing & Communications",
  },
  {
    id: "sop-ops-inventory",
    title: "Monthly Inventory Reconciliation",
    category: "Operations & Logistics",
  },
  {
    id: "sop-product-release",
    title: "Product Release Go-Live Checklist",
    category: "Product & Engineering",
  },
  {
    id: "sop-legal-contract",
    title: "Standard Contract Review Workflow",
    category: "Legal & Compliance",
  },
]

export function getOperationsProcessById(id: string) {
  return OPERATIONS_PROCESSES.find((process) => process.id === id)
}
