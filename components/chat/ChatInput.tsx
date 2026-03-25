"use client"

import { Send, Loader2 } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useCallback, useRef } from "react"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { MicButton } from "./MicButton"

interface Props {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: Props) {
  const baseInputRef = useRef("")

  const handleInterim = useCallback(
    (interim: string) => {
      const base = baseInputRef.current
      const separator = base && !base.endsWith(" ") ? " " : ""
      onInputChange(base + separator + interim)
    },
    [onInputChange]
  )

  const handleFinal = useCallback(
    (final: string) => {
      const base = baseInputRef.current
      const separator = base && !base.endsWith(" ") ? " " : ""
      const newBase = base + separator + final
      baseInputRef.current = newBase
      onInputChange(newBase)
    },
    [onInputChange]
  )

  const { status, isListening, isSupported, toggleListening, stopListening } =
    useSpeechRecognition({
      lang: "cs-CZ",
      onInterim: handleInterim,
      onFinal: handleFinal,
    })

  const handleToggleListening = useCallback(() => {
    if (!isListening) {
      // Snapshot current input as the base before listening starts
      baseInputRef.current = input
    }
    toggleListening()
  }, [isListening, input, toggleListening])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        if (isListening) stopListening()
        onSubmit(e as unknown as FormEvent)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="px-3 pb-3 pt-2">
      <div className="relative flex items-end gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 focus-within:border-primary/40 focus-within:bg-secondary/60 transition-all">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napiš dotaz nebo instrukci…"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50 max-h-32 overflow-y-auto scrollbar-thin leading-relaxed"
          style={{
            fontFamily: "Outfit, sans-serif",
            minHeight: "20px",
          }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = "auto"
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`
          }}
        />
        {isSupported && (
          <MicButton
            status={status}
            onClick={handleToggleListening}
            disabled={isLoading}
          />
        )}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 w-7 h-7 rounded-lg bg-primary/90 hover:bg-primary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          )}
        </button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/30 mt-1.5">
        Enter odeslat · Shift+Enter nový řádek{isSupported ? " · Mikrofon diktovat" : ""}
      </p>
    </form>
  )
}
