"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Heart, Activity, Brain, MessageCircle, User, LogOut, ChevronDown,
} from "lucide-react"
import ChatButton from "@/components/chat-button"

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error("Failed to load dashboard")

        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (err) {
        console.error(err)
        setError("Session expired. Please log in again.")
        localStorage.removeItem("token")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [router])

  if (loading) return <div className="text-center mt-20">Loading dashboard...</div>
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <ChatButton />

      {/* HEADER */}
      <header className="bg-white shadow-sm z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">MediPredict</span>
            </div>
            <div className="flex items-center space-x-4 relative">
              {/* Profile dropdown trigger */}
              <button
                onClick={() => setShowProfile(prev => !prev)}
                className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
              >
                <User className="h-4 w-4 mr-1" />
                {data?.name || "Profile"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <div className="absolute top-12 right-0 bg-white border rounded shadow-lg w-64 z-50">
                  <div className="p-4 text-sm text-gray-700 space-y-2">
                    <p><strong>Name:</strong> {data?.name}</p>
                    <p><strong>Role:</strong> {data?.role || "User"}</p>
                    <Button
                      variant="ghost"
                      className="w-full text-left px-0 text-red-600 mt-2"
                      onClick={() => {
                        localStorage.removeItem("token")
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

      {/* MAIN DASHBOARD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {data?.name || "User"}!
          </h1>
          <p className="text-gray-600">Ready to check your health status today?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.prediction_count ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.health_score ?? "--"}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.chat_count ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
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
              <CardDescription>Chat with our AI doctor</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full" variant="outline">Start Chat</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest health predictions and consultations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.recent_activity || []).length === 0 ? (
                  <p className="text-gray-500">No recent activity yet.</p>
                ) : (
                  data.recent_activity.map((activity: any, idx: number) => (
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
      </div>
    </div>
  )
}
