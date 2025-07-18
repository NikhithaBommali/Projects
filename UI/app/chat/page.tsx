"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, ArrowLeft, Send, Bot, User } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

type ChatSession = {
  id: string
  title: string
  created_at: string
}

type UserInfo = {
  name: string
  email: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [forceNewSession, setForceNewSession] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const handleResetChat = () => {
  setMessages([])
  setInput("")
  setIsLoading(false)
  setSelectedSessionId(null)
  setForceNewSession(true)
}
  useEffect(() => {
    if (!token) return router.push("/login")
    fetchSessions()
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (token && selectedSessionId) fetchMessagesBySession(selectedSessionId)
  }, [selectedSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSessions(res.data)
      if (!selectedSessionId && res.data.length > 0) {
        setSelectedSessionId(res.data[0].id)
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
      }
      console.error("Failed to fetch sessions", err)
    }
  }

  const fetchMessagesBySession = async (sessionId: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const history: Message[] = res.data.flatMap((chat: any) => [
        {
          id: `${chat.id}-q`,
          role: "user",
          content: chat.query,
          timestamp: chat.created_at,
        },
        {
          id: `${chat.id}-r`,
          role: "assistant",
          content: chat.response,
          timestamp: chat.created_at,
        },
      ])
      setMessages(history)
    } catch (err) {
      console.error("Failed to load chat history", err)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserInfo({ name: res.data.name, email: res.data.email })
    } catch (err) {
      console.error("Failed to fetch user info", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const now = new Date().toISOString()
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await axios.post(
        "http://localhost:8000/api/chat",
        {
          query: input,
          force_new: forceNewSession,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      const aiMessage: Message = {
        id: res.data.id || crypto.randomUUID(),
        role: "assistant",
        content: res.data.response,
        timestamp: res.data.created_at || new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])

      if (res.data.session_created && res.data.session_id) {
        await fetchSessions()
        setSelectedSessionId(res.data.session_id)
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
      }
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: err?.response?.data?.detail || "Something went wrong!",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setInput("")
      setForceNewSession(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 hidden md:block overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="text-blue-600 h-5 w-5" />
            Sessions
          </h2>
          <Button size="sm" className="bg-blue-600 text-white" onClick={handleResetChat}>
            + New
          </Button>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                s.id === selectedSessionId ? "bg-blue-100 text-blue-800" : ""
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Bot className="text-blue-600" />
              AI Health Assistant
            </h1>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{userInfo?.name || "Loading..."}</DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-gray-500">{userInfo?.email}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f7f8fa]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-xl whitespace-pre-wrap text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{msg.content}</p>
                <p className="text-[10px] text-right mt-1 text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-xl flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <span className="animate-pulse text-sm">Typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-6 py-4 border-t bg-white flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your question..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
