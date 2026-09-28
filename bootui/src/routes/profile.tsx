import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FingerprintIcon, ShieldCheckIcon } from "lucide-react"
import {
  currentUserQuery,
  passkeyRegisteredQuery,
  registerPasskey,
} from "@/lib/auth"

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: user } = useQuery(currentUserQuery)
  const { data: passkey, isPending: passkeyPending } = useQuery(
    passkeyRegisteredQuery
  )

  const registerMutation = useMutation({
    mutationFn: () => registerPasskey(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: passkeyRegisteredQuery.queryKey,
      })
    },
  })

  const registered = passkey?.registered === true
  const pending = passkeyPending || registerMutation.isPending

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and sign-in methods.
        </p>
      </div>

      <div className="grid w-full gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Your identity in this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Display name" value={user?.displayName ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passkey</CardTitle>
            <CardDescription>
              Use a device biometric or security key to sign in without a
              password.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {pending ? (
                <Badge variant="secondary">Checking...</Badge>
              ) : registered ? (
                <Badge className="gap-1">
                  <ShieldCheckIcon />
                  Registered
                </Badge>
              ) : (
                <Badge variant="secondary">Not registered</Badge>
              )}
            </div>
            <Button
              className="w-fit gap-2"
              disabled={registered || pending}
              onClick={() => registerMutation.mutate()}
            >
              <FingerprintIcon />
              {registerMutation.isPending
                ? "Waiting for device..."
                : "Register passkey"}
            </Button>
            {registered && (
              <p className="text-sm text-muted-foreground">
                A passkey is already registered for this account, so
                registration is disabled.
              </p>
            )}
            {registerMutation.isError && (
              <p className="text-sm text-destructive">
                {registerMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  )
}
