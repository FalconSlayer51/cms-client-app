"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCatalogTermLessons, getLessonAssets } from "@/lib/api-client";
import type { LessonCatalogResponse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { useRouter } from "next/navigation";
type AssetType = "video" | "image" | "other";

function getAssetType(url: string): AssetType {
  const ext = url.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (["mp4", "webm", "ogg"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) return "image";
  return "other";
}

export default function LessonViewPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [lesson, setLesson] = useState<LessonCatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [termId, setTermId] = useState<string>("");
  const [assets, setAssets] = useState<string[]>([]);

  useEffect(() => {
    // Try to get termId from query params if available
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const tid = searchParams?.get("termId") || "";
    setTermId(tid);
  }, []);

  useEffect(() => {
    async function fetchLesson() {
      if (!termId) return;
      setIsLoading(true);
      try {
        const lessons = await getCatalogTermLessons(termId);
        const found = lessons.find((l) => l.id === id) || null;
        setLesson(found);
        if (found) {
          // Fetch assets for this lesson
          const assetRes = await getLessonAssets(found.id);
          console.log("Fetched lesson assets:", assetRes);
          setAssets(assetRes.url || []);
        } else {
          setAssets([]);
        }
      } catch (error) {
        setLesson(null);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLesson();
  }, [id, termId]);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading lesson...</div>
          ) : !lesson ? (
            <div className="text-center text-muted-foreground">Lesson not found</div>
          ) : (
            <Card className="border border-border bg-card p-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">{lesson.title}</h1>
              <p className="mb-4 text-muted-foreground">Lesson #{lesson.lessonNumber}</p>
              <div className="mb-4">
                {lesson.isPaid && (
                  <span className="text-xs text-primary font-semibold">Paid Lesson</span>
                )}
                <span className="ml-2 text-xs text-muted-foreground">
                  Published at: {lesson.publishedAt ? new Date(lesson.publishedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              {/* Render lesson assets */}
              {assets.length > 0 && (
                <div className="mb-6 space-y-4">
                  {assets.map((url, idx) => {
                    const type = getAssetType(url);
                    if (type === "video") {
                      return (
                        <video key={idx} controls className="w-full rounded border border-border">
                          <source src={url} />
                          Your browser does not support the video tag.
                        </video>
                      );
                    }
                    if (type === "image") {
                      return (
                        <img key={idx} src={url} alt={`Lesson asset ${idx + 1}`} className="w-full rounded border border-border" />
                      );
                    }
                    return (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        Download asset {idx + 1}
                      </a>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" onClick={() => router.push("/programs")}>Back to Program</Button>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
