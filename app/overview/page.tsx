"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  Bot,
  CheckCircle2,
  Headset,
  LayoutDashboard,
  LucideIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const performanceMetrics = [
  {
    id: "running",
    label: "Processes running",
    value: 68,
    change: 12.4,
    trend: "up" as const,
    description: "Active workflows across operations and finance squads.",
    icon: Activity,
  },
  {
    id: "completed",
    label: "Processes completed",
    value: 128,
    change: 8.1,
    trend: "up" as const,
    description: "Lifecycle completions that met or beat SLA targets.",
    icon: CheckCircle2,
  },
  {
    id: "serviceDesk",
    label: "Service desk requests",
    value: 34,
    change: 4.7,
    trend: "down" as const,
    description: "Escalations routed through operations service desk.",
    icon: Headset,
  },
  {
    id: "automations",
    label: "Automations deployed",
    value: 19,
    change: 5.6,
    trend: "up" as const,
    description: "New automation playbooks shipped this quarter.",
    icon: Bot,
  },
] satisfies {
  id: "running" | "completed" | "serviceDesk" | "automations"
  label: string
  value: number
  change: number
  trend: "up" | "down"
  description: string
  icon: LucideIcon
}[]

type Metric = (typeof performanceMetrics)[number]
type MetricId = Metric["id"]

const metricsById = performanceMetrics.reduce<Record<MetricId, Metric>>(
  (accumulator, metric) => {
    accumulator[metric.id] = metric
    return accumulator
  },
  {} as Record<MetricId, Metric>,
)

const metricChartConfig = {
  running: {
    label: "Processes running",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Processes completed",
    color: "hsl(var(--chart-2))",
  },
  serviceDesk: {
    label: "Service desk requests",
    color: "hsl(var(--chart-3))",
  },
  automations: {
    label: "Automations deployed",
    color: "hsl(var(--chart-5))",
  },
} as const satisfies Record<
  (typeof performanceMetrics)[number]["id"],
  { label: string; color: string }
>

const chartData = [
  { month: "Nov", running: 42, completed: 28, serviceDesk: 22, automations: 6 },
  { month: "Dec", running: 48, completed: 34, serviceDesk: 26, automations: 7 },
  { month: "Jan", running: 53, completed: 36, serviceDesk: 30, automations: 9 },
  { month: "Feb", running: 57, completed: 41, serviceDesk: 33, automations: 11 },
  { month: "Mar", running: 61, completed: 46, serviceDesk: 37, automations: 12 },
  { month: "Apr", running: 63, completed: 52, serviceDesk: 35, automations: 13 },
  { month: "May", running: 66, completed: 55, serviceDesk: 32, automations: 14 },
  { month: "Jun", running: 67, completed: 59, serviceDesk: 29, automations: 15 },
  { month: "Jul", running: 69, completed: 62, serviceDesk: 27, automations: 16 },
  { month: "Aug", running: 71, completed: 64, serviceDesk: 25, automations: 17 },
  { month: "Sep", running: 72, completed: 66, serviceDesk: 23, automations: 18 },
  { month: "Oct", running: 74, completed: 68, serviceDesk: 21, automations: 19 },
] satisfies {
  month: string
  running: number
  completed: number
  serviceDesk: number
  automations: number
}[]

const timeRanges = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
] as const

type TimeRangeValue = (typeof timeRanges)[number]["value"]

const timeRangeMonths: Record<TimeRangeValue, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
}

const timeRangeDescriptions: Record<TimeRangeValue, string> = {
  "3m": "last 3 months",
  "6m": "last 6 months",
  "12m": "last 12 months",
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "at-risk", label: "At risk" },
  { value: "blocked", label: "Blocked" },
] as const

type ProcessStatusFilter = (typeof statusFilters)[number]["value"]

type ProcessRecord = {
  id: string
  name: string
  team: string
  owner: {
    name: string
    initials: string
  }
  status: "running" | "completed" | "at-risk" | "blocked"
  stage: string
  target: string
  requests: number
  automations: number
  progress: number
  updated: string
}

const processData: ProcessRecord[] = [
  {
    id: "PB-2406",
    name: "Enterprise onboarding flow",
    team: "Process Ops",
    owner: { name: "Olivia Martin", initials: "OM" },
    status: "running",
    stage: "Contract review",
    target: "14 days",
    requests: 6,
    automations: 5,
    progress: 72,
    updated: "2h ago",
  },
  {
    id: "PB-2389",
    name: "Invoice exception handling",
    team: "Finance Ops",
    owner: { name: "Noah Wilson", initials: "NW" },
    status: "at-risk",
    stage: "Variance approval",
    target: "3 days",
    requests: 9,
    automations: 3,
    progress: 44,
    updated: "4h ago",
  },
  {
    id: "PB-2374",
    name: "Customer renewal playbook",
    team: "Revenue Ops",
    owner: { name: "Ava Patel", initials: "AP" },
    status: "running",
    stage: "Health check",
    target: "21 days",
    requests: 2,
    automations: 4,
    progress: 63,
    updated: "Yesterday",
  },
  {
    id: "PB-2361",
    name: "Security incident response",
    team: "IT & Security",
    owner: { name: "Mason Clark", initials: "MC" },
    status: "blocked",
    stage: "Forensics",
    target: "6 hours",
    requests: 11,
    automations: 2,
    progress: 28,
    updated: "1h ago",
  },
  {
    id: "PB-2350",
    name: "Employee offboarding",
    team: "People Ops",
    owner: { name: "Sophia Chen", initials: "SC" },
    status: "completed",
    stage: "Archive handoff",
    target: "5 days",
    requests: 1,
    automations: 6,
    progress: 100,
    updated: "Today",
  },
  {
    id: "PB-2314",
    name: "Supplier risk assessments",
    team: "Procurement",
    owner: { name: "Liam Parker", initials: "LP" },
    status: "running",
    stage: "Policy alignment",
    target: "10 days",
    requests: 4,
    automations: 3,
    progress: 58,
    updated: "3h ago",
  },
]

const statusBadges: Record<ProcessRecord["status"], string> = {
  running: "border-emerald-200 bg-emerald-100 text-emerald-700",
  completed: "border-sky-200 bg-sky-100 text-sky-700",
  "at-risk": "border-amber-200 bg-amber-100 text-amber-700",
  blocked: "border-rose-200 bg-rose-100 text-rose-700",
}

const statusLabels: Record<ProcessRecord["status"], string> = {
  running: "Running",
  completed: "Completed",
  "at-risk": "At risk",
  blocked: "Blocked",
}

const numberFormatter = new Intl.NumberFormat("en-US")

export default function OverviewPage() {
  const [activeMetric, setActiveMetric] = useState<(typeof performanceMetrics)[number]["id"]>(
    performanceMetrics[0].id,
  )
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("6m")
  const [statusFilter, setStatusFilter] = useState<ProcessStatusFilter>("all")

  const selectedMetric = metricsById[activeMetric]

  const filteredChartData = useMemo(() => {
    const monthsToShow = timeRangeMonths[timeRange]
    return chartData.slice(-monthsToShow)
  }, [timeRange])

  const filteredProcesses = useMemo(() => {
    if (statusFilter === "all") {
      return processData
    }

    return processData.filter((process) => process.status === statusFilter)
  }, [statusFilter])

  const changeColor = selectedMetric.trend === "up" ? "text-emerald-600" : "text-rose-600"
  const ChangeIcon = selectedMetric.trend === "up" ? TrendingUp : TrendingDown
  const changeValue = Math.abs(selectedMetric.change).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })

  return (
    <DashboardShell
      header={{
        title: "Overview",
        description:
          "Monitor operational performance, request load, and automation impact across teams.",
        icon: LayoutDashboard,
      }}
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon
            const active = activeMetric === metric.id

            return (
              <Card
                key={metric.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => setActiveMetric(metric.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setActiveMetric(metric.id)
                  }
                }}
                className={cn(
                  "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "cursor-pointer border-muted-foreground/20",
                  active
                    ? "border-primary/80 shadow-md"
                    : "hover:border-primary/40 hover:shadow-sm",
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.label}
                  </CardTitle>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-primary",
                      active ? "bg-primary/15" : "bg-primary/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {numberFormatter.format(metric.value)}
                  </div>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs font-medium",
                      metric.trend === "up" ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {metric.trend === "up" ? "▲" : "▼"}
                    <span>
                      {Math.abs(metric.change).toLocaleString("en-US", {
                        maximumFractionDigits: 1,
                      })}
                      % vs last month
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <Card>
          <CardHeader className="gap-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-semibold">
                {selectedMetric.label}
              </CardTitle>
              <CardDescription>
                Performance for the {timeRangeDescriptions[timeRange]}.
              </CardDescription>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-3xl font-semibold">
                  {numberFormatter.format(selectedMetric.value)}
                </span>
                <span className={cn("flex items-center gap-1 text-xs font-semibold", changeColor)}>
                  <ChangeIcon className="h-4 w-4" />
                  {changeValue}% vs last month
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  type="button"
                  size="sm"
                  variant={timeRange === range.value ? "secondary" : "ghost"}
                  className={cn(
                    "rounded-full border border-transparent",
                    timeRange === range.value && "border-muted-foreground/30",
                  )}
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pb-6 pt-4 sm:px-6">
              <ChartContainer
                config={{
                  [activeMetric]: metricChartConfig[activeMetric],
                }}
                className="aspect-auto h-[280px] w-full"
              >
                <AreaChart data={filteredChartData}>
                  <defs>
                    <linearGradient id={`fill-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${activeMetric})`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${activeMetric})`}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    width={40}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={`var(--color-${activeMetric})`}
                    fill={`url(#fill-${activeMetric})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Processes in motion</CardTitle>
              <CardDescription>
                Real-time database of orchestration pipelines with ownership and SLA tracking.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={statusFilter === filter.value ? "secondary" : "ghost"}
                  className="rounded-full"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProcesses.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Process</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Target SLA</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Automations</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">
                            {process.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {process.id} · {process.team}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("font-medium", statusBadges[process.status])}
                        >
                          {statusLabels[process.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {process.stage}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-medium">
                              {process.owner.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {process.owner.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {process.team}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {process.target}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {process.requests}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {process.automations}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Progress value={process.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {process.progress}% complete
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {process.updated}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-40 items-center justify-center px-6 text-sm text-muted-foreground">
                No processes match the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
