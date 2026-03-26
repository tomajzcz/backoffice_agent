/**
 * PPTX-specific store — delegates to the generic file store.
 */
import { storeFile, getFile } from "./file-store"

const PREFIX = "pptx-"

export async function storePptx(buffer: Buffer): Promise<string> {
  return storeFile(buffer, PREFIX)
}

export async function getPptx(token: string): Promise<Buffer | null> {
  return getFile(token, PREFIX)
}
