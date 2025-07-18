"use client"

import { useEffect, useState, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Heart, Activity, Users, MessageCircle, User, LogOut, Upload, Database, Shield, Brain, ChevronDown,
} from "lucide-react"
import ChatButton from "@/components/chat-button"

type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  is_admin: boolean
  health_score: number
}

type Chat = {
  id: number
  query: string
  response: string
  created_at: string
  user_id: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("token")

    if (!user?.is_admin || !token) {
      router.push("/dashboard")
      return
    }

    const fetchData = async () => {
      try {
        const [usersRes, chatsRes, dashboardRes] = await Promise.all([
          axios.get("http://localhost:8000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/admin/chats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/dashboard", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])
        
        setUsers(usersRes.data)
        setChats(chatsRes.data)
        
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json()
          setAdminData(dashboardData)
        }
      } catch (err) {
        console.error("Error fetching admin data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const token = localStorage.getItem("token")

    if (!file) {
      setUploadStatus("❌ No file selected.")
      return
    }

    if (!token) {
      setUploadStatus("❌ Unauthorized: Token not found. Please log in again.")
      router.push("/login")
      return
    }

    setUploading(true)
    setUploadStatus("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      await axios.post("http://localhost:8000/api/admin/upload-document", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      })

      setUploadStatus("✅ File uploaded successfully!")
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 401) {
        setUploadStatus("❌ Unauthorized: Please log in again.")
        router.push("/login")
      } else {
        setUploadStatus("❌ Failed to upload file.")
      }
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading admin data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <ChatButton />
      <header className="bg-white shadow-sm z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">MediPredict</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Admin</span>
            </div>
            <div className="relative flex items-center space-x-4">
              <button
                onClick={() => setShowProfile(prev => !prev)}
                className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
              >
                <User className="h-4 w-4 mr-1" />
                {adminData?.name || "Profile"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {showProfile && (
                <div className="absolute top-12 right-0 bg-white border rounded shadow-lg w-64 z-50">
                  <div className="p-4 text-sm text-gray-700 space-y-2">
                    <p><strong>Name:</strong> {adminData?.name}</p>
                    <p><strong>Role:</strong> Admin</p>
                    <Button
                      variant="ghost"
                      className="w-full text-left px-0 text-red-600 mt-2"
                      onClick={() => {
                        localStorage.removeItem("token")
                        localStorage.removeItem("user")
                        router.push("/login")
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {adminData?.name || "Admin"}! Manage users, monitor activity, and access health tools.
          </p>
        </div>

        {/* Personal Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your Predictions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData?.prediction_count ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Personal predictions made
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your Health Score</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData?.health_score ?? "--"}%</div>
              <p className="text-xs text-muted-foreground">
                Your health rating
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Your Chats</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminData?.chat_count ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Your chat sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admin Access</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-muted-foreground">
                Full system access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.is_admin).length} admin(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">All Chat Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chats.length}</div>
              <p className="text-xs text-muted-foreground">
                System-wide conversations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.length > 0 
                  ? Math.round(users.reduce((acc, u) => acc + (u.health_score || 0), 0) / users.length)
                  : "--"}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Disease Prediction</CardTitle>
              <CardDescription>Get AI-powered predictions based on your symptoms</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/predict">
                <Button className="w-full">Start Prediction</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>AI Health Assistant</CardTitle>
              <CardDescription>Chat with our AI doctor for health advice</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full" variant="outline">Start Chat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Upload className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload medical documents and datasets for the AI model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {uploading && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
                {uploadStatus && (
                  <p className={`text-sm ${uploadStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Recent Activity</CardTitle>
              <CardDescription>Your latest health predictions and consultations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(adminData?.recent_activity || []).length === 0 ? (
                  <p className="text-gray-500">No recent activity yet.</p>
                ) : (
                  adminData.recent_activity.map((activity: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{activity.date}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>
                Overview of all registered users and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-900">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Admin</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Health Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{u.id}</td>
                        <td className="px-4 py-3 text-gray-900">{u.first_name} {u.last_name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.is_admin 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {u.is_admin ? '✅ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {u.health_score ? `${u.health_score}%` : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Logs */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                <CardTitle>Chat Activity</CardTitle>
              </div>
              <CardDescription>
                Recent conversations and AI interactions across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-900">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">User ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Query</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Response</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chats.map((chat) => (
                      <tr key={chat.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{chat.id}</td>
                        <td className="px-4 py-3 text-gray-900">{chat.user_id}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[300px]">
                          <div className="truncate" title={chat.query}>
                            {chat.query}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[300px]">
                          <div className="truncate" title={chat.response}>
                            {chat.response}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(chat.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}