"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { placeholderPrograms } from "@/lib/placeholder-data";
import { getPrograms } from "@/lib/api-client";
import type { ProgramResponse } from "@/lib/types";

export default function ProgramsPage() {
  // State for scheduling dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleProgramId, setScheduleProgramId] = useState<string | null>(
    null
  );
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string>("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  // Handler to open dialog
  const openScheduleDialog = (programId: string) => {
    setScheduleProgramId(programId);
    setScheduleDate("");
    setScheduleError("");
    setScheduleDialogOpen(true);
  };

  // Handler to actually schedule
  const handleScheduleConfirm = async () => {
    setScheduleError("");
    if (!scheduleDate) {
      setScheduleError("Please select a date and time.");
      return;
    }
    const selected = new Date(scheduleDate);
    if (selected.getTime() <= Date.now()) {
      setScheduleError("Please select a future date and time.");
      return;
    }
    setScheduleLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      // scheduleProgram is imported from api-client
      await (
        await import("@/lib/api-client")
      ).scheduleProgram(scheduleProgramId!, scheduleDate, token || "");
      setScheduleDialogOpen(false);
      setScheduleProgramId(null);
      setScheduleDate("");
      await fetchPrograms();
      router.push("/dashboard/programs");
    } catch (err: any) {
      setScheduleError(err?.message || "Failed to schedule program.");
    } finally {
      setScheduleLoading(false);
    }
  };
  const router = useRouter();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrograms = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      let data: ProgramResponse[] = [];
      try {
        const apiData = await getPrograms(token || "");
        data = apiData || [];
      } catch (error: any) {
        // Check for JWT expiration/invalid
        if (
          typeof error?.message === "string" &&
          (error.message.includes("jwt") ||
            error.message.toLowerCase().includes("token"))
        ) {
          localStorage.removeItem("auth_token");
          router.push("/login");
          return;
        }
        console.log("API unavailable, using placeholder data");
        data = placeholderPrograms;
      }
      // Sort by updatedAt or createdAt descending
      data.sort((a, b) => {
        const aTime = new Date(a.updatedAt!!).getTime();
        const bTime = new Date(b.updatedAt!!).getTime();
        return bTime - aTime;
      });
      setPrograms(data);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programs</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and edit your educational programs
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push("/dashboard/create-program")}
        >
          Create Program
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">
          Loading programs...
        </div>
      ) : programs.length === 0 ? (
        <Card className="border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No programs yet</p>
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/dashboard/create-program")}
          >
            Create Your First Program
          </Button>
        </Card>
      ) : (
        <Table className="bg-card border border-border rounded-md">
          <TableCaption>All programs sorted by last update</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-semibold">{program.title}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {program.description}
                </TableCell>
                <TableCell>{program.status || "-"}</TableCell>
                <TableCell>
                  {program.updatedAt
                    ? new Date(program.updatedAt).toLocaleString()
                    : program.createdAt
                    ? new Date(program.createdAt).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {program.status !== "published" &&
                    program.status !== "scheduled" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border text-foreground hover:bg-secondary bg-transparent"
                          onClick={() =>
                            router.push(
                              `/dashboard/programs/${program.id}/edit`
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openScheduleDialog(program.id || "")}
                        >
                          Schedule
                        </Button>
                        {/* Schedule Dialog */}
                        <Dialog
                          open={scheduleDialogOpen}
                          onOpenChange={setScheduleDialogOpen}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Schedule Program</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <label
                                htmlFor="schedule-date"
                                className="block font-medium"
                              >
                                Select publish date and time
                              </label>
                              <Input
                                id="schedule-date"
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => {
                                  const local = e.target.value; // 2026-01-14T16:59
                                  if (!local) return;

                                  const iso = new Date(local).toISOString(); // 2026-01-14T11:29:00.000Z
                                  setScheduleDate(iso);
                                }}
                                min={new Date(Date.now() - 60000)
                                  .toISOString()
                                  .slice(0, 16)}
                                disabled={scheduleLoading}
                              />
                              {scheduleError && (
                                <div className="text-red-500 text-sm">
                                  {scheduleError}
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setScheduleDialogOpen(false)}
                                disabled={scheduleLoading}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleScheduleConfirm}
                                disabled={scheduleLoading}
                              >
                                {scheduleLoading ? "Scheduling..." : "Schedule"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => router.push(`/programs/${program.id}`)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
