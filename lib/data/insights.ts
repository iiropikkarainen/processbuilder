export type InsightChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export type InsightChatThread = {
  id: string
  title: string
  summary: string
  createdAt: string
  updatedAt: string
  tags: string[]
  highlights: string[]
  metrics: {
    label: string
    value: string
    delta?: string
    trend?: "up" | "down"
  }[]
  followUps: string[]
  messages: InsightChatMessage[]
}

export const insightChatThreads: InsightChatThread[] = [
  {
    id: "service-desk-backlog",
    title: "Reduce escalation loops for access tickets",
    summary:
      "AI reviewed the service desk \"tickets\" table and flagged slow approvals for access provisioning requests.",
    createdAt: "2024-06-11T14:05:00.000Z",
    updatedAt: "2024-06-14T09:45:00.000Z",
    tags: ["Service desk", "Tickets", "Automation"],
    highlights: [
      "18.4 hour average resolution time for access tickets vs 12 hour SLA.",
      "Manual VP approval adds a median 6.7 hour delay with three handoffs.",
      "34% of escalations cite missing documentation in the request intake form.",
    ],
    metrics: [
      { label: "Tickets analyzed", value: "148", delta: "+12% MoM", trend: "up" },
      { label: "At-risk tickets", value: "17", delta: "-3 vs last week", trend: "down" },
      { label: "Escalation rate", value: "26%", delta: "+4 pts", trend: "up" },
    ],
    followUps: [
      "Draft a playbook to auto-notify approvers when SLA risk exceeds 8 hours.",
      "Design a required fields checklist in the request form to reduce missing details.",
      "Simulate impact of routing approvals to the automation queue after hours.",
    ],
    messages: [
      {
        id: "1",
        role: "user",
        content:
          "Analyze our Supabase tickets table and show me where service desk escalations are slowing us down.",
        timestamp: "2024-06-14T09:45:00.000Z",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "I reviewed 148 tickets from the last 30 days. Access provisioning requests are the biggest drag with an 18.4 hour average turnaround. Most delays occur while waiting on VP approval, which requires three handoffs and happens outside working hours 41% of the time.",
        timestamp: "2024-06-14T09:45:15.000Z",
      },
      {
        id: "3",
        role: "assistant",
        content:
          "Escalations spike when requesters omit system IDs. Adding conditional required fields and a self-service knowledge article would prevent roughly 34% of escalations.",
        timestamp: "2024-06-14T09:45:45.000Z",
      },
      {
        id: "4",
        role: "assistant",
        content:
          "Would you like me to draft an automation that reminds approvers after four hours or send this insight to the service desk queue?",
        timestamp: "2024-06-14T09:46:00.000Z",
      },
    ],
  },
  {
    id: "process-cycle-time",
    title: "Cycle time audit for onboarding processes",
    summary:
      "Combined analysis of \"processes\" and \"tickets\" Supabase tables shows onboarding waiting on finance reviews.",
    createdAt: "2024-06-09T16:20:00.000Z",
    updatedAt: "2024-06-13T11:10:00.000Z",
    tags: ["Processes", "Bottlenecks", "Finance"],
    highlights: [
      "Vendor onboarding workflow averages 5.2 days, exceeding target by 2.1 days.",
      "Finance review queue has the longest idle time at 29 hours median.",
      "47% of tasks require duplicate document uploads between teams.",
    ],
    metrics: [
      { label: "Processes analyzed", value: "42", delta: "Last 90 days" },
      { label: "Steps with delays", value: "7", delta: "+2 vs previous run", trend: "up" },
      { label: "Automation candidates", value: "5", delta: "High impact", trend: "up" },
    ],
    followUps: [
      "Propose an automated finance review queue with SLA alerts.",
      "Consolidate duplicate document requests into a single shared step.",
      "Share the cycle time heatmap with process owners.",
    ],
    messages: [
      {
        id: "1",
        role: "user",
        content:
          "Where are the slowest steps across our Supabase processes table? Highlight anything that impacts onboarding.",
        timestamp: "2024-06-13T11:10:00.000Z",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Onboarding workflows exceeded their SLA in 62% of runs. The finance review stage is the largest contributor with a 29 hour median wait, mostly when compliance exceptions are raised.",
        timestamp: "2024-06-13T11:10:20.000Z",
      },
      {
        id: "3",
        role: "assistant",
        content:
          "Automating document validation before handoff would eliminate about 5 duplicate uploads per run.",
        timestamp: "2024-06-13T11:10:40.000Z",
      },
    ],
  },
]
