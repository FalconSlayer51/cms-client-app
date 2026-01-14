"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { getPlaceholderProgramById } from "@/lib/placeholder-data"
import type { Program, Lesson } from "@/lib/api-client"

export default function ScheduleProgramPage() {
  const params = useParams()
  const { user } = useAuth()
  const [program, setProgram] = useState<Program | null>(null)
  const [schedules, setSchedules] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgram()
  }, [])

  const fetchProgram = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("auth_token")
      try {
        const response = await fetch(`/api/programs/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (response.ok) {
          const data = await response.json()
          setProgram(data.data)
          return
        }
      } catch (error) {
        console.log("API unavailable, using placeholder data")
      }

      // Fallback to placeholder data
      const placeholderProgram = getPlaceholderProgramById(params.id as string)
      setProgram(placeholderProgram || null)
    } catch (error) {
      console.error("Failed to fetch program:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleChange = (lessonId: string, date: string) => {
    setSchedules(new Map(schedules).set(lessonId, date))
  }

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const scheduleData = Array.from(schedules.entries()).map(([lessonId, scheduledDate]) => ({
        lessonId,
        scheduledDate,
        isPublished: true,
      }))

      const response = await fetch(`/api/programs/${params.id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ schedules: scheduleData }),
      })

      if (response.ok) {
        alert("Program published successfully")
      }
    } catch (error) {
      console.error("Failed to publish:", error)
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>
  if (!program) return <div className="p-8 text-muted-foreground">Program not found</div>

  const allLessons: Array<Lesson & { termTitle: string }> = []
  program.terms?.forEach((term) => {
    term.lessons?.forEach((lesson) => {
      allLessons.push({ ...lesson, termTitle: term.title })
    })
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Schedule & Publish</h1>
        <p className="mt-2 text-muted-foreground">Schedule lessons and publish your program</p>
      </div>

      <Card className="border-border bg-card p-6">
        <div className="space-y-6">
          {allLessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons to schedule</p>
          ) : (
            allLessons.map((lesson) => (
              <div key={lesson.id} className="border-b border-border pb-4 last:border-0">
                <div className="mb-2">
                  <p className="font-semibold text-foreground">{lesson.title}</p>
                  <p className="text-sm text-muted-foreground">{lesson.termTitle}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Schedule Date</Label>
                  <Input
                    type="datetime-local"
                    value={schedules.get(lesson.id) || ""}
                    onChange={(e) => handleScheduleChange(lesson.id, e.target.value)}
                    className="border-border bg-input text-foreground"
                  />
                </div>
              </div>
            ))
          )}

          <div className="flex gap-4 pt-6">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePublish}>
              Publish Program
            </Button>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary bg-transparent"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
