"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { placeholderPrograms } from "@/lib/placeholder-data";
import { getCatalogPrograms } from "@/lib/api-client";
import type { ProgramCatalogResponse } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isLoading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<ProgramCatalogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      fetchPrograms();
    }
  }, [authLoading]);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      // Use the API client for public endpoint
      const response = await getCatalogPrograms();
      setPrograms(response);
    } catch (error) {
      console.error("API unavailable, using placeholder data", error);
      setPrograms(placeholderPrograms);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground">
              Learn from the best
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover educational programs created by industry experts
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-md">
              <Input
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-border bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Loading programs...
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No programs found
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program) => (
                <Card
                  key={program.id}
                  className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-accent"
                >
                  {/* No displayImage in OpenAPI response; remove image block */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {program.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {program.description}
                    </p>
                    <Button
                      className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      asChild
                      onClick={() => router.push(`/programs/${program.id}`)}
                    >
                      <p>View Program</p>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
