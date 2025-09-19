'use client'

import type { ReactNode } from 'react'

import { Avatar } from '@/components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  ChevronDown,
  ChevronUp,
  Cog,
  HelpCircle,
  Home,
  Inbox,
  Layers,
  Lightbulb,
  LogOut,
  Megaphone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
} from 'lucide-react'

export type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/search" aria-label="Search">
              <Search aria-hidden="true" data-slot="icon" />
            </NavbarItem>
            <NavbarItem href="/inbox" aria-label="Inbox">
              <Inbox aria-hidden="true" data-slot="icon" />
            </NavbarItem>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="/placeholder-user.jpg" square />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/my-profile">
                  <User aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheck aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/share-feedback">
                  <Lightbulb aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/logout">
                  <LogOut aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem} className="lg:mb-2.5">
                <Avatar src="/placeholder-logo.svg" />
                <SidebarLabel>Tailwind Labs</SidebarLabel>
                <ChevronDown aria-hidden="true" data-slot="icon" />
              </DropdownButton>
              <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                <DropdownItem href="/teams/1/settings">
                  <Cog aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/teams/1">
                  <Avatar slot="icon" src="/placeholder-logo.svg" />
                  <DropdownLabel>Tailwind Labs</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/teams/2">
                  <Avatar slot="icon" initials="WC" className="bg-purple-500 text-white" />
                  <DropdownLabel>Workcation</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/teams/create">
                  <Plus aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>New team&hellip;</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <SidebarSection className="max-lg:hidden">
              <SidebarItem href="/search">
                <Search aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Search</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/inbox">
                <Inbox aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Inbox</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/">
                <Home aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/events">
                <Layers aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Events</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/orders">
                <Ticket aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Orders</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/settings">
                <Settings2 aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Settings</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/broadcasts">
                <Megaphone aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Broadcasts</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Upcoming Events</SidebarHeading>
              <SidebarItem href="/events/1">Bear Hug: Live in Concert</SidebarItem>
              <SidebarItem href="/events/2">Viking People</SidebarItem>
              <SidebarItem href="/events/3">Six Fingers — DJ Set</SidebarItem>
              <SidebarItem href="/events/4">We All Look The Same</SidebarItem>
            </SidebarSection>
            <SidebarSpacer />
            <SidebarSection>
              <SidebarItem href="/support">
                <HelpCircle aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Support</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/changelog">
                <Sparkles aria-hidden="true" data-slot="icon" />
                <SidebarLabel>Changelog</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src="/placeholder-user.jpg" className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">Erica</span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      erica@example.com
                    </span>
                  </span>
                </span>
                <ChevronUp aria-hidden="true" data-slot="icon" />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="top start">
                <DropdownItem href="/my-profile">
                  <User aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheck aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/share-feedback">
                  <Lightbulb aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/logout">
                  <LogOut aria-hidden="true" data-slot="icon" />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
