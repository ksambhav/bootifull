import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router"
import {
  FingerprintIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/routes/app-layout"
import { DashboardPage } from "@/routes/dashboard"
import { ProfilePage } from "@/routes/profile"
import {
  authProvidersQuery,
  currentUserQuery,
  loginWithPasskey,
  loginWithPassword,
  registerWithPassword,
  startGoogleSignIn,
} from "@/lib/auth"

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
})
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  component: AppLayout,
})
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
})
const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: ProfilePage,
})
const routeTree = rootRoute.addChildren([
  indexRoute,
  appRoute.addChildren([dashboardRoute, profileRoute]),
])
const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function RootLayout() {
  return <Outlet />
}

export function App() {
  return <RouterProvider router={router} />
}

function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const { data: user } = useQuery(currentUserQuery)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-heading font-medium"
          >
            <ShieldCheckIcon data-icon="inline-start" />
            Bootifull
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Platform
            </a>
            <a href="#security" className="hover:text-foreground">
              Security
            </a>
            <a href="#templates" className="hover:text-foreground">
              Templates
            </a>
          </div>
          <div className="flex items-center gap-2">
            {user?.authenticated ? (
              <Button variant="outline" render={<Link to="/dashboard" />}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAuthOpen(true)}>
                  Log in
                </Button>
                <Button onClick={() => setAuthOpen(true)}>Get started</Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="flex flex-col justify-center gap-6">
            <Badge variant="secondary" className="w-fit">
              Full-stack starter for secure products
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="font-heading text-4xl font-medium tracking-tight md:text-6xl">
                Launch a polished app with auth already wired in.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Bootifull combines Spring Boot, Postgres, React, shadcn/ui,
                TanStack, Google SSO, and passkey-ready authentication in one
                starter template.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => setAuthOpen(true)}>
                Start building
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link to="/dashboard" />}
              >
                View dashboard
              </Button>
            </div>
          </div>

          <Card className="self-center">
            <CardHeader>
              <CardTitle>Authentication controls stay in the nav.</CardTitle>
              <CardDescription>
                The landing area remains focused on product positioning while
                login, registration, SSO, and passkeys open in a dialog.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                "Email and password registration",
                "Google OAuth2 / SSO user provisioning",
                "WebAuthn passkey registration and sign-in",
                "Session-based Spring Security APIs",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <SparklesIcon data-icon="inline-start" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section
          id="features"
          className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3"
        >
          <FeatureCard
            title="Secure by default"
            description="BCrypt passwords, OAuth2 login, and WebAuthn passkey flows backed by Postgres."
          />
          <FeatureCard
            title="Template-friendly"
            description="Keep this starter generic, reusable, and ready for your next product launch."
          />
          <FeatureCard
            title="Modern React"
            description="shadcn/ui composition with TanStack Router, Query, and Form for app workflows."
          />
        </section>
      </main>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [mode, setMode] = useState("login")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Bootifull</DialogTitle>
          <DialogDescription>
            Sign in, create an account, or continue with your identity provider.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: providers } = useQuery(authProvidersQuery)
  const [error, setError] = useState<string | null>(null)
  const login = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      })
      onDone()
      await navigate({ to: "/dashboard" })
    },
    onError: (error) => setError(error.message),
  })
  const passkey = useMutation({
    mutationFn: loginWithPasskey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      })
      onDone()
      await navigate({ to: "/dashboard" })
    },
    onError: (error) => setError(error.message),
  })
  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: ({ value }) => login.mutate(value),
  })

  return (
    <div className="flex flex-col gap-4 pt-2">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="email">
          {(field) => (
            <AuthField
              id={field.name}
              label="Email"
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="email"
              />
            </AuthField>
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <AuthField
              id={field.name}
              label="Password"
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="current-password"
              />
            </AuthField>
          )}
        </form.Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={login.isPending}>
          <KeyRoundIcon data-icon="inline-start" />
          {login.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <Separator />
      <div className="flex flex-col gap-2">
        {providers?.google && (
          <Button variant="outline" onClick={startGoogleSignIn}>
            Continue with Google
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => passkey.mutate()}
          disabled={passkey.isPending}
        >
          <FingerprintIcon data-icon="inline-start" />
          {passkey.isPending ? "Checking passkey..." : "Sign in with passkey"}
        </Button>
      </div>
    </div>
  )
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: providers } = useQuery(authProvidersQuery)
  const [error, setError] = useState<string | null>(null)
  const register = useMutation({
    mutationFn: async (value: {
      email: string
      password: string
      displayName: string
    }) => {
      await registerWithPassword(value)
      await loginWithPassword({ email: value.email, password: value.password })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: currentUserQuery.queryKey,
      })
      onDone()
      await navigate({ to: "/dashboard" })
    },
    onError: (error) => setError(error.message),
  })
  const form = useForm({
    defaultValues: { displayName: "", email: "", password: "" },
    onSubmit: ({ value }) => register.mutate(value),
  })

  return (
    <div className="flex flex-col gap-4 pt-2">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="displayName">
          {(field) => (
            <AuthField
              id={field.name}
              label="Name"
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                autoComplete="name"
              />
            </AuthField>
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <AuthField
              id={field.name}
              label="Email"
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                autoComplete="email"
              />
            </AuthField>
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <AuthField
              id={field.name}
              label="Password"
              error={firstError(field.state.meta.errors)}
            >
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                autoComplete="new-password"
              />
            </AuthField>
          )}
        </form.Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      {providers?.google && (
        <>
          <Separator />
          <Button variant="outline" onClick={startGoogleSignIn}>
            Continue with Google
          </Button>
        </>
      )}
    </div>
  )
}

function AuthField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-2"
      data-invalid={Boolean(error) || undefined}
    >
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function firstError(errors: unknown[]) {
  return errors.length > 0 ? String(errors[0]) : undefined
}

export default App
