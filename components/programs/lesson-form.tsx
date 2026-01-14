"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Lesson, LessonContent } from "@/lib/api-client"

interface LessonFormProps {
  lesson?: Lesson
  onSubmit: (data: Partial<Lesson>) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function LessonForm({ lesson, onSubmit, isLoading = false, onCancel }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    description: lesson?.description || "",
    contentType: lesson?.content.type || ("video" as "video" | "image" | "text"),
    contentUrl: lesson?.content.url || "",
    contentText: lesson?.content.text || "",
    scheduledDate: lesson?.scheduledDate ? new Date(lesson.scheduledDate).toISOString().split("T")[0] : "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const content: LessonContent = {
      type: formData.contentType,
      ...(formData.contentType === "text" ? { text: formData.contentText } : { url: formData.contentUrl }),
    }

    onSubmit({
      title: formData.title,
      description: formData.description,
      content,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
    })
  }

  return (
    <Card className="border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">{lesson ? "Edit Lesson" : "Create New Lesson"}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Lesson Title *</Label>
          <Input
            placeholder="e.g., Getting Started with Hooks"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border-border bg-input text-foreground"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Description</Label>
          <Textarea
            placeholder="What will students learn?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border-border bg-input text-foreground"
            disabled={isLoading}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Content Type *</Label>
          <Select
            value={formData.contentType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                contentType: value as "video" | "image" | "text",
                contentUrl: "",
                contentText: "",
              })
            }
          >
            <SelectTrigger className="border-border bg-input text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.contentType !== "text" && (
          <div className="space-y-2">
            <Label className="text-foreground">{formData.contentType === "video" ? "Video URL" : "Image URL"} *</Label>
            <Input
              placeholder={
                formData.contentType === "video" ? "https://example.com/video.mp4" : "https://example.com/image.jpg"
              }
              type="url"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
              className="border-border bg-input text-foreground"
              required={formData.contentType !== "text"}
              disabled={isLoading}
            />
          </div>
        )}

        {formData.contentType === "text" && (
          <div className="space-y-2">
            <Label className="text-foreground">Content Text *</Label>
            <Textarea
              placeholder="Enter lesson content..."
              value={formData.contentText}
              onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
              className="border-border bg-input text-foreground"
              required={formData.contentType === "text"}
              disabled={isLoading}
              rows={5}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-foreground">Schedule Date</Label>
          <Input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            className="border-border bg-input text-foreground"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.title.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : lesson ? "Update Lesson" : "Create Lesson"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
