/**
 * Skript pro získání Google OAuth2 refresh tokenu s plnými scopy.
 *
 * Použití:
 *   1. Nastav GOOGLE_CLIENT_ID a GOOGLE_CLIENT_SECRET v .env.local
 *   2. Spusť: npx tsx scripts/google-auth.ts
 *   3. Otevři vygenerovaný URL v prohlížeči
 *   4. Po autorizaci zkopíruj authorization code
 *   5. Spusť: npx tsx scripts/google-auth.ts <CODE>
 *   6. Zkopíruj nový GOOGLE_REFRESH_TOKEN do .env.local
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { google } from "googleapis"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",          // full calendar access (read+write)
  "https://www.googleapis.com/auth/gmail.compose",      // create drafts
  "https://www.googleapis.com/auth/gmail.readonly",     // read gmail
]

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error("Chybí GOOGLE_CLIENT_ID nebo GOOGLE_CLIENT_SECRET v .env.local")
  process.exit(1)
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob")

const code = process.argv[2]

if (!code) {
  // Step 1: Generate auth URL
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // force consent to get new refresh token
  })

  console.log("\n📋 Otevři tento URL v prohlížeči a autorizuj přístup:\n")
  console.log(url)
  console.log("\n📝 Pak spusť znovu s authorization code:")
  console.log("   npx tsx scripts/google-auth.ts <AUTH_CODE>\n")
} else {
  // Step 2: Exchange code for tokens
  try {
    const { tokens } = await oauth2.getToken(code)
    console.log("\n✅ Tokeny získány!\n")
    console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token)
    console.log("\n📝 Zkopíruj GOOGLE_REFRESH_TOKEN do .env.local a restartuj dev server.\n")
  } catch (err) {
    console.error("Chyba při výměně kódu za tokeny:", err)
    process.exit(1)
  }
}
