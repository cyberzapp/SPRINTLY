"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { TASK_STATUS_MAP } from "@/lib/constants";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import type { Task } from "@/types";

export default function CalendarPage() {
  const { tasks, projectsById } = useWorkspace();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayIndex }, (_, i) => i);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualize deadlines and deliverables across your active projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth} className="size-8 p-0">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-bold min-w-32 text-center">
            {monthName} {year}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth} className="size-8 p-0">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center py-2 text-xs font-semibold text-muted-foreground">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {paddingArray.map((_, i) => (
            <div key={`pad-${i}`} className="h-28 bg-muted/10 p-1.5" />
          ))}

          {daysArray.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasks.filter((t) => {
              if (!t.dueDate) return false;
              const d = new Date(t.dueDate.toMillis()).toISOString().split("T")[0];
              return d === dateStr;
            });

            return (
              <div
                key={day}
                className="h-28 p-1.5 overflow-y-auto space-y-1 hover:bg-muted/10 transition-colors scrollbar-thin"
              >
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {day}
                </span>

                {dayTasks.map((t) => {
                  const statusMeta = TASK_STATUS_MAP[t.status];
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setDrawerOpen(true);
                      }}
                      className="p-1 rounded bg-background border border-border text-[10px] truncate cursor-pointer hover:border-primary/50 transition-colors shadow-2xs"
                      title={t.title}
                    >
                      <span className="font-semibold">{t.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
