"use client";

import { useEffect, useState } from "react";
import { getCatalogProgramTerms, getCatalogTermLessons, getCatalogProgram } from "@/lib/api-client";
import { useParams } from "next/navigation";
import type { TermCatalogResponse, LessonCatalogResponse, ProgramCatalogResponse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";

export default function ProgramViewPage() {
  const router = useRouter();
  const params = useParams();
  console.log(params);
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [program, setProgram] = useState<ProgramCatalogResponse | null>(null);
  const [terms, setTerms] = useState<TermCatalogResponse[]>([]);
  const [lessonsByTerm, setLessonsByTerm] = useState<Record<string, LessonCatalogResponse[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const programData = await getCatalogProgram(id);
        setProgram(programData);
        const termsData = await getCatalogProgramTerms(id);
        setTerms(termsData);
        const lessonsPromises = termsData.map(term => getCatalogTermLessons(term.id));
        const lessonsResults = await Promise.all(lessonsPromises);
        const lessonsMap: Record<string, LessonCatalogResponse[]> = {};
        termsData.forEach((term, idx) => {
          lessonsMap[term.id] = lessonsResults[idx];
        });
        setLessonsByTerm(lessonsMap);
      } catch (error) {
        // Handle error (could show fallback UI)
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading program...</div>
          ) : !program ? (
            <div className="text-center text-muted-foreground">Program not found</div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">{program.title}</h1>
              <p className="mb-6 text-muted-foreground">{program.description}</p>
              {terms.length === 0 ? (
                <div className="text-muted-foreground">No sections found.</div>
              ) : (
                <div className="space-y-6">
                  {terms.map((term) => (
                    <Card key={term.id} className="border border-border bg-card">
                      <div className="p-4">
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          Section {term.termNumber}: {term.title}
                        </h2>
                        {lessonsByTerm[term.id]?.length ? (
                          <ul className="space-y-2">
                            {lessonsByTerm[term.id].map((lesson) => (
                              <li key={lesson.id} className="flex items-center justify-between rounded bg-secondary px-3 py-2">
                                <div>
                                  <span className="font-medium text-foreground">Lesson {lesson.lessonNumber}: {lesson.title}</span>
                                  {lesson.isPaid && (
                                    <span className="ml-2 text-xs text-primary font-semibold">Paid</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/lessons/${lesson.id}?termId=${term.id}`)}
                                >
                                  View
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted-foreground">No lessons in this section.</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}