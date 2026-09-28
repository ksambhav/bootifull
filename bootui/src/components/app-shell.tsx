import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { currentUserQuery, logout } from "@/lib/auth"

const navigation = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Profile", to: "/profile", icon: UserIcon },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: user } = useQuery(currentUserQuery)
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.clear()
      await navigate({ to: "/" })
    },
  })

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" render={<Link to="/" />}>
                  <ShieldCheckIcon />
                  <span className="font-heading">Bootifull</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <AppNavItem key={item.to} {...item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Coming soon" disabled>
                  <SettingsIcon />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <UserMenu
              user={user}
              onLogout={() => logoutMutation.mutate()}
              logoutPending={logoutMutation.isPending}
            />
          </header>
          <div className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function AppNavItem({
  title,
  to,
  icon: Icon,
}: {
  title: string
  to: "/dashboard" | "/profile"
  icon: typeof LayoutDashboardIcon
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={title}
        isActive={pathname === to}
        render={<Link to={to} />}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function UserMenu({
  user,
  onLogout,
  logoutPending,
}: {
  user?: {
    email: string | null
    displayName: string | null
    avatarUrl: string | null
  }
  onLogout: () => void
  logoutPending: boolean
}) {
  const label = user?.displayName || user?.email || "Guest"
  const initials =
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "B"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-2"
            aria-label="Account menu"
          />
        }
      >
        <Avatar>
          {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm sm:inline">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{label}</p>
            {user?.email && user.email !== label && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/profile" />}>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutPending}
          onClick={onLogout}
        >
          <LogOutIcon />
          {logoutPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
