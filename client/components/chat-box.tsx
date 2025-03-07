"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, X, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock messages for demonstration
const initialMessages = [
  {
    id: 1,
    sender: "system",
    text: "Welcome to the chat! How can we help you today?",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 2,
    sender: "user",
    text: "Hi, I have a question about the React course",
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: 3,
    sender: "support",
    text: "Hello! I'd be happy to help with your React course questions. What would you like to know?",
    timestamp: new Date(Date.now() - 1700000),
  },
]

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isMinimized])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      text: newMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")

    // Simulate response (in a real app, this would come from a WebSocket or API)
    setTimeout(() => {
      const responseMessage = {
        id: messages.length + 2,
        sender: "support",
        text: "Thanks for your message! A support agent will respond shortly.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, responseMessage])
    }, 1000)
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
        size="icon"
        aria-label="Open chat"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 md:w-96 ${
            isMinimized ? "h-14" : "h-[450px]"
          }`}
        >
          {/* Chat Header */}
          <div className="flex h-14 items-center justify-between border-b px-4 py-3">
            <h3 className="font-medium">Support Chat</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                onClick={toggleMinimize}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4" style={{ height: "calc(100% - 120px)" }}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div>{message.text}</div>
                        <div
                          className={`mt-1 text-xs ${
                            message.sender === "user"
                              ? "text-primary-foreground/70"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border-slate-200 dark:border-slate-700"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()} className="h-10 w-10 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

