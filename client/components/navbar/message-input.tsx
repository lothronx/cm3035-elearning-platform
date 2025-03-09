"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => void;
  isLoading?: boolean;
}

export default function MessageInput({ onSendMessage, isLoading = false }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() || file) {
      onSendMessage(message.trim(), file || undefined)
      setMessage("")
      setFile(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {file && (
        <div className="flex items-center gap-1 rounded-md bg-muted p-1 text-xs">
          <span className="truncate">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={() => setFile(null)}>
            Remove
          </Button>
        </div>
      )}

      <div className="flex gap-1 items-center">
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
          <Paperclip className="h-4 w-4" />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[32px] flex-1 resize-none text-xs"
          rows={1}
        />

        <Button type="submit" size="sm" disabled={(!message.trim() && !file) || isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

