"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TASK_STATUSES, TASK_PRIORITY_MAP } from "@/lib/constants";
import type { Task, TaskStatus } from "@/types";
import { UserAvatar } from "@/components/common/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, MessageSquare } from "lucide-react";
import { useWorkspace } from "@/providers/workspace-provider";
import { updateTask } from "@/lib/services/tasks";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskWithStatus: (status: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  projectId,
  onSelectTask,
  onOpenCreateTaskWithStatus,
}: KanbanBoardProps) {
  const { user } = useAuth();
  const { workspaceId, membersById } = useWorkspace();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !workspaceId || !user) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Is it dropped onto a column directly?
    const isOverColumn = TASK_STATUSES.some((s) => s.id === overId);

    let newStatus: TaskStatus = draggedTask.status;

    if (isOverColumn) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus !== draggedTask.status) {
      try {
        let newOrder = draggedTask.order;
        if (!isOverColumn) {
          const targetColTasks = tasks
            .filter((t) => t.status === newStatus && t.id !== draggedTask.id)
            .sort((a, b) => a.order - b.order);
          const overIdx = targetColTasks.findIndex((t) => t.id === overId);
          const prevTask = overIdx > 0 ? targetColTasks[overIdx - 1] : null;
          const nextTask = targetColTasks[overIdx];
          newOrder = (prevTask ? prevTask.order : 0) + (nextTask ? nextTask.order : 2000) / 2;
        }

        await updateTask(workspaceId, projectId, draggedTask.id, user.uid, {
          status: newStatus,
          order: newOrder,
        });
        toast.success(`Moved to ${newStatus.replace("_", " ")}`);
      } catch (err) {
        toast.error("Failed to move task.");
      }
    } else if (!isOverColumn && activeId !== overId) {
      try {
        const colTasks = tasks
          .filter((t) => t.status === draggedTask.status)
          .sort((a, b) => a.order - b.order);
        const oldIndex = colTasks.findIndex((t) => t.id === activeId);
        const newIndex = colTasks.findIndex((t) => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(colTasks, oldIndex, newIndex);
          const prev = newIndex > 0 ? reordered[newIndex - 1].order : 0;
          const next = newIndex < reordered.length - 1 ? reordered[newIndex + 1].order : prev + 2000;
          const computedOrder = (prev + next) / 2;

          await updateTask(workspaceId, projectId, draggedTask.id, user.uid, {
            order: computedOrder,
          });
        }
      } catch (err) {
        toast.error("Failed to reorder task.");
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin min-h-[calc(100vh-220px)] items-start">
        {TASK_STATUSES.map((column) => {
          const colTasks = tasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={column.id}
              className="w-72 shrink-0 bg-muted/40 border border-border/80 rounded-xl flex flex-col max-h-[calc(100vh-230px)] shadow-2xs"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    {column.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.2 rounded-full bg-background border border-border font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenCreateTaskWithStatus(column.id)}
                  className="size-6 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>

              {/* Column Body: Drop Container */}
              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={column.id}
              >
                <div className="p-2 flex-1 overflow-y-auto space-y-2 scrollbar-thin min-h-[120px]">
                  {colTasks.map((task) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      member={task.assigneeId ? membersById[task.assigneeId] : null}
                      onClick={() => onSelectTask(task)}
                    />
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-20 border border-dashed border-border rounded-lg flex items-center justify-center text-[11px] text-muted-foreground/70">
                      Empty
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-72 p-3 rounded-lg border border-primary/50 bg-surface shadow-pop rotate-1">
            <span className="text-xs font-semibold">{activeTask.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function SortableTaskCard({
  task,
  member,
  onClick,
}: {
  task: Task;
  member: any;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityMeta = TASK_PRIORITY_MAP[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group p-3 rounded-lg border border-border bg-surface hover:border-primary/40 hover:shadow-soft transition-all cursor-pointer space-y-2.5 select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {task.title}
        </span>
        <span
          className="size-2 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: priorityMeta?.color }}
          title={priorityMeta?.label}
        />
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((lbl) => (
            <Badge
              key={lbl}
              variant="secondary"
              className="text-[9px] px-1.5 py-0 font-normal"
            >
              {lbl}
            </Badge>
          ))}
        </div>
      )}

      {/* Card Footer: Subtask counts, comments, assignee avatar */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="size-3" />
              <span>
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </span>
            </div>
          )}

          {task.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              <span>{task.commentCount}</span>
            </div>
          )}
        </div>

        {member && (
          <UserAvatar
            name={member.displayName}
            photoURL={member.photoURL}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}
