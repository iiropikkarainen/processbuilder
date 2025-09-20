"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  Settings,
  SquarePen,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { LucideIcon } from "lucide-react"

const navMain: { title: string; url: string; icon: LucideIcon; badge?: string }[] = [
  {
    title: "Overview",
    url: "/?section=overview",
    icon: LayoutDashboard,
  },
  {
    title: "Operations Catalog",
    url: "/",
    icon: ListChecks,
    badge: "24",
  },
  {
    title: "Service Desk",
    url: "/servicedesk",
    icon: LifeBuoy,
  },
  {
    title: "Workflow Builder",
    url: "/?section=builder",
    icon: SquarePen,
  },
  {
    title: "Automation",
    url: "/?section=automation",
    icon: Bot,
  },
  {
    title: "Reports",
    url: "/?section=reports",
    icon: BarChart3,
  },
]

const navSecondary: { title: string; url: string; icon: LucideIcon }[] = [
  {
    title: "Settings",
    url: "/?section=settings",
    icon: Settings,
  },
  {
    title: "Support",
    url: "/?section=support",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "/?section=feedback",
    icon: MessageSquare,
  },
]

const teams: { name: string; plan: string; initials: string; url: string }[] = [
  {
    name: "Process Ops",
    plan: "Enterprise",
    initials: "PO",
    url: "/?team=process-ops",
  },
  {
    name: "Revenue Ops",
    plan: "Pro",
    initials: "RO",
    url: "/?team=revenue-ops",
  },
  {
    name: "IT & Security",
    plan: "Team",
    initials: "IT",
    url: "/?team=it-security",
  },
]

function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">ProcessBuilder</span>
                  <span className="text-xs text-muted-foreground">Operations OS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === pathname}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="bg-sidebar-accent text-sidebar-accent-foreground">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Teams</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teams.map((team) => (
                <SidebarMenuItem key={team.name}>
                  <SidebarMenuButton asChild tooltip={team.name}>
                    <Link href={team.url}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-medium uppercase">
                        {team.initials}
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="truncate">{team.name}</span>
                        <span className="text-xs text-muted-foreground">{team.plan}</span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left">
                <span className="truncate text-sm font-medium">Olivia Martin</span>
                <span className="truncate text-xs text-muted-foreground">
                  operations@processbuilder.com
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

interface DashboardShellSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type DashboardShellHeaderProps = {
  title: string
  description?: string
  icon?: LucideIcon
}

interface DashboardShellProps {
  children: ReactNode
  search?: DashboardShellSearchProps
  header?: DashboardShellHeaderProps
}

export function DashboardShell({ children, search, header }: DashboardShellProps) {
  const HeaderIcon = header?.icon ?? ListChecks
  const headerTitle = header?.title ?? "Operations Catalog"
  const headerDescription =
    header?.description ?? "Browse Processes, assign tasks, and orchestrate your processes."

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <DashboardSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center gap-2 border-b bg-background px-4">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <Separator orientation="vertical" className="mr-2 h-6 md:hidden" />
              <div className="hidden flex-1 flex-col justify-center md:flex">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <HeaderIcon className="h-5 w-5 text-muted-foreground" />
                  {headerTitle}
                </div>
                <p className="text-sm text-muted-foreground">{headerDescription}</p>
              </div>
              <div className="flex flex-1 items-center gap-2 md:justify-end">
                {search ? (
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-9 w-full pl-9"
                      placeholder={search.placeholder ?? "Search categories or Processes…"}
                      type="search"
                      value={search.value}
                      onChange={(event) => search.onChange(event.target.value)}
                    />
                  </div>
                ) : (
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="h-9 w-full pl-9" placeholder="Search processes..." type="search" />
                  </div>
                )}
                <Button size="sm" className="hidden sm:inline-flex">
                  <Plus className="mr-2 h-4 w-4" />
                  New process
                </Button>
              </div>
            </header>
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
