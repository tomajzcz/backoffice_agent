/**
 * PPTX-specific store — delegates to the generic file store.
 */
import { storeFile, getFile } from "./file-store"

const PREFIX = "pptx-"

export function storePptx(buffer: Buffer): string {
  return storeFile(buffer, PREFIX)
}

export function getPptx(token: string): Buffer | null {
  return getFile(token, PREFIX)
}
