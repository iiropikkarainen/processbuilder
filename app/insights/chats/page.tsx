"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  MessageCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { insightChatThreads } from "@/lib/data/insights"

export default function InsightsChatsPage() {
  return (
    <DashboardShell
      header={{
        title: "Insight chats",
        description: "Every conversation with Process AI is saved with its own shareable URL.",
        icon: MessageSquare,
      }}
      action={{
        label: "New analysis",
        icon: Sparkles,
        onClick: () => {
          window.location.href = "/insights"
        },
      }}
    >
      <div className="space-y-6 px-4 py-6 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {insightChatThreads.length} saved chats · Each entry opens its own URL so you can revisit the exact insight.
          </div>
          <Button asChild variant="ghost" className="gap-2 text-sm">
            <Link href="/insights">
              <ArrowLeft className="h-4 w-4" />
              Back to Insights
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {insightChatThreads.map((chat) => (
            <Card key={chat.id} className="transition hover:border-primary/40">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold">{chat.title}</CardTitle>
                    <CardDescription>{chat.summary}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {chat.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {chat.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-muted-foreground/30 bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-semibold">{metric.value}</p>
                      {metric.delta ? (
                        <p className="text-xs text-primary">{metric.delta}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highlights</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {chat.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <MessageCircle className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(chat.updatedAt))}
                  </span>
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href={`/insights/chats/${chat.id}`}>
                      Open chat
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
