"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getPrograms } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { placeholderPrograms } from "@/lib/placeholder-data"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { ProgramResponse } from "@/lib/types"

export default function DashboardClient() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ programs: 0, terms: 0, lessons: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [programs, setPrograms] = useState<ProgramResponse[]>([])

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      let progs = []
      try {
        const apiData = await getPrograms(token || "")
        progs = apiData || []
      } catch (error: any) {
        // Check for JWT expiration/invalid
        if (typeof error?.message === "string" && (error.message.includes("jwt") || error.message.toLowerCase().includes("token"))) {
          localStorage.removeItem("auth_token")
          router.push("/login")
          return
        }
        // fallback to placeholder
        progs = placeholderPrograms
      }
      setPrograms(progs)
      const terms = progs.reduce((acc, p) => acc + (p.terms?.length || 0), 0)
      const lessons = progs.reduce(
        (acc, p) => acc + (p.terms?.reduce((termAcc, t) => termAcc + (t.lessons?.length || 0), 0) || 0),
        0,
      )
      setStats({ programs: progs.length, terms, lessons })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name || user?.email}</h1>
        <p className="mt-2 text-muted-foreground">Manage your programs, terms, and lessons</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Programs</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stats.programs}</p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Terms</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stats.terms}</p>
            </div>
            <div className="text-4xl">📖</div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lessons</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{stats.lessons}</p>
            </div>
            <div className="text-4xl">✏️</div>
          </div>
        </Card>
      </div>

      {/* Quick Actions + Programs Table */}
      <Card className="border-border bg-card p-6 mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="flex gap-4 mb-6">
          <Link href="/dashboard/create-program">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Create Program</Button>
          </Link>
          <Link href="/dashboard/programs">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary bg-transparent">
              View Programs
            </Button>
          </Link>
        </div>
        <div>
          <Table className="bg-card border border-border rounded-md">
            <TableCaption>All programs (edit/view based on role and status)</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No programs found</TableCell>
                </TableRow>
              ) : (
                programs.map((program) => {
                  const canEdit = (user?.role === "admin" || user?.role === "editor") && program.status !== "published"
                  return (
                    <TableRow key={program.id}>
                      <TableCell className="font-semibold">{program.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{program.description}</TableCell>
                      <TableCell>{program.status || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canEdit ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-secondary bg-transparent"
                              onClick={() => router.push(`/dashboard/programs/${program.id}`)}
                            >
                              Edit
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-secondary bg-transparent"
                              onClick={() => router.push(`/programs/${program.id}`)}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}