"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CreateProgramRequest,
  ProgramResponse,
  CreateTermRequest,
  TermResponse,
  CreateLessonRequest,
  LessonResponse,
} from "@/lib/types";

export interface ProgramWizardTabsProps {
  mode: "create" | "edit";
  initialProgram?: ProgramResponse | null;
  initialTerms?: TermResponse[];
  initialLessonsByTerm?: Record<string, LessonResponse[]>;
  onSaveProgram: (data: Partial<CreateProgramRequest>) => Promise<void>;
  onAddTerm: (data: CreateTermRequest) => Promise<void>;
  onEditTerm: (termId: string, data: CreateTermRequest) => Promise<void>;
  onAddLesson: (termId: string, data: CreateLessonRequest) => Promise<void>;
  onPublish: () => Promise<void>;
  onSchedule: (date: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  disableImageTab?: boolean;
}

export function ProgramWizardTabs({
  mode,
  initialProgram,
  initialTerms = [],
  initialLessonsByTerm = {},
  onSaveProgram,
  onAddTerm,
  onEditTerm,
  onAddLesson,
  onPublish,
  onSchedule,
  loading,
  error,
  disableImageTab,
}: ProgramWizardTabsProps) {
  const [tab, setTab] = useState("program");
  const [programData, setProgramData] = useState(() => ({
    title: initialProgram?.title || "",
    description: initialProgram?.description || "",
    languagePrimary: (initialProgram as any)?.languagePrimary || (initialProgram as any)?.language_primary || "",
    languagesAvailable: (initialProgram as any)?.languagesAvailable || (initialProgram as any)?.languages_available || [],
    faq: (initialProgram as any)?.faq || "",
  }));

  // Keep programData in sync with initialProgram (for edit mode)
  useEffect(() => {
    setProgramData({
      title: initialProgram?.title || "",
      description: initialProgram?.description || "",
      languagePrimary: (initialProgram as any)?.languagePrimary || (initialProgram as any)?.language_primary || "",
      languagesAvailable: (initialProgram as any)?.languagesAvailable || (initialProgram as any)?.languages_available || [],
      faq: (initialProgram as any)?.faq || "",
    });
  }, [initialProgram]);
  const [terms, setTerms] = useState<TermResponse[]>(initialTerms);
  const [termForm, setTermForm] = useState<CreateTermRequest>({
    termNumber: 1,
    title: "",
  });
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [lessonsByTerm, setLessonsByTerm] = useState<Record<string, LessonResponse[]>>(initialLessonsByTerm);
  const [lessonForms, setLessonForms] = useState<Record<string, CreateLessonRequest>>({});
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [publishError, setPublishError] = useState("");

  // Sync terms/lessons if props change (edit mode)
  useEffect(() => {
    setTerms(initialTerms);
    setLessonsByTerm(initialLessonsByTerm);
  }, [initialTerms, initialLessonsByTerm]);

  // --- Handlers ---
  const handleSaveProgram = async () => {
    await onSaveProgram({ ...programData });
    // Do not change tab on save in edit mode
    if (mode === "create") setTab(disableImageTab ? "terms" : "image");
  };
  const handleAddTerm = async () => {
    await onAddTerm({ ...termForm });
    setTermForm({ termNumber: termForm.termNumber + 1, title: "" });
  };
  const handleEditTerm = async () => {
    if (!editingTermId) return;
    await onEditTerm(editingTermId, { ...termForm });
    setEditingTermId(null);
    setTermForm({ termNumber: termForm.termNumber, title: "" });
  };
  const handleAddLesson = async (termId: string) => {
    const form = lessonForms[termId] || {
      lessonNumber: 1,
      title: "",
      contentType: "video",
      durationMs: 0,
      isPaid: false,
      contentLanguagePrimary: "en",
      contentLanguagesAvailable: [],
      contentUrlsByLanguage: { en: "https://example.com/video.mp4" },
    };
    await onAddLesson(termId, { ...form });
    setLessonForms((prev) => ({
      ...prev,
      [termId]: {
        lessonNumber: form.lessonNumber + 1,
        title: "",
        contentType: "video",
        durationMs: 0,
        isPaid: false,
        contentLanguagePrimary: "en",
        contentLanguagesAvailable: [],
        contentUrlsByLanguage: { en: "https://example.com/video.mp4" },
      },
    }));
  };
  const handlePublish = async () => {
    setPublishSuccess("");
    setPublishError("");
    try {
      await onPublish();
      setPublishSuccess("Program published successfully.");
    } catch (err: any) {
      setPublishError(err.message || "Failed to publish program.");
    }
  };
  const handleSchedule = async (date: string) => {
    setPublishSuccess("");
    setPublishError("");
    try {
      await onSchedule(date);
      setPublishSuccess("Program scheduled for publication.");
    } catch (err: any) {
      setPublishError(err.message || "Failed to schedule program.");
    }
  };

  return (
    <>
      <div className="flex items-center mb-8 gap-4">
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">1</span> Program Details
          <span className="mx-2">›</span>
          {!disableImageTab && <><span>2</span> Upload Image<span className="mx-2">›</span></>}
          <span>{disableImageTab ? 2 : 3}</span> Terms & Lessons
          <span className="mx-2">›</span>
          <span>{disableImageTab ? 3 : 4}</span> Review & Publish
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="program">Program Details</TabsTrigger>
          {!disableImageTab && (
            <TabsTrigger value="image" disabled={mode === "create" ? !initialProgram : true}>
              Upload Image
            </TabsTrigger>
          )}
          <TabsTrigger value="terms">
            Terms & Lessons
          </TabsTrigger>
          <TabsTrigger value="review">
            Review & Publish
          </TabsTrigger>
        </TabsList>

        {/* Program Details Tab */}
        <TabsContent value="program">
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">Course Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-medium mb-2" htmlFor="title">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="e.g. Introduction to Data Analysis"
                  value={programData.title}
                  onChange={(e) => setProgramData({ ...programData, title: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-2" htmlFor="languagePrimary">
                  Primary Language
                </label>
                <Input
                  id="languagePrimary"
                  placeholder="e.g. English"
                  value={programData.languagePrimary ?? ""}
                  onChange={(e) => setProgramData({ ...programData, languagePrimary: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-2" htmlFor="languagesAvailable">
                  Languages Available (comma separated)
                </label>
                <Input
                  id="languagesAvailable"
                  placeholder="e.g. English, Spanish"
                  value={Array.isArray(programData.languagesAvailable) ? programData.languagesAvailable.join(", ") : ""}
                  onChange={(e) => setProgramData({ ...programData, languagesAvailable: e.target.value.split(",").map((s) => s.trim()) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block font-medium mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full border rounded p-2"
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe your course..."
                  value={programData.description ?? ""}
                  onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                  disabled={loading}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {(programData.description ?? "").length}/2000 characters
                </div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block font-medium mb-2" htmlFor="faq">
                Frequently Asked Questions
              </label>
              <Input
                id="faq"
                placeholder="e.g. Do you offer 1 on 1 calls"
                value={programData.faq ?? ""}
                onChange={(e) => setProgramData({ ...programData, faq: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline">Save as draft</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleSaveProgram} disabled={loading}>
                {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Save & Continue"}
              </Button>
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </Card>
        </TabsContent>

        {/* Upload Image Tab (only for create) */}
        {!disableImageTab && (
          <TabsContent value="image">
            <Card className="p-8 flex flex-col items-center justify-center border-dashed border-2 border-border min-h-55 w-full">
              <div className="text-muted-foreground">Image upload is only available during program creation.</div>
            </Card>
          </TabsContent>
        )}

        {/* Terms & Lessons Tab */}
        <TabsContent value="terms">
          <Card className="p-8">
            <h2 className="text-lg font-bold mb-4">Create Terms & Lessons</h2>
            <div className="space-y-4">
              <Input
                placeholder="Term Number"
                type="number"
                value={termForm.termNumber}
                onChange={(e) => setTermForm({ ...termForm, termNumber: Number(e.target.value) })}
                disabled={loading}
              />
              <Input
                placeholder="Term Title"
                value={termForm.title}
                onChange={(e) => setTermForm({ ...termForm, title: e.target.value })}
                disabled={loading}
              />
              {editingTermId ? (
                <Button className="mt-2" onClick={handleEditTerm} disabled={loading}>
                  {loading ? "Updating..." : "Update Term"}
                </Button>
              ) : (
                <Button className="mt-2" onClick={handleAddTerm} disabled={loading}>
                  {loading ? "Adding..." : "Add Term"}
                </Button>
              )}
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </div>
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Existing Terms & Lessons</h3>
              {terms.length === 0 ? (
                <div className="text-muted-foreground">No terms added yet.</div>
              ) : (
                <ul className="space-y-4">
                  {terms.map((term) => (
                    <li key={term.id} className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <span>
                          Term {term.termNumber}: {term.title}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTermId(term.id!);
                            setTermForm({
                              termNumber: term.termNumber ?? 1,
                              title: term.title,
                            });
                            setSelectedTermId(term.id!);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      {/* Lessons for this term */}
                      <div className="mt-2 ml-4">
                        <h4 className="font-semibold mb-2">Lessons</h4>
                        {(!lessonsByTerm[term.id!] || lessonsByTerm[term.id!].length === 0) ? (
                          <div className="text-muted-foreground">No lessons yet.</div>
                        ) : (
                          <ul className="space-y-2">
                            {(lessonsByTerm[term.id!] ?? []).map((lesson) => (
                              <li key={lesson.id} className="flex items-center justify-between">
                                <span>
                                  Lesson {lesson.lessonNumber}: {lesson.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {/* Lesson creation form (per term) */}
                        <div className="mt-4">
                          {(() => {
                            const lessonForm = lessonForms[term.id!] || {
                              lessonNumber: 1,
                              title: "",
                              contentType: "video",
                              durationMs: 0,
                              isPaid: false,
                              contentLanguagePrimary: "en",
                              contentLanguagesAvailable: [],
                              contentUrlsByLanguage: { en: "https://example.com/video.mp4" },
                            };
                            return (
                              <>
                                <Input
                                  placeholder="Lesson Number"
                                  type="number"
                                  value={lessonForm.lessonNumber}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, lessonNumber: Number(e.target.value) } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Lesson Title"
                                  value={lessonForm.title}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, title: e.target.value } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Content Type (video/article)"
                                  value={lessonForm.contentType}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, contentType: e.target.value as 'video' | 'article' } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Duration (ms)"
                                  type="number"
                                  value={lessonForm.durationMs}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, durationMs: Number(e.target.value) } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Primary Language"
                                  value={lessonForm.contentLanguagePrimary}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, contentLanguagePrimary: e.target.value } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Languages Available (comma separated)"
                                  value={lessonForm.contentLanguagesAvailable.join(", ")}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, contentLanguagesAvailable: e.target.value.split(",").map((s) => s.trim()) } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Paid (true/false)"
                                  value={lessonForm.isPaid ? "true" : "false"}
                                  onChange={(e) => setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, isPaid: e.target.value === 'true' } }))}
                                  disabled={loading}
                                />
                                <Input
                                  placeholder="Content URLs by Language (JSON)"
                                  value={JSON.stringify(lessonForm.contentUrlsByLanguage)}
                                  onChange={(e) => {
                                    try {
                                      setLessonForms((prev) => ({ ...prev, [term.id!]: { ...lessonForm, contentUrlsByLanguage: JSON.parse(e.target.value) } }));
                                    } catch {}
                                  }}
                                  disabled={loading}
                                />
                                <Button className="mt-2" onClick={() => handleAddLesson(term.id!)} disabled={loading || !lessonForm.title}>
                                  {loading ? "Adding..." : "Add Lesson"}
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Review & Publish Tab */}
        <TabsContent value="review">
          <Card className="p-8">
            <h2 className="text-lg font-bold mb-4">Review & Publish</h2>
            {!initialProgram ? (
              <div className="text-muted-foreground">Create a program first.</div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold">Program</h3>
                  <div><strong>Title:</strong> {initialProgram.title}</div>
                  <div><strong>Description:</strong> {initialProgram.description}</div>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold">Terms & Lessons</h3>
                  {terms.length === 0 ? (
                    <div className="text-muted-foreground">No terms added.</div>
                  ) : (
                    <ul className="space-y-2">
                      {terms.map((term) => (
                        <li key={term.id}>
                          <div><strong>Term {term.termNumber}:</strong> {term.title}</div>
                          <ul className="ml-4">
                            {(lessonsByTerm[term.id!] ?? []).length === 0 ? (
                              <li className="text-muted-foreground">No lessons.</li>
                            ) : (
                              (lessonsByTerm[term.id!] ?? []).map((lesson) => (
                                <li key={lesson.id}>
                                  <div><strong>Lesson {lesson.lessonNumber}:</strong> {lesson.title}</div>
                                </li>
                              ))
                            )}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold">Publish Actions</h3>
                  <Button onClick={handlePublish} disabled={loading}>
                    {loading ? "Publishing..." : "Publish Now"}
                  </Button>
                  <div className="mt-2">
                    <label htmlFor="schedule-date" className="mr-2">Schedule Publish:</label>
                    <input id="schedule-date" type="datetime-local" onChange={(e) => handleSchedule(e.target.value)} disabled={loading} />
                  </div>
                  {publishError && <div className="text-red-500 text-sm mt-2">{publishError}</div>}
                  {publishSuccess && <div className="text-green-600 text-sm mt-2">{publishSuccess}</div>}
                </div>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
