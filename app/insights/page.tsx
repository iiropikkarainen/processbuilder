"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowUpRight,
  Bot,
  Database,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { insightChatThreads } from "@/lib/data/insights"

const questionGroups = [
  {
    title: "AI & Automation",
    description: "Spot automation candidates inside processes and service desk flows.",
    icon: Bot,
    questions: [
      "What processes could we automate with AI to cut resolution time?",
      "Which repetitive requests could be shifted to self-service or chatbots?",
      "Where are manual approvals slowing things down that AI could streamline?",
    ],
  },
  {
    title: "Service Desk Efficiency",
    description: "Understand where Supabase ticket data shows bottlenecks and escalations.",
    icon: MessageSquare,
    questions: [
      "What are the most frequent service desk questions, and how can we reduce them?",
      "Which request types create the biggest backlog, and why?",
      "Where are tickets most often escalated — and could training or better documentation fix that?",
    ],
  },
  {
    title: "Process Bottlenecks",
    description: "Review cycle time data to uncover slow steps across operations.",
    icon: TrendingUp,
    questions: [
      "What business processes consistently take longer than expected?",
      "Which steps in a workflow add no clear value — could they be removed?",
      "Are there tasks that always require multiple handoffs, and can we eliminate them?",
    ],
  },
] as const

const dataSnapshots = [
  {
    label: "Active processes",
    value: "68",
    context: "Supabase processes table · last 30 days",
    delta: "+12% vs prior",
  },
  {
    label: "Tickets this week",
    value: "184",
    context: "Supabase tickets table",
    delta: "26 at risk",
  },
  {
    label: "Automation candidates",
    value: "9",
    context: "Flagged by AI during last analysis",
    delta: "5 high impact",
  },
] as const

const processOpportunities = [
  {
    name: "Vendor onboarding",
    issue: "Finance review adds 29h idle time across handoffs.",
    recommendation: "Route to automation queue with SLA nudges.",
  },
  {
    name: "Access provisioning",
    issue: "Manual approvals delay tickets past 12h SLA.",
    recommendation: "Trigger AI-generated summaries for approvers.",
  },
  {
    name: "Quarterly compliance",
    issue: "Duplicate document uploads across steps.",
    recommendation: "Consolidate upload step and pre-validate artifacts.",
  },
] as const

export default function InsightsPage() {
  const [prompt, setPrompt] = useState("")

  const handleSelectQuestion = (question: string) => {
    setPrompt(question)
  }

  const latestChat = insightChatThreads[0]

  return (
    <DashboardShell
      header={{
        title: "Insights",
        description:
          "Ask Process AI to analyze Supabase processes and tickets, surface bottlenecks, and recommend automations.",
        icon: Sparkles,
      }}
    >
      <div className="space-y-6 px-4 py-6 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <Card className="border-primary/20 bg-background/70 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                  Connected to Supabase
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="h-4 w-4" />
                  processes · tickets
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold">Ask Process AI anything</CardTitle>
                <CardDescription>
                  Generate insights from your operational data without writing SQL. Pick a sample question or describe
                  what you need and the assistant will explore both the processes and tickets tables.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Textarea
                aria-label="Ask Process AI"
                placeholder="e.g. Compare onboarding cycle time across squads and highlight the slowest approvals"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button className="gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  Analyze data
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/insights/chats">
                    <MessageSquare className="h-4 w-4" />
                    View saved chats
                  </Link>
                </Button>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Quick starters</p>
                <div className="flex flex-wrap gap-2">
                  {questionGroups.flatMap((group) => group.questions.slice(0, 1)).map((question) => (
                    <Button
                      key={question}
                      variant="secondary"
                      className="h-auto rounded-full px-4 py-2 text-left text-sm"
                      type="button"
                      onClick={() => handleSelectQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Snapshot from Supabase
              </CardTitle>
              <CardDescription>
                Live metrics pulled from the processes and tickets tables help you anchor every insight session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {dataSnapshots.map((snapshot) => (
                  <div key={snapshot.label} className="rounded-lg border border-border bg-background/70 p-4">
                    <div className="text-sm text-muted-foreground">{snapshot.label}</div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-semibold">{snapshot.value}</span>
                      <span className="text-xs font-medium text-primary">{snapshot.delta}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{snapshot.context}</p>
                  </div>
                ))}
              </div>
              {latestChat ? (
                <div className="rounded-lg border border-dashed border-primary/40 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Resume last insight</p>
                      <p className="text-xs text-muted-foreground">{latestChat.summary}</p>
                    </div>
                    <Button asChild variant="ghost" className="gap-1 text-xs">
                      <Link href={`/insights/chats/${latestChat.id}`}>
                        Open
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          {questionGroups.map((group) => (
            <Card key={group.title} className="h-full">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <group.icon className="h-4 w-4" />
                  {group.title}
                </div>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.questions.map((question) => (
                  <Button
                    key={question}
                    variant="ghost"
                    className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm"
                    type="button"
                    onClick={() => handleSelectQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="h-4 w-4" />
                Process opportunities
              </CardTitle>
              <CardDescription>
                AI scans Supabase process runs to surface the slowest steps and recommended automation plays.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processOpportunities.map((opportunity) => (
                <div key={opportunity.name} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{opportunity.name}</p>
                    <Badge variant="outline">High impact</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{opportunity.issue}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{opportunity.recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="h-4 w-4" />
                Suggested follow-ups
              </CardTitle>
              <CardDescription>Convert AI insights into next steps for your team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestChat?.followUps.map((item) => (
                <div key={item} className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-3">
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
              <Button asChild variant="secondary" className="w-full justify-center gap-2">
                <Link href="/insights/chats">
                  View all chats
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
