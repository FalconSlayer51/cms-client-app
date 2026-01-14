"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import type {
  CreateProgramRequest,
  ProgramResponse,
  CreateTermRequest,
  TermResponse,
  CreateLessonRequest,
  LessonResponse,
} from "@/lib/types";

export default function CreateProgramPage() {
  const {
    createProgram,
    presignProgramAsset,
    createTerm,
    getTerms,
    updateTerm,
    getLessons,
    createLesson,
    presignLessonAsset,
    publishProgram,
    scheduleProgram,
  } = require("@/lib/api-client");
  const { user, token } = useAuth();
  const [tab, setTab] = useState("program");
  const [programData, setProgramData] = useState<CreateProgramRequest>({
    title: "",
    description: "",
    languagePrimary: "",
    languagesAvailable: [],
  });
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [termForm, setTermForm] = useState<CreateTermRequest>({
    termNumber: 1,
    title: "",
  });
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [lessonsByTerm, setLessonsByTerm] = useState<
    Record<string, LessonResponse[]>
  >({});
  const [lessonForm, setLessonForm] = useState<CreateLessonRequest>({
    lessonNumber: 1,
    title: "",
    contentType: "video",
    durationMs: 0,
    isPaid: false,
    contentLanguagePrimary: "",
    contentLanguagesAvailable: [],
    contentUrlsByLanguage: {},
  });
  const [lessonAssetFile, setLessonAssetFile] = useState<File | null>(null);
  const [lessonAssetUrl, setLessonAssetUrl] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");

  // Review/Publish logic
  // Only allow admin to create
  if (!user || user.role !== "admin") {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only admins can create programs.</p>
        </Card>
      </main>
    );
  }

  async function handleCreateProgram() {
    setLoading(true);
    setError("");
    try {
      const res = await createProgram(programData, token!);
      setProgram(res);
      setTab("image");
    } catch (err: any) {
      setError(err.message || "Failed to create program.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload() {
    if (!imageFile || !program) return;
    setLoading(true);
    setError("");
    try {
      // Get presigned URL
      const presign = await presignProgramAsset(program.id!, {
        assetType: "poster",
        variant: "portrait",
        language: "en",
        fileName: imageFile.name,
        contentType: imageFile.type,
      }, token!);
      // Upload to S3
      if (presign.uploadUrl) {
        await fetch(presign.uploadUrl, {
          method: "PUT",
          body: imageFile,
          headers: { "Content-Type": imageFile.type },
        });
      }
      setImageUrl(presign.publicUrl ?? "");
      setTab("terms");
    } catch (err: any) {
      setError(err.message || "Image upload failed.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch terms and lessons when program is created
  async function fetchTermsAndLessons() {
    if (!program) return;
    try {
      const res = await getTerms(program.id!, token!);
      setTerms(res);
      // Fetch lessons for each term
      const lessonsMap: Record<string, LessonResponse[]> = {};
      for (const term of res) {
        const lessons = await getLessons(term.id!, token!);
        lessonsMap[term.id!] = lessons;
      }
      setLessonsByTerm(lessonsMap);
    } catch (err: any) {
      setError(err.message || "Failed to fetch terms/lessons.");
    }
  }

  async function handleAddTerm() {
    if (!program) return;
    setLoading(true);
    setError("");
    try {
      const res = await createTerm(program.id!, termForm, token!);
      setTermForm({ termNumber: termForm.termNumber + 1, title: "" });
      await fetchTermsAndLessons();
    } catch (err: any) {
      setError(err.message || "Failed to add term.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditTerm() {
    if (!editingTermId) return;
    setLoading(true);
    setError("");
    try {
      await updateTerm(editingTermId, termForm, token!);
      setEditingTermId(null);
      setTermForm({ termNumber: termForm.termNumber, title: "" });
      await fetchTermsAndLessons();
    } catch (err: any) {
      setError(err.message || "Failed to update term.");
    } finally {
      setLoading(false);
    }
  }

  // When switching to terms tab, fetch terms and lessons
  function handleTabChange(nextTab: string) {
    setTab(nextTab);
    if (nextTab === "terms" && program) fetchTermsAndLessons();
  }

  // Lesson creation logic
  async function handleAddLesson(termId: string) {
    setLoading(true);
    setError("");
    try {
      // Create lesson
      const lessonRes = await createLesson(termId, lessonForm, token!);
      // Upload asset if provided
      if (lessonAssetFile) {
        const presign = await presignLessonAsset(lessonRes.id!, {
          assetType: "poster",
          variant: "portrait",
          language: lessonForm.contentLanguagePrimary,
          fileName: lessonAssetFile.name,
          contentType: lessonAssetFile.type,
        }, token!);
        if (presign.uploadUrl) {
          await fetch(presign.uploadUrl, {
            method: "PUT",
            body: lessonAssetFile,
            headers: { "Content-Type": lessonAssetFile.type },
          });
        }
        setLessonAssetUrl(presign.publicUrl ?? "");
      }
      setLessonForm({
        lessonNumber: lessonForm.lessonNumber + 1,
        title: "",
        contentType: "video",
        durationMs: 0,
        isPaid: false,
        contentLanguagePrimary: "",
        contentLanguagesAvailable: [],
        contentUrlsByLanguage: {},
      });
      setLessonAssetFile(null);
      setLessonAssetUrl("");
      await fetchTermsAndLessons();
    } catch (err: any) {
      setError(err.message || "Failed to add lesson.");
    } finally {
      setLoading(false);
    }
  }

  // Review/Publish logic
  const handlePublishProgram = async () => {
    if (!program) return;
    setPublishing(true);
    setPublishError("");
    setPublishSuccess("");
    try {
      await publishProgram(program.id!, token!);
      setPublishSuccess("Program published successfully.");
    } catch (err: any) {
      setPublishError(err.message || "Failed to publish program.");
    } finally {
      setPublishing(false);
    }
  };

  const handleScheduleProgram = async (date: string) => {
    if (!program) return;
    setPublishing(true);
    setPublishError("");
    setPublishSuccess("");
    try {
      await scheduleProgram(program.id!, date, token!);
      setPublishSuccess("Program scheduled for publication.");
    } catch (err: any) {
      setPublishError(err.message || "Failed to schedule program.");
    } finally {
      setPublishing(false);
    }
  };

    // ...existing code...

    // Only allow admin to create
    if (!user || user.role !== "admin") {
      return (
        <main className="bg-background min-h-screen flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only admins can create programs.
            </p>
          </Card>
        </main>
      );
    }

    // ...existing code...

    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-2xl py-8">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="program">Program Details</TabsTrigger>
              <TabsTrigger value="image" disabled={!program}>
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="terms" disabled={!imageUrl}>
                Create Terms
              </TabsTrigger>
              <TabsTrigger value="review" disabled={!imageUrl}>
                Review & Publish
              </TabsTrigger>
            </TabsList>

            <TabsContent value="program">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">Create Program</h2>
                <div className="space-y-4">
                  <Input
                    placeholder="Title"
                    value={programData.title}
                    onChange={(e) =>
                      setProgramData({ ...programData, title: e.target.value })
                    }
                    disabled={loading}
                  />
                  <Input
                    placeholder="Description"
                    value={programData.description}
                    onChange={(e) =>
                      setProgramData({
                        ...programData,
                        description: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                  <Input
                    placeholder="Primary Language"
                    value={programData.languagePrimary}
                    onChange={(e) =>
                      setProgramData({
                        ...programData,
                        languagePrimary: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                  <Input
                    placeholder="Languages Available (comma separated)"
                    value={programData.languagesAvailable?.join(", ") ?? ""}
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
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <Button
                    className="mt-4"
                    onClick={handleCreateProgram}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Program"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="image">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">Upload Program Image</h2>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}
                <Button
                  className="mt-4"
                  onClick={handleImageUpload}
                  disabled={loading || !imageFile}
                >
                  {loading ? "Uploading..." : "Upload Image"}
                </Button>
                {imageUrl && (
                  <div className="mt-4">
                    <img
                      src={imageUrl}
                      alt="Program poster"
                      className="w-full rounded border border-border"
                    />
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">
                  Create Terms & Lessons
                </h2>
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
                      onClick={handleEditTerm}
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Term"}
                    </Button>
                  ) : (
                    <Button
                      className="mt-2"
                      onClick={handleAddTerm}
                      disabled={loading}
                    >
                      {loading ? "Adding..." : "Add Term"}
                    </Button>
                  )}
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                </div>
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">
                    Existing Terms & Lessons
                  </h3>
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
                                {lessonsByTerm[term.id!].map((lesson) => (
                                  <li
                                    key={lesson.id}
                                    className="flex items-center justify-between"
                                  >
                                    <span>
                                      Lesson {lesson.lessonNumber}:{" "}
                                      {lesson.title}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {/* Lesson creation form */}
                            <div className="mt-4">
                              <Input
                                placeholder="Lesson Number"
                                type="number"
                                value={lessonForm.lessonNumber}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    lessonNumber: Number(e.target.value),
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Lesson Title"
                                value={lessonForm.title}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    title: e.target.value,
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Content Type (video/article)"
                                value={lessonForm.contentType}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    contentType: e.target.value as
                                      | "video"
                                      | "article",
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Duration (ms)"
                                type="number"
                                value={lessonForm.durationMs}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    durationMs: Number(e.target.value),
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Primary Language"
                                value={lessonForm.contentLanguagePrimary}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    contentLanguagePrimary: e.target.value,
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Languages Available (comma separated)"
                                value={lessonForm.contentLanguagesAvailable.join(
                                  ", "
                                )}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    contentLanguagesAvailable: e.target.value
                                      .split(",")
                                      .map((s) => s.trim()),
                                  })
                                }
                                disabled={loading}
                              />
                              <Input
                                placeholder="Paid (true/false)"
                                value={lessonForm.isPaid ? "true" : "false"}
                                onChange={(e) =>
                                  setLessonForm({
                                    ...lessonForm,
                                    isPaid: e.target.value === "true",
                                  })
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
                                    setLessonForm({
                                      ...lessonForm,
                                      contentUrlsByLanguage: JSON.parse(
                                        e.target.value
                                      ),
                                    });
                                  } catch {}
                                }}
                                disabled={loading}
                              />
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) =>
                                  setLessonAssetFile(
                                    e.target.files?.[0] || null
                                  )
                                }
                                disabled={loading}
                              />
                              <Button
                                className="mt-2"
                                onClick={() => handleAddLesson(term.id!)}
                                disabled={loading || !lessonForm.title}
                              >
                                {loading ? "Adding..." : "Add Lesson"}
                              </Button>
                              {lessonAssetUrl && (
                                <div className="mt-2">
                                  <span className="text-green-600">
                                    Asset uploaded!
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="review">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">Review & Publish</h2>
                {!program ? (
                  <div className="text-muted-foreground">
                    Create a program first.
                  </div>
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
                      {/* Languages and Paid fields not present in ProgramResponse, so omitted */}
                      <div>
                        <strong>Image:</strong>{" "}
                        {imageUrl ? (
                          <img src={imageUrl} alt="Program" className="h-16" />
                        ) : (
                          "No image uploaded."
                        )}
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
                                {lessonsByTerm[term.id!]?.length === 0 ? (
                                  <li className="text-muted-foreground">
                                    No lessons.
                                  </li>
                                ) : (
                                  lessonsByTerm[term.id!].map((lesson) => (
                                    <li key={lesson.id}>
                                      <div>
                                        <strong>
                                          Lesson {lesson.lessonNumber}:
                                        </strong>{" "}
                                        {lesson.title}
                                      </div>
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
                      <Button
                        onClick={handlePublishProgram}
                        disabled={publishing}
                      >
                        {publishing ? "Publishing..." : "Publish Now"}
                      </Button>
                      <div className="mt-2">
                        <label htmlFor="schedule-date" className="mr-2">
                          Schedule Publish:
                        </label>
                        <input
                          id="schedule-date"
                          type="datetime-local"
                          onChange={(e) =>
                            handleScheduleProgram(e.target.value)
                          }
                          disabled={publishing}
                        />
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

