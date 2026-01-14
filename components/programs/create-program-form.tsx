"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export function CreateProgramForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    displayImage: "",
    backgroundImage: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      // Replace with your actual API endpoint
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create program")
      }

      const data = await response.json()
      router.push(`/dashboard/programs/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create program")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Create New Program</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Program Title *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Advanced React Patterns"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
              className="border-border bg-input text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your program..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className="w-full rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayImage" className="text-foreground">
                Display Image URL
              </Label>
              <Input
                id="displayImage"
                name="displayImage"
                placeholder="https://..."
                type="url"
                value={formData.displayImage}
                onChange={handleChange}
                disabled={isLoading}
                className="border-border bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImage" className="text-foreground">
                Background Image URL
              </Label>
              <Input
                id="backgroundImage"
                name="backgroundImage"
                placeholder="https://..."
                type="url"
                value={formData.backgroundImage}
                onChange={handleChange}
                disabled={isLoading}
                className="border-border bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? "Creating..." : "Create Program"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
