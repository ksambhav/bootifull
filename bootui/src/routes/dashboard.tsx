import { useQuery } from "@tanstack/react-query"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { currentUserQuery } from "@/lib/auth"

export function DashboardPage() {
  const { data: user } = useQuery(currentUserQuery)

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Starter workspace for authenticated users.
        </p>
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>You are signed in as</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm font-medium">{user?.displayName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Build on this starter.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add routes, entities, and API endpoints here. The shell, session,
            and navigation are already wired up.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Session and passkeys.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Manage your sign-in methods and log out from the account menu in the
            top bar.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
