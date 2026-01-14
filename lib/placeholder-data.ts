import type { Program, Term, Lesson } from "@/lib/api-client"

export const placeholderPrograms: Program[] = [
  {
    id: "prog-1",
    title: "Advanced React Patterns",
    description:
      "Master advanced React patterns including hooks, context, and performance optimization techniques used in production applications.",
    displayImage: "/react-course.jpg",
    backgroundImage: "/modern-tech-background.jpg",
    createdBy: "user-1",
    createdAt: new Date(2024, 0, 15).toISOString(),
    updatedAt: new Date(2024, 1, 20).toISOString(),
    terms: [
      {
        id: "term-1",
        title: "Fundamentals",
        description: "Learn the basics of React hooks and state management",
        programId: "prog-1",
        order: 0,
        createdAt: new Date(2024, 0, 15).toISOString(),
        updatedAt: new Date(2024, 0, 15).toISOString(),
        lessons: [
          {
            id: "lesson-1",
            title: "Introduction to Hooks",
            description: "Understanding useState, useEffect, and custom hooks",
            termId: "term-1",
            content: { type: "video", url: "https://example.com/video1.mp4" },
            order: 0,
            isPublished: true,
            scheduledDate: new Date(2024, 1, 1).toISOString(),
            createdAt: new Date(2024, 0, 15).toISOString(),
            updatedAt: new Date(2024, 0, 15).toISOString(),
          },
          {
            id: "lesson-2",
            title: "Custom Hooks Pattern",
            description: "Building reusable custom hooks for your applications",
            termId: "term-1",
            content: { type: "video", url: "https://example.com/video2.mp4" },
            order: 1,
            isPublished: true,
            scheduledDate: new Date(2024, 1, 5).toISOString(),
            createdAt: new Date(2024, 0, 16).toISOString(),
            updatedAt: new Date(2024, 0, 16).toISOString(),
          },
        ],
      },
      {
        id: "term-2",
        title: "Advanced Patterns",
        description: "Explore complex patterns for building scalable applications",
        programId: "prog-1",
        order: 1,
        createdAt: new Date(2024, 0, 20).toISOString(),
        updatedAt: new Date(2024, 0, 20).toISOString(),
        lessons: [
          {
            id: "lesson-3",
            title: "Render Props Pattern",
            description: "Advanced component composition using render props",
            termId: "term-2",
            content: { type: "video", url: "https://example.com/video3.mp4" },
            order: 0,
            isPublished: false,
            scheduledDate: new Date(2024, 2, 1).toISOString(),
            createdAt: new Date(2024, 0, 20).toISOString(),
            updatedAt: new Date(2024, 0, 20).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: "prog-2",
    title: "Next.js Full Stack Masterclass",
    description:
      "Build production-ready full-stack applications with Next.js 14, including server components, API routes, and deployment strategies.",
    displayImage: "/nextjs-course.jpg",
    backgroundImage: "/nextjs-tech-background.jpg",
    createdBy: "user-1",
    createdAt: new Date(2024, 1, 1).toISOString(),
    updatedAt: new Date(2024, 1, 10).toISOString(),
    terms: [
      {
        id: "term-3",
        title: "Foundations",
        description: "Core concepts of Next.js and app router",
        programId: "prog-2",
        order: 0,
        createdAt: new Date(2024, 1, 1).toISOString(),
        updatedAt: new Date(2024, 1, 1).toISOString(),
        lessons: [
          {
            id: "lesson-4",
            title: "App Router Basics",
            description: "Getting started with Next.js 14 app router",
            termId: "term-3",
            content: { type: "video", url: "https://example.com/video4.mp4" },
            order: 0,
            isPublished: true,
            scheduledDate: new Date(2024, 1, 5).toISOString(),
            createdAt: new Date(2024, 1, 1).toISOString(),
            updatedAt: new Date(2024, 1, 1).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: "prog-3",
    title: "TypeScript for Professionals",
    description:
      "Master TypeScript for building type-safe, scalable applications with best practices and real-world patterns.",
    displayImage: "/typescript-course.jpg",
    backgroundImage: "/typescript-background.jpg",
    createdBy: "user-1",
    createdAt: new Date(2024, 0, 10).toISOString(),
    updatedAt: new Date(2024, 1, 15).toISOString(),
    terms: [],
  },
]

export function getPlaceholderProgramById(id: string): Program | undefined {
  return placeholderPrograms.find((p) => p.id === id)
}

export function getPlaceholderTermsByProgramId(programId: string): Term[] {
  const program = getPlaceholderProgramById(programId)
  return program?.terms || []
}

export function getPlaceholderLessonsByTermId(termId: string): Lesson[] {
  for (const program of placeholderPrograms) {
    const term = program.terms?.find((t) => t.id === termId)
    if (term) {
      return term.lessons || []
    }
  }
  return []
}
