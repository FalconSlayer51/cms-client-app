"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  
  const router = useRouter();
  const [iso, setIso] = useState("");
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
  } = require("@/lib/api-client"); // Only use what is needed, but keep for now for future-proofing
  const { user, token } = useAuth();
  const [tab, setTab] = useState("program");
  const [programData, setProgramData] = useState<CreateProgramRequest>({
    title: "",
    description: "",
    languagePrimary: "",
    languagesAvailable: [],
    faq: "",
  });
  // --- Handlers ---
  async function fetchTermsAndLessons() {
    if (!program) return;
    try {
      const res = await getTerms(program.id!, token!);
      setTerms(res);
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
      await createTerm(program.id!, termForm, token!);
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

  async function handleAddLesson(termId: string) {
    setLoading(true);
    setError("");
    try {
      const lessonRes = await createLesson(termId, lessonForm, token!);
      if (lessonAssetFile) {
        const presign = await presignLessonAsset(
          lessonRes.id!,
          {
            assetType: "poster",
            variant: "portrait",
            language: lessonForm.contentLanguagePrimary,
            fileName: lessonAssetFile.name,
            contentType: lessonAssetFile.type,
          },
          token!
        );
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
        contentUrlsByLanguage: { en: "https://example.com/video.mp4" },
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

  async function handlePublishProgram() {
    if (!program) return;
    setPublishing(true);
    setPublishError("");
    setPublishSuccess("");
    try {
      const res = await publishProgram(program.id!, token!);
      // If the API returns nothing but status 200, treat as success
      setPublishSuccess("Program published successfully.");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      console.log(err);
      setPublishError(err.message || "Failed to publish program.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleScheduleProgram() {
    if (!program) return;
    setPublishing(true);
    setPublishError("");
    setPublishSuccess("");
    try {
      await scheduleProgram(program.id, iso, token!);
      setPublishSuccess("Program scheduled for publication.");
      setTimeout(async () => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setPublishError(err.message || "Failed to schedule program.");
    } finally {
      setPublishing(false);
    }
  }
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [portraitImageFile, setPortraitImageFile] = useState<File | null>(null);
  const [portraitImageUrl, setPortraitImageUrl] = useState<string>("");
  const [landscapeImageFile, setLandscapeImageFile] = useState<File | null>(null);
  const [landscapeImageUrl, setLandscapeImageUrl] = useState<string>("");
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
    contentLanguagePrimary: "en",
    contentLanguagesAvailable: [],
    contentUrlsByLanguage: { en: "https://example.com/video.mp4" },
  });
  const [lessonAssetFile, setLessonAssetFile] = useState<File | null>(null);
  const [lessonAssetUrl, setLessonAssetUrl] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");

  // Only allow admin to create (robust, best practice)
  if (
    !user ||
    typeof user.role !== "string" ||
    user.role.toLowerCase() !== "admin"
  ) {
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

  async function handleCreateProgram() {
    setLoading(true);
    setError("");
    try {
      const res = await createProgram(programData, token!);
      console.log("Created program:", res.id);
      if (res && res.id) {
        // Optionally, fetch the full program details if needed
        setProgram(res.id ? res : null);
        setTab("image");
      } else {
        setError("Failed to create program: No ID returned.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create program.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePortraitImageUpload() {
    if (!portraitImageFile || !program || !program.id) return;
    setLoading(true);
    setError("");
    try {
      const presign = await presignProgramAsset(
        program.id,
        {
          assetType: "poster",
          variant: "portrait",
          language: "en",
          fileName: portraitImageFile.name,
          contentType: portraitImageFile.type,
        },
        token!
      );
      if (presign.uploadUrl) {
        await fetch(presign.uploadUrl, {
          method: "PUT",
          body: portraitImageFile,
          headers: { "Content-Type": portraitImageFile.type },
        });
      }
      setPortraitImageUrl(presign.publicUrl ?? "");
    } catch (err: any) {
      setError(err.message || "Portrait image upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLandscapeImageUpload() {
    if (!landscapeImageFile || !program || !program.id) return;
    setLoading(true);
    setError("");
    try {
      const presign = await presignProgramAsset(
        program.id,
        {
          assetType: "poster",
          variant: "landscape",
          language: "en",
          fileName: landscapeImageFile.name,
          contentType: landscapeImageFile.type,
        },
        token!
      );
      if (presign.uploadUrl) {
        await fetch(presign.uploadUrl, {
          method: "PUT",
          body: landscapeImageFile,
          headers: { "Content-Type": landscapeImageFile.type },
        });
      }
      setLandscapeImageUrl(presign.publicUrl ?? "");
    } catch (err: any) {
      setError(err.message || "Landscape image upload failed.");
    } finally {
      setLoading(false);
    }
  }
  // --- Unified UI: Modern layout + full CMS tabbed flow ---
  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl py-8">
        {/* Stepper Navigation */}
        <div className="flex items-center mb-8 gap-4">
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">1</span> Program
            Details
            <span className="mx-2">›</span>
            <span>2</span> Upload Image
            <span className="mx-2">›</span>
            <span>3</span> Terms & Lessons
            <span className="mx-2">›</span>
            <span>4</span> Review & Publish
          </div>
          <Button variant="outline" className="ml-auto">
            Preview
          </Button>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="program">Program Details</TabsTrigger>
            <TabsTrigger value="image" disabled={!program}>
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="terms" disabled={!portraitImageUrl || !landscapeImageUrl}>
              Terms & Lessons
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!portraitImageUrl || !landscapeImageUrl}>
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
                {/* Only one FAQ field supported by API */}
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline">Save as draft</Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={handleCreateProgram}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Upload Image Tab */}
          <TabsContent value="image">
            <Card className="p-8 flex flex-col items-center justify-center border-dashed border-2 border-border min-h-55 w-full">
              <div className="w-full flex flex-col md:flex-row gap-8">
                {/* Portrait (DP) Image */}
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="font-semibold mb-2">Portrait Image (DP)</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPortraitImageFile(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="mb-2"
                  />
                  <Button
                    onClick={handlePortraitImageUpload}
                    disabled={loading || !portraitImageFile}
                    className="mb-2"
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </Button>
                  {portraitImageUrl && (
                    <img
                      src={portraitImageUrl}
                      alt="Portrait"
                      className="w-full rounded border border-border mt-2"
                    />
                  )}
                </div>
                {/* Landscape (Cover) Image */}
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="font-semibold mb-2">Landscape Image (Cover)</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLandscapeImageFile(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="mb-2"
                  />
                  <Button
                    onClick={handleLandscapeImageUpload}
                    disabled={loading || !landscapeImageFile}
                    className="mb-2"
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </Button>
                  {landscapeImageUrl && (
                    <img
                      src={landscapeImageUrl}
                      alt="Landscape"
                      className="w-full rounded border border-border mt-2"
                    />
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Terms & Lessons Tab */}
          <TabsContent value="terms">
            <Card className="p-8">
              <h2 className="text-lg font-bold mb-4">Create Terms & Lessons</h2>
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
                                setLessonAssetFile(e.target.files?.[0] || null)
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

          {/* Review & Publish Tab */}
          <TabsContent value="review">
            <Card className="p-8">
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
                    <div>
                      <strong>Portrait Image:</strong>{" "}
                      {portraitImageUrl ? (
                        <img src={portraitImageUrl} alt="Portrait" className="h-16 inline-block mr-2" />
                      ) : (
                        "No portrait image uploaded."
                      )}
                      <strong>Landscape Image:</strong>{" "}
                      {landscapeImageUrl ? (
                        <img src={landscapeImageUrl} alt="Landscape" className="h-16 inline-block" />
                      ) : (
                        "No landscape image uploaded."
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
                    <Button
                      onClick={handlePublishProgram}
                      disabled={publishing}
                    >
                      {publishing ? "Publishing..." : "Publish Now"}
                    </Button>
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
                        onClick={async () => await handleScheduleProgram()}
                        disabled={publishing}
                      >
                        {publishing ? "Scheduling..." : "Schedule Now"}
                      </Button>
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
