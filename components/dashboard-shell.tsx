"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useCallback, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import {
  BarChart3,
  Bot,
  ChevronsUpDown,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { LucideIcon } from "lucide-react"

const navMain: {
  title: string
  url: string
  icon: LucideIcon
  badge?: string
  children?: { title: string; url: string }[]
}[] = [
  {
    title: "Overview",
    url: "/overview",
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
    children: [
      {
        title: "Requests",
        url: "/servicedesk/requests",
      },
    ],
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
    url: "/settings",
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
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = useSupabaseClient()

  const isMatchingPath = useCallback(
    (target: string) => {
      if (!target) return false
      if (target === "/") {
        return pathname === "/"
      }
      return pathname === target || pathname.startsWith(`${target}/`)
    },
    [pathname],
  )

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      // ✅ clear client + server session
      await supabase.auth.signOut()

      // optional: also hit your API to ensure AUTH cookie cleared
      await fetch("/api/auth/logout", { method: "POST" })

      // ✅ redirect cleanly with flag
      router.replace("/login?loggedOut=true")
      router.refresh()
    } catch (err) {
      console.error("Logout failed", err)
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, supabase, router])

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
              {navMain.map((item) => {
                const isChildGroupActive = item.children?.some((child) => isMatchingPath(child.url)) ?? false
                const isActive = isMatchingPath(item.url) || isChildGroupActive

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
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
                    {item.children ? (
                      <SidebarMenuSub>
                        {item.children.map((child) => {
                          const isChildActive = isMatchingPath(child.url)
                          return (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild size="sm" isActive={isChildActive}>
                                <Link href={child.url}>{child.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
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
              {navSecondary.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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
                  <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Open account menu</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Olivia Martin</p>
                    <p className="text-xs text-muted-foreground">
                      operations@processbuilder.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Pro
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account-settings" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void handleLogout()
                  }}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
