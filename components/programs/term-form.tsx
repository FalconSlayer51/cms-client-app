"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import type { Term } from "@/lib/api-client"

interface TermFormProps {
  term?: Term
  onSubmit: (data: Partial<Term>) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function TermForm({ term, onSubmit, isLoading = false, onCancel }: TermFormProps) {
  const [formData, setFormData] = useState({
    title: term?.title || "",
    description: term?.description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card className="border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">{term ? "Edit Term" : "Create New Term"}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-foreground">Term Title *</Label>
          <Input
            placeholder="e.g., Module 1: Foundations"
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
            placeholder="What will students learn in this term?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border-border bg-input text-foreground"
            disabled={isLoading}
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !formData.title.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : term ? "Update Term" : "Create Term"}
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
