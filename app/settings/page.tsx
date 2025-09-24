"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Globe,
  LifeBuoy,
  Lock,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type NotificationChannel = "slack" | "teams" | "email"

type TeamDirectoryEntry = {
  id: string
  name: string
  description: string
  members: number
  roles: string[]
  isActive: boolean
}

type ServiceDeskConfig = {
  id: string
  name: string
  description: string
  categories: string[]
  statuses: string[]
  enabled: boolean
}

type ProcessTemplate = {
  id: string
  name: string
  description: string
}

type IntegrationControl = {
  id: string
  name: string
  description: string
  status: "Connected" | "Requires review" | "Disconnected"
  allowConnections: boolean
}

const TEAM_OPTIONS = [
  { id: "process-ops", name: "Process Ops" },
  { id: "revenue-ops", name: "Revenue Ops" },
  { id: "it-security", name: "IT & Security" },
  { id: "people-ops", name: "People Ops" },
] satisfies { id: string; name: string }[]

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (US/Eastern)" },
  { value: "America/Chicago", label: "Central Time (US/Central)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US/Pacific)" },
  { value: "Europe/London", label: "Greenwich Mean Time (Europe/London)" },
] satisfies { value: string; label: string }[]

const TEAM_DIRECTORY_DATA: TeamDirectoryEntry[] = [
  {
    id: "process-ops",
    name: "Process Ops",
    description: "Runs global process governance and automation rollouts.",
    members: 18,
    roles: ["Process Owner", "Process Analyst", "Automation Lead"],
    isActive: true,
  },
  {
    id: "revenue-ops",
    name: "Revenue Ops",
    description: "Aligns GTM systems and coordinates revenue experiments.",
    members: 12,
    roles: ["Deal Desk", "Systems Specialist", "RevOps Analyst"],
    isActive: true,
  },
  {
    id: "it-security",
    name: "IT & Security",
    description: "Controls access, incident response, and compliance workflows.",
    members: 9,
    roles: ["Security Lead", "IAM Admin", "Incident Commander"],
    isActive: true,
  },
  {
    id: "people-ops",
    name: "People Ops",
    description: "Owns onboarding, offboarding, and employee lifecycle processes.",
    members: 14,
    roles: ["HRBP", "People Tech", "Experience Manager"],
    isActive: false,
  },
]

const SERVICE_DESK_DATA: ServiceDeskConfig[] = [
  {
    id: "operations",
    name: "Operations desk",
    description: "Handles process change requests and cross-functional escalations.",
    categories: ["Process launch", "Runbook update", "Control change"],
    statuses: ["New", "In triage", "In progress", "Waiting on requester", "Resolved"],
    enabled: true,
  },
  {
    id: "people",
    name: "People desk",
    description: "Supports hiring, onboarding, and employee lifecycle tickets.",
    categories: ["New hire", "Offboarding", "Policy question"],
    statuses: ["New", "Assigned", "Pending approval", "Closed"],
    enabled: true,
  },
  {
    id: "finance",
    name: "Finance desk",
    description: "Routes procurement, vendor, and spend management requests.",
    categories: ["Purchase", "Invoice", "Budget"],
    statuses: ["New", "Reviewing", "Needs info", "Approved"],
    enabled: false,
  },
]

const TAXONOMY_CATEGORIES = [
  "Onboarding",
  "Offboarding",
  "Security & compliance",
  "Quarterly business review",
  "Incident response",
  "Procurement",
] as const

const SOP_TEMPLATES: ProcessTemplate[] = [
  {
    id: "new-hire-onboarding",
    name: "New hire onboarding",
    description: "30-60-90 day onboarding playbook for new employees.",
  },
  {
    id: "quarterly-close",
    name: "Quarterly close",
    description: "Finance close checklist with approvals and documentation steps.",
  },
  {
    id: "incident-response",
    name: "Incident response",
    description: "Security incident coordination template with alerts and retros.",
  },
]

const OWNER_OPTIONS = [
  { value: "process-owner", label: "Process owner" },
  { value: "regional-lead", label: "Regional lead" },
  { value: "automation-bot", label: "Automation bot" },
]

const SCHEDULING_OPTIONS = [
  { value: "on-demand", label: "On demand" },
  { value: "weekly", label: "Weekly cadence" },
  { value: "monthly", label: "Monthly review" },
  { value: "quarterly", label: "Quarterly planning" },
]

const TIMEZONE_PRESETS = [
  { value: "America/New_York", label: "Americas (Eastern)" },
  { value: "Europe/London", label: "EMEA (London)" },
  { value: "Asia/Singapore", label: "APAC (Singapore)" },
]

const INTEGRATION_DATA: IntegrationControl[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Send run updates and task alerts to shared channels.",
    status: "Connected",
    allowConnections: true,
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description: "Mirror notifications for IT and security responders.",
    status: "Connected",
    allowConnections: true,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Create follow-up tickets for engineering and support teams.",
    status: "Connected",
    allowConnections: false,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync revenue operations tasks and opportunities.",
    status: "Requires review",
    allowConnections: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Embed SOPs and knowledge base pages alongside runs.",
    status: "Connected",
    allowConnections: true,
  },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Olivia Martin",
    email: "operations@processbuilder.com",
  })
  const [defaultTeamId, setDefaultTeamId] = useState<string>(TEAM_OPTIONS[0]?.id ?? "process-ops")
  const [notifications, setNotifications] = useState<Record<NotificationChannel, boolean>>({
    slack: true,
    teams: false,
    email: true,
  })
  const [timezone, setTimezone] = useState<string>(TIMEZONE_OPTIONS[0]?.value ?? "America/New_York")
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "17:00" })
  const [teamDirectory, setTeamDirectory] = useState<TeamDirectoryEntry[]>(TEAM_DIRECTORY_DATA)
  const [serviceDesks, setServiceDesks] = useState<ServiceDeskConfig[]>(SERVICE_DESK_DATA)
  const [activeCategories, setActiveCategories] = useState<string[]>([
    "Onboarding",
    "Security & compliance",
    "Incident response",
  ])
  const [defaultTemplates, setDefaultTemplates] = useState<string[]>([
    "new-hire-onboarding",
    "incident-response",
  ])
  const [defaultOwner, setDefaultOwner] = useState<string>(OWNER_OPTIONS[0]?.value ?? "process-owner")
  const [defaultSchedule, setDefaultSchedule] = useState<string>(SCHEDULING_OPTIONS[1]?.value ?? "weekly")
  const [catalogTimezone, setCatalogTimezone] = useState<string>(TIMEZONE_PRESETS[0]?.value ?? "America/New_York")
  const [integrations, setIntegrations] = useState<IntegrationControl[]>(INTEGRATION_DATA)

  const selectedTeam = useMemo(() => {
    return TEAM_OPTIONS.find((team) => team.id === defaultTeamId)?.name ?? TEAM_OPTIONS[0]?.name ?? ""
  }, [defaultTeamId])

  function handleNotificationToggle(channel: NotificationChannel, checked: boolean) {
    setNotifications((previous) => ({
      ...previous,
      [channel]: checked,
    }))
  }

  function updateTeamStatus(teamId: string, checked: boolean) {
    setTeamDirectory((previous) =>
      previous.map((team) =>
        team.id === teamId
          ? {
              ...team,
              isActive: checked,
            }
          : team,
      ),
    )
  }

  function updateServiceDeskStatus(serviceDeskId: string, checked: boolean) {
    setServiceDesks((previous) =>
      previous.map((desk) =>
        desk.id === serviceDeskId
          ? {
              ...desk,
              enabled: checked,
            }
          : desk,
      ),
    )
  }

  function toggleCategory(category: string, checked: boolean) {
    setActiveCategories((previous) => {
      if (checked) {
        if (previous.includes(category)) {
          return previous
        }
        return [...previous, category]
      }
      return previous.filter((item) => item !== category)
    })
  }

  function toggleTemplate(templateId: string, checked: boolean) {
    setDefaultTemplates((previous) => {
      if (checked) {
        if (previous.includes(templateId)) {
          return previous
        }
        return [...previous, templateId]
      }
      return previous.filter((item) => item !== templateId)
    })
  }

  function updateIntegrationAccess(integrationId: string, checked: boolean) {
    setIntegrations((previous) =>
      previous.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              allowConnections: checked,
            }
          : integration,
      ),
    )
  }

  return (
    <DashboardShell
      header={{
        title: "Settings",
        description: "Tune your personal preferences and configure the shared operations workspace.",
        icon: Settings,
      }}
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Account settings</h2>
            <p className="text-sm text-muted-foreground">
              Personalize how you appear in processes and choose the alerts that keep you in sync.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Profile basics</CardTitle>
                    <CardDescription>
                      Update the name and email that appear on assignments and approvals.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full name</Label>
                    <Input
                      id="profile-name"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Work email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((previous) => ({
                          ...previous,
                          email: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Display details refresh immediately in the sidebar and assignment menus you appear in.
                </p>
                <div className="flex justify-end">
                  <Button size="sm">Save profile</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Default workspace</CardTitle>
                    <CardDescription>
                      Choose the team context you land in so navigation stays focused on your priorities.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-team">Landing team</Label>
                  <Select value={defaultTeamId} onValueChange={setDefaultTeamId}>
                    <SelectTrigger id="default-team">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_OPTIONS.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  You will open directly to <span className="font-medium text-foreground">{selectedTeam}</span> workflows and
                  dashboards after signing in.
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline">
                    Update default
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Notification channels</CardTitle>
                    <CardDescription>
                      Decide where ProcessBuilder delivers task updates and output summaries.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {([
                    { id: "slack", label: "Slack", description: "Send direct alerts to #process-ops." },
                    { id: "teams", label: "Microsoft Teams", description: "Notify dedicated responders in Teams." },
                    { id: "email", label: "Email", description: "Receive daily digests and assignments." },
                  ] as {
                    id: NotificationChannel
                    label: string
                    description: string
                  }[]).map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{channel.label}</p>
                        <p className="text-xs text-muted-foreground">{channel.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`channel-${channel.id}`}
                          checked={notifications[channel.id]}
                          onCheckedChange={(checked) => handleNotificationToggle(channel.id, checked)}
                        />
                        <Label htmlFor={`channel-${channel.id}`} className="text-xs text-muted-foreground">
                          {notifications[channel.id] ? "On" : "Off"}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button size="sm">Save preferences</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Scheduling & timezone</CardTitle>
                    <CardDescription>
                      Align recurring processes and reminders to your local working hours.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="personal-timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="personal-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="working-hours-start">Workday start</Label>
                    <Input
                      id="working-hours-start"
                      type="time"
                      value={workingHours.start}
                      onChange={(event) =>
                        setWorkingHours((previous) => ({
                          ...previous,
                          start: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="working-hours-end">Workday end</Label>
                    <Input
                      id="working-hours-end"
                      type="time"
                      value={workingHours.end}
                      onChange={(event) =>
                        setWorkingHours((previous) => ({
                          ...previous,
                          end: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upcoming runs and scheduled completions will adjust automatically for {timezone}.
                </p>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline">
                    Update schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Organization settings</h2>
              <p className="text-sm text-muted-foreground">
                Govern shared taxonomies, service desks, and integrations for everyone in the workspace.
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin only
            </Badge>
          </div>

          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-4 sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Workspace configuration is restricted</p>
                <p className="text-sm text-muted-foreground">
                  Only administrators can update teams, service desks, and integrations. Changes apply immediately across all
                  processes and historical runs.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Team & role directory</CardTitle>
                    <CardDescription>
                      Control which teams appear in navigation and who can be assigned as owners.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamDirectory.map((team) => (
                  <div
                    key={team.id}
                    className="space-y-3 rounded-lg border px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <span>{team.name}</span>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            {team.members} members
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{team.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          id={`team-${team.id}`}
                          checked={team.isActive}
                          onCheckedChange={(checked) => updateTeamStatus(team.id, checked)}
                        />
                        <Label htmlFor={`team-${team.id}`} className="cursor-pointer">
                          {team.isActive ? "Active" : "Retired"}
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {team.roles.map((role) => (
                        <Badge key={role} variant="outline" className="border-dashed">
                          {role}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        Manage roles
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm">
                  Add team
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Service desk configuration</CardTitle>
                    <CardDescription>
                      Curate desks, intake categories, and status conventions for routing requests.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceDesks.map((desk) => (
                  <div key={desk.id} className="space-y-3 rounded-lg border px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{desk.name}</p>
                        <p className="text-xs text-muted-foreground">{desk.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          id={`desk-${desk.id}`}
                          checked={desk.enabled}
                          onCheckedChange={(checked) => updateServiceDeskStatus(desk.id, checked)}
                        />
                        <Label htmlFor={`desk-${desk.id}`} className="cursor-pointer">
                          {desk.enabled ? "Enabled" : "Disabled"}
                        </Label>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Request categories</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {desk.categories.map((category) => (
                            <Badge key={category} variant="outline">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Statuses</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {desk.statuses.map((status) => (
                            <Badge key={status} variant="secondary" className="bg-muted text-muted-foreground">
                              {status}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm">
                  Configure desks
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Process taxonomy & defaults</CardTitle>
                    <CardDescription>
                      Define catalog categories, templates, and owners applied to new processes.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catalog categories</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TAXONOMY_CATEGORIES.map((category) => {
                      const id = `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
                      const checked = activeCategories.includes(category)
                      return (
                        <label
                          key={category}
                          htmlFor={id}
                          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                            checked ? "border-primary bg-primary/5" : "border-dashed"
                          }`}
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(next) => toggleCategory(category, next === true)}
                          />
                          <span className="leading-5">{category}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default SOP templates</Label>
                  <div className="space-y-2">
                    {SOP_TEMPLATES.map((template) => {
                      const id = `template-${template.id}`
                      const checked = defaultTemplates.includes(template.id)
                      return (
                        <div
                          key={template.id}
                          className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                            checked ? "border-primary bg-primary/5" : "border-dashed"
                          }`}
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(next) => toggleTemplate(template.id, next === true)}
                          />
                          <div>
                            <label htmlFor={id} className="font-medium leading-5">
                              {template.name}
                            </label>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-owner">Default owner</Label>
                    <Select value={defaultOwner} onValueChange={setDefaultOwner}>
                      <SelectTrigger id="default-owner">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {OWNER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default-schedule">Scheduling default</Label>
                    <Select value={defaultSchedule} onValueChange={setDefaultSchedule}>
                      <SelectTrigger id="default-schedule">
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catalog-timezone">Timezone preset</Label>
                  <Select value={catalogTimezone} onValueChange={setCatalogTimezone}>
                    <SelectTrigger id="catalog-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_PRESETS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  New SOPs inherit the selected categories, owner role, <span className="font-medium text-foreground">{
                    OWNER_OPTIONS.find((option) => option.value === defaultOwner)?.label ?? ""
                  }</span>, and schedule cadence. Regional workspaces will use the <span className="font-medium text-foreground">{
                    TIMEZONE_PRESETS.find((option) => option.value === catalogTimezone)?.label ?? ""
                  }</span> preset.
                </div>
                <div className="flex justify-end">
                  <Button size="sm">Save taxonomy defaults</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Vault & integration access</CardTitle>
                    <CardDescription>
                      Restrict who can connect or revoke systems that power automations and documentation.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="space-y-3 rounded-lg border px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.description}</p>
                      </div>
                      <Badge
                        variant={integration.status === "Requires review" ? "outline" : "secondary"}
                        className={
                          integration.status === "Requires review"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {integration.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Allow new connections</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`integration-${integration.id}`}
                          checked={integration.allowConnections}
                          onCheckedChange={(checked) => updateIntegrationAccess(integration.id, checked)}
                        />
                        <Label htmlFor={`integration-${integration.id}`} className="cursor-pointer">
                          {integration.allowConnections ? "Allowed" : "Restricted"}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm">
                  Review access logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
