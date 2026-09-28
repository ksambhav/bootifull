import { queryOptions } from "@tanstack/react-query"

export type CurrentUser = {
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  authenticated: boolean
}

export type AuthProviders = {
  password: boolean
  google: boolean
  passkey: boolean
}

export type PasskeyRegistered = {
  registered: boolean
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiJson<CurrentUser>("/api/auth/me")
}

export async function fetchAuthProviders(): Promise<AuthProviders> {
  return apiJson<AuthProviders>("/api/auth/providers")
}

export async function fetchPasskeyRegistered(): Promise<PasskeyRegistered> {
  return apiJson<PasskeyRegistered>("/api/auth/passkeys/registered")
}

export async function loginWithPassword(input: {
  email: string
  password: string
}) {
  const body = new URLSearchParams()
  body.set("email", input.email)
  body.set("password", input.password)

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Invalid email or password")
  }
}

export async function registerWithPassword(input: {
  email: string
  password: string
  displayName: string
}) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => undefined)
    throw new Error(error?.message ?? "Registration failed")
  }
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
}

export function startGoogleSignIn() {
  window.location.href = "/oauth2/authorization/google"
}

export async function registerPasskey(label = "Default passkey") {
  const options = await apiJson<PublicKeyCredentialCreationOptionsJSON>(
    "/webauthn/register/options",
    { method: "POST" }
  )
  const credential = (await navigator.credentials.create({
    publicKey: parseCreationOptions(options),
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new Error("Passkey registration was cancelled")
  }

  const response = await fetch("/webauthn/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: {
        credential: serializePublicKeyCredential(credential),
        label,
      },
    }),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Passkey registration failed")
  }
}

export async function loginWithPasskey() {
  const options = await apiJson<PublicKeyCredentialRequestOptionsJSON>(
    "/webauthn/authenticate/options",
    { method: "POST" }
  )
  const credential = (await navigator.credentials.get({
    publicKey: parseRequestOptions(options),
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new Error("Passkey sign in was cancelled")
  }

  const response = await fetch("/login/webauthn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(serializePublicKeyCredential(credential)),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Passkey sign in failed")
  }
}

export const authProvidersQuery = queryOptions({
  queryKey: ["auth-providers"],
  queryFn: fetchAuthProviders,
})

export const currentUserQuery = queryOptions({
  queryKey: ["current-user"],
  queryFn: fetchCurrentUser,
})

export const passkeyRegisteredQuery = queryOptions({
  queryKey: ["passkey-registered"],
  queryFn: fetchPasskeyRegistered,
})

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "include" })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

type PublicKeyCredentialCreationOptionsJSON = Omit<
  PublicKeyCredentialCreationOptions,
  "challenge" | "user" | "excludeCredentials"
> & {
  challenge: string
  user: Omit<PublicKeyCredentialUserEntity, "id"> & { id: string }
  excludeCredentials?: Array<
    Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }
  >
}

type PublicKeyCredentialRequestOptionsJSON = Omit<
  PublicKeyCredentialRequestOptions,
  "challenge" | "allowCredentials"
> & {
  challenge: string
  allowCredentials?: Array<
    Omit<PublicKeyCredentialDescriptor, "id"> & { id: string }
  >
}

function parseCreationOptions(
  options: PublicKeyCredentialCreationOptionsJSON
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToArrayBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64UrlToArrayBuffer(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToArrayBuffer(credential.id),
    })),
  }
}

function parseRequestOptions(
  options: PublicKeyCredentialRequestOptionsJSON
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToArrayBuffer(options.challenge),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToArrayBuffer(credential.id),
    })),
  }
}

function serializePublicKeyCredential(credential: PublicKeyCredential) {
  const response = credential.response
  const serializedResponse: Record<string, unknown> = {}

  if (response instanceof AuthenticatorAttestationResponse) {
    serializedResponse.attestationObject = arrayBufferToBase64Url(
      response.attestationObject
    )
  }
  if (response instanceof AuthenticatorAssertionResponse) {
    serializedResponse.authenticatorData = arrayBufferToBase64Url(
      response.authenticatorData
    )
    serializedResponse.signature = arrayBufferToBase64Url(response.signature)
    if (response.userHandle) {
      serializedResponse.userHandle = arrayBufferToBase64Url(
        response.userHandle
      )
    }
  }

  serializedResponse.clientDataJSON = arrayBufferToBase64Url(
    response.clientDataJSON
  )

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    response: serializedResponse,
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: credential.authenticatorAttachment,
  }
}

function base64UrlToArrayBuffer(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = window.atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}
