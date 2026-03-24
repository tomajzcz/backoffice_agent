import { google } from "googleapis"

const globalForGoogle = globalThis as unknown as {
  googleAuth: InstanceType<typeof google.auth.OAuth2> | null
}

export function getGoogleClient(): InstanceType<typeof google.auth.OAuth2> | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  if (globalForGoogle.googleAuth) {
    return globalForGoogle.googleAuth
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })

  if (process.env.NODE_ENV !== "production") {
    globalForGoogle.googleAuth = oauth2
  }

  return oauth2
}
