"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TermForm } from "./term-form"
import { LessonForm } from "./lesson-form"
import type { Program, Term, Lesson } from "@/lib/api-client"
import { AlertCircle, Trash2, Edit2 } from "lucide-react"

interface ProgramEditorProps {
  program: Program
  onUpdate: (program: Program) => void
}

export function ProgramEditor({ program, onUpdate }: ProgramEditorProps) {
  const [editedProgram, setEditedProgram] = useState(program)
  const [terms, setTerms] = useState<Term[]>(program.terms || [])
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(terms[0] || null)
  const [lessons, setLessons] = useState<Lesson[]>(selectedTerm?.lessons || [])
  const [showTermForm, setShowTermForm] = useState(false)
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectTerm = (term: Term) => {
    setSelectedTerm(term)
    setLessons(term.lessons || [])
    setEditingLesson(null)
    setShowLessonForm(false)
  }

  const handleProgramUpdate = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      await fetch(`/api/programs/${program.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(editedProgram),
      })
      onUpdate(editedProgram)
    } catch (error) {
      console.error("Failed to update program:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTerm = async (data: Partial<Term>) => {
    setIsLoading(true)
    try {
      const newTerm: Term = {
        id: `term-${Date.now()}`,
        title: data.title || "",
        description: data.description,
        programId: program.id,
        order: terms.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedTerms = [...terms, newTerm]
      setTerms(updatedTerms)
      setEditedProgram({ ...editedProgram, terms: updatedTerms })
      setShowTermForm(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTerm = (termId: string) => {
    const updatedTerms = terms.filter((t) => t.id !== termId)
    setTerms(updatedTerms)
    setEditedProgram({ ...editedProgram, terms: updatedTerms })
    if (selectedTerm?.id === termId) {
      setSelectedTerm(updatedTerms[0] || null)
      setLessons(updatedTerms[0]?.lessons || [])
    }
  }

  const handleCreateLesson = async (data: Partial<Lesson>) => {
    if (!selectedTerm) return

    setIsLoading(true)
    try {
      const newLesson: Lesson = {
        id: `lesson-${Date.now()}`,
        title: data.title || "",
        description: data.description,
        termId: selectedTerm.id,
        content: data.content || { type: "video" },
        order: lessons.length,
        scheduledDate: data.scheduledDate,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedLessons = [...lessons, newLesson]
      setLessons(updatedLessons)

      // Update term with new lessons
      const updatedTerms = terms.map((t) => (t.id === selectedTerm.id ? { ...t, lessons: updatedLessons } : t))
      setTerms(updatedTerms)
      setEditedProgram({ ...editedProgram, terms: updatedTerms })
      setSelectedTerm({ ...selectedTerm, lessons: updatedLessons })
      setShowLessonForm(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLesson = (lessonId: string) => {
    const updatedLessons = lessons.filter((l) => l.id !== lessonId)
    setLessons(updatedLessons)

    if (selectedTerm) {
      const updatedTerms = terms.map((t) => (t.id === selectedTerm.id ? { ...t, lessons: updatedLessons } : t))
      setTerms(updatedTerms)
      setEditedProgram({ ...editedProgram, terms: updatedTerms })
      setSelectedTerm({ ...selectedTerm, lessons: updatedLessons })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="program" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary border-b border-border">
          <TabsTrigger value="program" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Program
          </TabsTrigger>
          <TabsTrigger value="terms" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Terms
          </TabsTrigger>
          <TabsTrigger value="lessons" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Lessons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="mt-6">
          <Card className="border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Program Details</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Title</Label>
                <Input
                  value={editedProgram.title}
                  onChange={(e) => setEditedProgram({ ...editedProgram, title: e.target.value })}
                  className="border-border bg-input text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Description</Label>
                <textarea
                  value={editedProgram.description}
                  onChange={(e) => setEditedProgram({ ...editedProgram, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-input text-foreground"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Display Image URL</Label>
                  <Input
                    type="url"
                    value={editedProgram.displayImage || ""}
                    onChange={(e) => setEditedProgram({ ...editedProgram, displayImage: e.target.value })}
                    className="border-border bg-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Background Image URL</Label>
                  <Input
                    type="url"
                    value={editedProgram.backgroundImage || ""}
                    onChange={(e) => setEditedProgram({ ...editedProgram, backgroundImage: e.target.value })}
                    className="border-border bg-input text-foreground"
                  />
                </div>
              </div>

              <Button
                onClick={handleProgramUpdate}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? "Saving..." : "Save Program"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="mt-6 space-y-4">
          {showTermForm ? (
            <TermForm
              term={editingTerm || undefined}
              onSubmit={handleCreateTerm}
              isLoading={isLoading}
              onCancel={() => {
                setShowTermForm(false)
                setEditingTerm(null)
              }}
            />
          ) : (
            <Button
              onClick={() => setShowTermForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create New Term
            </Button>
          )}

          <div className="space-y-3">
            {terms.length === 0 ? (
              <Card className="border-border bg-card p-6 text-center">
                <p className="text-muted-foreground">No terms yet. Create one to get started.</p>
              </Card>
            ) : (
              terms.map((term, idx) => (
                <Card
                  key={term.id}
                  className={`border-2 transition-colors p-4 cursor-pointer ${
                    selectedTerm?.id === term.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => handleSelectTerm(term)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Term {idx + 1}: {term.title}
                      </p>
                      {term.description && <p className="text-sm text-muted-foreground mt-1">{term.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{term.lessons?.length || 0} lessons</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTerm(term)
                          setShowTermForm(true)
                        }}
                        className="border-border text-foreground hover:bg-secondary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTerm(term.id)
                        }}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="mt-6 space-y-4">
          {!selectedTerm ? (
            <Card className="border-border bg-card p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-5 h-5" />
                <p>Select a term first to add lessons</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Lessons for: {selectedTerm.title}</h3>
                  <p className="text-sm text-muted-foreground">Create and manage lessons in this term</p>
                </div>
              </div>

              {showLessonForm ? (
                <LessonForm
                  lesson={editingLesson || undefined}
                  onSubmit={handleCreateLesson}
                  isLoading={isLoading}
                  onCancel={() => {
                    setShowLessonForm(false)
                    setEditingLesson(null)
                  }}
                />
              ) : (
                <Button
                  onClick={() => setShowLessonForm(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create New Lesson
                </Button>
              )}

              <div className="space-y-3">
                {lessons.length === 0 ? (
                  <Card className="border-border bg-card p-6 text-center">
                    <p className="text-muted-foreground">No lessons yet in this term.</p>
                  </Card>
                ) : (
                  lessons.map((lesson, idx) => (
                    <Card key={lesson.id} className="border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {idx + 1}. {lesson.title}
                          </p>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                              {lesson.content.type}
                            </span>
                            {lesson.scheduledDate && (
                              <span className="text-xs px-2 py-1 bg-secondary rounded text-foreground">
                                {new Date(lesson.scheduledDate).toLocaleDateString()}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                lesson.isPublished
                                  ? "bg-green-500/20 text-green-700"
                                  : "bg-yellow-500/20 text-yellow-700"
                              }`}
                            >
                              {lesson.isPublished ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLesson(lesson)
                              setShowLessonForm(true)
                            }}
                            className="border-border text-foreground hover:bg-secondary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="border-destructive text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
