import { useQuery } from "@tanstack/react-query"
import { Link, Outlet } from "@tanstack/react-router"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { currentUserQuery } from "@/lib/auth"

export function AppLayout() {
  const { data: user, isPending } = useQuery(currentUserQuery)

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user?.authenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please return to the landing page to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link to="/" />}>Go to landing page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
