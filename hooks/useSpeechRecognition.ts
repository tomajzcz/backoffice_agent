"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeechRecognitionInstance, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from "@/types/speech"

export type SpeechStatus =
  | "idle"
  | "listening"
  | "unsupported"
  | "permission-denied"
  | "error"

interface UseSpeechRecognitionOptions {
  lang?: string
  onInterim?: (transcript: string) => void
  onFinal?: (transcript: string) => void
}

interface UseSpeechRecognitionReturn {
  status: SpeechStatus
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { lang = "cs-CZ", onInterim, onFinal } = options

  const [status, setStatus] = useState<SpeechStatus>("idle")
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const supportedRef = useRef<boolean>(false)

  // Store callbacks in refs to avoid re-creating the recognition instance
  const onInterimRef = useRef(onInterim)
  const onFinalRef = useRef(onFinal)
  onInterimRef.current = onInterim
  onFinalRef.current = onFinal

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      supportedRef.current = false
      setStatus("unsupported")
      return
    }

    supportedRef.current = true

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (interim && onInterimRef.current) {
        onInterimRef.current(interim)
      }

      if (final && onFinalRef.current) {
        onFinalRef.current(final)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          setStatus("permission-denied")
          break
        case "no-speech":
        case "aborted":
          // Silent return to idle
          setStatus("idle")
          break
        default:
          setStatus("error")
          break
      }
    }

    recognition.onend = () => {
      setStatus((prev) => (prev === "listening" ? "idle" : prev))
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [lang])

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition || !supportedRef.current) return

    // Reset error/permission-denied state to allow retry
    if (status === "error" || status === "permission-denied") {
      setStatus("idle")
    }

    try {
      recognition.start()
      setStatus("listening")
    } catch {
      // Already started or other error — abort and retry
      try {
        recognition.abort()
        recognition.start()
        setStatus("listening")
      } catch {
        setStatus("error")
      }
    }
  }, [status])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    recognition.stop()
  }, [])

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening()
    } else {
      startListening()
    }
  }, [status, startListening, stopListening])

  return {
    status,
    isListening: status === "listening",
    isSupported: status !== "unsupported",
    startListening,
    stopListening,
    toggleListening,
  }
}
