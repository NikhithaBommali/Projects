"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Brain, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import ChatButton from "@/components/chat-button"

export default function PredictPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    symptoms: "",
    medicalHistory: "",
    lifestyle: {
      smoking: false,
      drinking: false,
      exercise: false,
      stress: false,
    },
    vitals: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/login")
  }, [router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLifestyleChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: checked }
    }))
  }

  const handleVitalsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: value }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = localStorage.getItem("token")
    if (!token) {
      alert("Please log in to use prediction")
      router.push("/login")
      return
    }

    const transformedData = {
      age: formData.age,
      gender: formData.gender,
      symptoms: formData.symptoms,
      medical_history: formData.medicalHistory,
      lifestyle: formData.lifestyle,
      vitals: {
        blood_pressure: formData.vitals.bloodPressure,
        heart_rate: formData.vitals.heartRate,
        temperature: formData.vitals.temperature,
        weight: formData.vitals.weight,
      }
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(transformedData),
      })

      const data = await response.json()
      if (!response.ok) {
        console.error("❌ Prediction failed", data)
        throw new Error(data.detail || "Prediction failed")
      }

      setPrediction(data)
    } catch (err: any) {
      alert("Prediction failed: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatButton />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Disease Prediction</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!prediction ? (
          <Card>
            <CardHeader>
              <CardTitle>Health Assessment Form</CardTitle>
              <CardDescription>Provide accurate information for better prediction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      placeholder="Enter your age"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => handleInputChange("gender", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms</Label>
                  <Textarea
                    id="symptoms"
                    value={formData.symptoms}
                    onChange={(e) => handleInputChange("symptoms", e.target.value)}
                    placeholder="E.g. fever, cough, headache"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    rows={3}
                    placeholder="E.g. diabetes, asthma"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lifestyle</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(formData.lifestyle).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) =>
                            handleLifestyleChange(key, checked as boolean)
                          }
                        />
                        <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vitals</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(formData.vitals).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1")}</Label>
                        <Input
                          id={key}
                          value={value}
                          onChange={(e) => handleVitalsChange(key, e.target.value)}
                          placeholder={`Enter ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Analyzing..." : "Get Prediction"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    Prediction Result
                  </CardTitle>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    prediction.riskLevel === "Low" ? "bg-green-100 text-green-800" :
                    prediction.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {prediction.riskLevel} Risk
                  </span>
                </div>
                <CardDescription>Confidence: {prediction.confidence}%</CardDescription>
              </CardHeader>
              <CardContent>
                {prediction.conditions.map((cond: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-gray-100 p-4 rounded">
                    <span className="font-semibold">{cond.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 rounded-full bg-gray-300">
                        <div
                          className={`h-2 rounded-full ${
                            cond.color === "green" ? "bg-green-500" :
                            cond.color === "yellow" ? "bg-yellow-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${cond.risk}%` }}
                        />
                      </div>
                      <span className="text-sm">{cond.risk}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-blue-600 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {prediction.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setPrediction(null)}>New Prediction</Button>
              <Link href="/chat">
                <Button>Discuss with AI Doctor</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
