"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getPlaceholderProgramById } from "@/lib/placeholder-data";
import {
  getPrograms,
  updateProgram,
  getTerms,
  updateTerm,
  createTerm,
  getLessons,
  createLesson,
  publishProgram,
  scheduleProgram,
  presignLessonAsset,
} from "@/lib/api-client";
import type {
  CreateLessonRequest,
  CreateProgramRequest,
  CreateTermRequest,
  LessonResponse,
  ProgramResponse,
  TermResponse,
} from "@/lib/types";

export default function EditProgramPage() {
  const params = useParams();
  const router = useRouter();
  const { user, canEdit } = useAuth();
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("program");
  const [programData, setProgramData] = useState<CreateProgramRequest>({
    title: "",
    description: "",
    languagePrimary: "",
    languagesAvailable: [],
    faq: "",
  });
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [termForm, setTermForm] = useState<CreateTermRequest>({
    termNumber: 1,
    title: "",
  });
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [lessonsByTerm, setLessonsByTerm] = useState<
    Record<string, LessonResponse[]>
  >({});
  const [lessonForms, setLessonForms] = useState<
    Record<string, CreateLessonRequest>
  >({});
  const [lessonAssetFiles, setLessonAssetFiles] = useState<
    Record<string, File | null>
  >({});
  const [lessonAssetUrls, setLessonAssetUrls] = useState<
    Record<string, string>
  >({});
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [iso, setIso] = useState("");

  useEffect(() => {
    if (!canEdit()) {
      router.push("/dashboard");
      return;
    }
    fetchProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProgram = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      let found: ProgramResponse | null = null;
      try {
        const all = await getPrograms(token || "");
        found =
          (all || []).find((p: ProgramResponse) => p.id === params.id) || null;
      } catch (error) {
        console.log("API unavailable, using placeholder data");
        found = getPlaceholderProgramById(params.id as string) || null;
      }
      setProgram(found);
      if (found) {
        setProgramData({
          title: found.title || "",
          description: found.description || "",
          languagePrimary:
            (found as any).languagePrimary ||
            (found as any).language_primary ||
            "",
          languagesAvailable:
            (found as any).languagesAvailable ||
            (found as any).languages_available ||
            [],
          faq: (found as any).faq || "",
        });
        if (found.id) {
          const t = await getTerms(found.id, token || "");
          setTerms(t);
          const lessonsMap: Record<string, LessonResponse[]> = {};
          for (const term of t) {
            if (term.id) {
              lessonsMap[term.id] = await getLessons(term.id, token || "");
            }
          }
          setLessonsByTerm(lessonsMap);
        }
      }
    } catch (error) {
      console.error("Failed to fetch program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for wizard tabs

  async function handleSaveProgram() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const safeData: CreateProgramRequest = {
        title: programData.title,
        description: programData.description,
        languagePrimary: programData.languagePrimary,
        languagesAvailable: programData.languagesAvailable,
        faq: programData.faq,
      };
      const updated = await updateProgram(
        params.id as string,
        safeData,
        token || ""
      );
      setProgram(updated);
      setPublishSuccess("Program updated successfully.");
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to update program.");
      } else {
        setError("Failed to update program.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAddTerm = async (data: CreateTermRequest) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      await createTerm(params.id as string, data, token || "");
      await fetchProgram();
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to add term.");
      } else {
        setError("Failed to add term.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditTerm = async (termId: string, data: CreateTermRequest) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      await updateTerm(termId, data, token || "");
      await fetchProgram();
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to update term.");
      } else {
        setError("Failed to update term.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (termId: string, data: CreateLessonRequest) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      await createLesson(termId, data, token || "");
      await fetchProgram();
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to add lesson.");
      } else {
        setError("Failed to add lesson.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      await publishProgram(params.id!.toString(), token || "");
      await fetchProgram();
      router.push("/dashboard");
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to publish program.");
      } else {
        setError("Failed to publish program.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (date: string) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      await scheduleProgram(params.id!.toString(), iso, token || "");
      setTimeout(async () => {
        router.push("/dashboard");
      }, 1200);
      await fetchProgram();
    } catch (err) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as any).message || "Failed to schedule program.");
      } else {
        setError("Failed to schedule program.");
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleLessonAssetUpload(termId: string, lessonId: string) {
    const file = lessonAssetFiles[termId] || null;
    if (!file || !lessonId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      // You may need to implement presignLessonAsset in your API client
      const presign = await presignLessonAsset(
        lessonId,
        {
          assetType: "poster",
          variant: "portrait",
          language: lessonForms[termId]?.contentLanguagePrimary || "en",
          fileName: file.name,
          contentType: file.type,
        },
        token || ""
      );
      if (presign.uploadUrl) {
        await fetch(presign.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
      }
      setLessonAssetUrls((prev) => ({
        ...prev,
        [termId]: presign.publicUrl ?? "",
      }));
    } catch (err) {
      setError("Lesson image upload failed.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!program)
    return <div className="p-8 text-muted-foreground">Program not found</div>;

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl py-8">
        <div className="flex items-center mb-8 gap-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">1</span> Program
            Details
            <span className="mx-2">›</span>
            <span>2</span> Terms & Lessons
            <span className="mx-2">›</span>
            <span>3</span> Review & Publish
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="program">Program Details</TabsTrigger>
            <TabsTrigger value="terms">Terms & Lessons</TabsTrigger>
            <TabsTrigger value="review">Review & Publish</TabsTrigger>
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
                    onChange={(e) =>
                      setProgramData({ ...programData, title: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    htmlFor="languagePrimary"
                  >
                    Primary Language
                  </label>
                  <Input
                    id="languagePrimary"
                    placeholder="e.g. English"
                    value={programData.languagePrimary ?? ""}
                    onChange={(e) =>
                      setProgramData({
                        ...programData,
                        languagePrimary: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    htmlFor="languagesAvailable"
                  >
                    Languages Available (comma separated)
                  </label>
                  <Input
                    id="languagesAvailable"
                    placeholder="e.g. English, Spanish"
                    value={
                      Array.isArray(programData.languagesAvailable)
                        ? programData.languagesAvailable.join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setProgramData({
                        ...programData,
                        languagesAvailable: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    className="block font-medium mb-2"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="w-full border rounded p-2"
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe your course..."
                    value={programData.description ?? ""}
                    onChange={(e) =>
                      setProgramData({
                        ...programData,
                        description: e.target.value,
                      })
                    }
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
                  onChange={(e) =>
                    setProgramData({ ...programData, faq: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline">Save as draft</Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={handleSaveProgram}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
              {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
              )}
              {publishSuccess && (
                <div className="text-green-600 text-sm mt-2">
                  {publishSuccess}
                </div>
              )}
            </Card>
          </TabsContent>
          {/* Terms & Lessons Tab */}
          <TabsContent value="terms">
            <Card className="p-8">
              <h2 className="text-lg font-bold mb-4">Edit Terms & Lessons</h2>
              <div className="space-y-4">
                <Input
                  placeholder="Term Number"
                  type="number"
                  value={termForm.termNumber}
                  onChange={(e) =>
                    setTermForm({
                      ...termForm,
                      termNumber: Number(e.target.value),
                    })
                  }
                  disabled={loading}
                />
                <Input
                  placeholder="Term Title"
                  value={termForm.title}
                  onChange={(e) =>
                    setTermForm({ ...termForm, title: e.target.value })
                  }
                  disabled={loading}
                />
                {editingTermId ? (
                  <Button
                    className="mt-2"
                    onClick={() => handleEditTerm(editingTermId, termForm)}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Term"}
                  </Button>
                ) : (
                  <Button
                    className="mt-2"
                    onClick={() => handleAddTerm(termForm)}
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Term"}
                  </Button>
                )}
                {error && <div className="text-red-500 text-sm">{error}</div>}
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Existing Terms & Lessons</h3>
                {terms.length === 0 ? (
                  <div className="text-muted-foreground">
                    No terms added yet.
                  </div>
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
                          {lessonsByTerm[term.id!]?.length === 0 ? (
                            <div className="text-muted-foreground">
                              No lessons yet.
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {(lessonsByTerm[term.id!] ?? []).map((lesson) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center justify-between"
                                >
                                  <span>
                                    Lesson {lesson.lessonNumber}: {lesson.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {/* Lesson creation form */}
                          <div className="mt-4">
                            {(() => {
                              const lessonForm = lessonForms[term.id!] || {
                                lessonNumber: lessonsByTerm[term.id!]?.length
                                  ? Math.max(
                                      ...lessonsByTerm[term.id!].map(
                                        (l) => l.lessonNumber
                                      )
                                    ) + 1
                                  : 1,
                                title: "",
                                contentType: "video",
                                durationMs: 0,
                                isPaid: false,
                                contentLanguagePrimary: "en",
                                contentLanguagesAvailable: [],
                                contentUrlsByLanguage: {
                                  en: "https://example.com/video.mp4",
                                },
                              };
                              return (
                                <>
                                  <Input
                                    placeholder="Lesson Number"
                                    type="number"
                                    value={lessonForm.lessonNumber}
                                    onChange={(e) => {
                                      // Only update this term's lesson number
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          lessonNumber: Number(e.target.value),
                                        },
                                      }));
                                    }}
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Lesson Title"
                                    value={lessonForm.title}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          title: e.target.value,
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Content Type (video/article)"
                                    value={lessonForm.contentType}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          contentType: e.target.value as
                                            | "video"
                                            | "article",
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Duration (ms)"
                                    type="number"
                                    value={lessonForm.durationMs}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          durationMs: Number(e.target.value),
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Primary Language"
                                    value={lessonForm.contentLanguagePrimary}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          contentLanguagePrimary:
                                            e.target.value,
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Languages Available (comma separated)"
                                    value={lessonForm.contentLanguagesAvailable.join(
                                      ", "
                                    )}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          contentLanguagesAvailable:
                                            e.target.value
                                              .split(",")
                                              .map((s) => s.trim()),
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Paid (true/false)"
                                    value={lessonForm.isPaid ? "true" : "false"}
                                    onChange={(e) =>
                                      setLessonForms((prev) => ({
                                        ...prev,
                                        [term.id!]: {
                                          ...lessonForm,
                                          isPaid: e.target.value === "true",
                                        },
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Input
                                    placeholder="Content URLs by Language (JSON)"
                                    value={JSON.stringify(
                                      lessonForm.contentUrlsByLanguage
                                    )}
                                    onChange={(e) => {
                                      try {
                                        setLessonForms((prev) => ({
                                          ...prev,
                                          [term.id!]: {
                                            ...lessonForm,
                                            contentUrlsByLanguage: JSON.parse(
                                              e.target.value
                                            ),
                                          },
                                        }));
                                      } catch {}
                                    }}
                                    disabled={loading}
                                  />
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) =>
                                      setLessonAssetFiles((prev) => ({
                                        ...prev,
                                        [term.id!]: e.target.files?.[0] || null,
                                      }))
                                    }
                                    disabled={loading}
                                  />
                                  <Button
                                    className="mt-2"
                                    onClick={async () => {
                                      await handleAddLesson(
                                        term.id!,
                                        lessonForm
                                      );
                                      // After lesson is created, fetch lessons and upload asset if file exists
                                      if (lessonAssetFiles[term.id!]) {
                                        const token =
                                          localStorage.getItem("auth_token");
                                        const lessons = await getLessons(
                                          term.id!,
                                          token || ""
                                        );
                                        // Find the lesson with the highest lessonNumber (newly created)
                                        const newLesson = lessons.reduce(
                                          (max, l) =>
                                            l.lessonNumber >
                                            (max?.lessonNumber ?? 0)
                                              ? l
                                              : max,
                                          null
                                        );
                                        if (newLesson?.id) {
                                          await handleLessonAssetUpload(
                                            term.id!,
                                            newLesson.id
                                          );
                                        }
                                      }
                                    }}
                                    disabled={loading || !lessonForm.title}
                                  >
                                    {loading ? "Adding..." : "Add Lesson"}
                                  </Button>
                                  {lessonAssetUrls[term.id!] && (
                                    <div className="mt-2">
                                      <span className="text-green-600">
                                        Asset uploaded!
                                      </span>
                                    </div>
                                  )}
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
              {!program ? (
                <div className="text-muted-foreground">Program not loaded.</div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold">Program</h3>
                    <div>
                      <strong>Title:</strong> {program.title}
                    </div>
                    <div>
                      <strong>Description:</strong> {program.description}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold">Terms & Lessons</h3>
                    {terms.length === 0 ? (
                      <div className="text-muted-foreground">
                        No terms added.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {terms.map((term) => (
                          <li key={term.id}>
                            <div>
                              <strong>Term {term.termNumber}:</strong>{" "}
                              {term.title}
                            </div>
                            <ul className="ml-4">
                              {(lessonsByTerm[term.id!] ?? []).length === 0 ? (
                                <li className="text-muted-foreground">
                                  No lessons.
                                </li>
                              ) : (
                                (lessonsByTerm[term.id!] ?? []).map(
                                  (lesson) => (
                                    <li key={lesson.id}>
                                      <div>
                                        <strong>
                                          Lesson {lesson.lessonNumber}:
                                        </strong>{" "}
                                        {lesson.title}
                                      </div>
                                    </li>
                                  )
                                )
                              )}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold">Publish Actions</h3>
                    <Button onClick={handlePublish} disabled={publishing}>
                      {publishing ? "Publishing..." : "Publish Now"}
                    </Button>
                    <div className="mt-2">
                      <label htmlFor="schedule-date" className="mr-2">
                        Schedule Publishsadasdsa:
                      </label>
                      <input
                        id="schedule-date"
                        type="datetime-local"
                        onChange={(e) => {
                          const local = e.target.value; // 2026-01-14T16:59
                          if (!local) return;

                          const iso = new Date(local).toISOString(); // 2026-01-14T11:29:00.000Z
                          setIso(iso);
                        }}
                        disabled={publishing}
                      />
                      <Button
                        onClick={async () => await handleSchedule(iso)}
                        disabled={publishing}
                      >
                        {publishing ? "Scheduling..." : "Schedule Now"}
                      </Button>
                    </div>
                    {publishError && (
                      <div className="text-red-500 text-sm mt-2">
                        {publishError}
                      </div>
                    )}
                    {publishSuccess && (
                      <div className="text-green-600 text-sm mt-2">
                        {publishSuccess}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
