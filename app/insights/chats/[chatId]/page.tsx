import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  MessageCircle,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { insightChatThreads } from "@/lib/data/insights"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function InsightChatDetailPage({
  params,
}: {
  params: { chatId: string }
}) {
  const chat = insightChatThreads.find((thread) => thread.id === params.chatId)

  if (!chat) {
    notFound()
  }

  return (
    <DashboardShell
      header={{
        title: chat.title,
        description: "Saved Process AI conversation based on Supabase processes and tickets data.",
        icon: MessageSquare,
      }}
    >
      <div className="space-y-6 px-4 py-6 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/insights/chats">
              <ArrowLeft className="h-4 w-4" />
              Back to chats
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-muted/50">
              Updated {formatDateTime(chat.updatedAt)}
            </Badge>
            <Badge variant="outline" className="bg-muted/50">
              Created {formatDateTime(chat.createdAt)}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-semibold">Highlights</CardTitle>
            <CardDescription>Key takeaways from this AI analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {chat.metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-muted-foreground/30 bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-semibold">{metric.value}</p>
                  {metric.delta ? (
                    <p className="text-xs text-primary">{metric.delta}</p>
                  ) : null}
                </div>
              ))}
            </div>
            <Separator />
            <ul className="space-y-2 text-sm text-muted-foreground">
              {chat.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-semibold">Conversation</CardTitle>
            <CardDescription>
              Stored transcript between you and Process AI. Each follow-up is available via its unique URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {chat.messages.map((message) => {
              const isAssistant = message.role === "assistant"
              const Icon = isAssistant ? Bot : User

              return (
                <div
                  key={message.id}
                  className="rounded-lg border border-border bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-primary" />
                      {isAssistant ? "Process AI" : "You"}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(message.timestamp)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{message.content}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Suggested next steps</CardTitle>
            <CardDescription>Send these actions to owners or spin up a new automation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chat.followUps.map((item) => (
              <div key={item} className="rounded-lg border border-dashed border-muted-foreground/40 bg-background/80 p-3">
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
            <Button asChild variant="secondary" className="w-full justify-center gap-2">
              <Link href="/insights">
                Start a fresh insight
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
