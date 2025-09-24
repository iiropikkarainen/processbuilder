"use client"

import { useMemo, useState } from "react"
import { Bell, Building2, Globe, User } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

type NotificationChannelOption = {
  id: NotificationChannel
  label: string
  description: string
}

type TeamOption = {
  id: string
  name: string
}

type TimezoneOption = {
  value: string
  label: string
}

const TEAM_OPTIONS: TeamOption[] = [
  { id: "process-ops", name: "Process Ops" },
  { id: "revenue-ops", name: "Revenue Ops" },
  { id: "it-security", name: "IT & Security" },
  { id: "people-ops", name: "People Ops" },
]

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "America/New_York", label: "Eastern Time (US/Eastern)" },
  { value: "America/Chicago", label: "Central Time (US/Central)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US/Pacific)" },
  { value: "Europe/London", label: "Greenwich Mean Time (Europe/London)" },
]

const NOTIFICATION_CHANNELS: NotificationChannelOption[] = [
  { id: "slack", label: "Slack", description: "Send direct alerts to #process-ops." },
  { id: "teams", label: "Microsoft Teams", description: "Notify dedicated responders in Teams." },
  { id: "email", label: "Email", description: "Receive daily digests and assignments." },
]

export default function AccountSettingsPage() {
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

  const selectedTeam = useMemo(() => {
    return TEAM_OPTIONS.find((team) => team.id === defaultTeamId)?.name ?? TEAM_OPTIONS[0]?.name ?? ""
  }, [defaultTeamId])

  function handleNotificationToggle(channel: NotificationChannel, checked: boolean) {
    setNotifications((previous) => ({
      ...previous,
      [channel]: checked,
    }))
  }

  return (
    <DashboardShell
      header={{
        title: "Account settings",
        description: "Personalize how you appear in processes and choose the alerts that keep you in sync.",
        icon: User,
      }}
    >
      <div className="space-y-10">
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
                {NOTIFICATION_CHANNELS.map((channel) => (
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
      </div>
    </DashboardShell>
  )
}
