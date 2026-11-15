"use client";

const STORAGE_KEY = "sprintly_vertex_ai_key";
const LEGACY_STORAGE_KEY = "sprintly_gemini_api_key";

export function getStoredGeminiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "";
}

export function setStoredGeminiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim());
    localStorage.setItem(LEGACY_STORAGE_KEY, key.trim());
  }
}

interface GenerateSubtasksParams {
  title: string;
  description?: string;
  apiKey?: string;
}

interface EnhanceDescriptionParams {
  title: string;
  description?: string;
  apiKey?: string;
}

interface SprintSummaryParams {
  projectName?: string;
  tasks: Array<{ title: string; status: string; priority: string }>;
  apiKey?: string;
}

export async function generateSubtasksWithAI({
  title,
  description,
  apiKey,
}: GenerateSubtasksParams): Promise<string[]> {
  const activeKey = apiKey || getStoredGeminiKey();
  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(activeKey ? { "x-vertex-ai-key": activeKey, "x-gemini-api-key": activeKey } : {}),
    },
    body: JSON.stringify({
      action: "breakdown_subtasks",
      title,
      description,
      apiKey: activeKey,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate subtasks");
  }
  return data.subtasks || [];
}

export async function enhanceDescriptionWithAI({
  title,
  description,
  apiKey,
}: EnhanceDescriptionParams): Promise<string> {
  const activeKey = apiKey || getStoredGeminiKey();
  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(activeKey ? { "x-vertex-ai-key": activeKey, "x-gemini-api-key": activeKey } : {}),
    },
    body: JSON.stringify({
      action: "improve_description",
      title,
      description,
      apiKey: activeKey,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to enhance description");
  }
  return data.enhancedDescription || "";
}

export async function generateSprintSummaryWithAI({
  projectName,
  tasks,
  apiKey,
}: SprintSummaryParams): Promise<string> {
  const activeKey = apiKey || getStoredGeminiKey();
  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(activeKey ? { "x-vertex-ai-key": activeKey, "x-gemini-api-key": activeKey } : {}),
    },
    body: JSON.stringify({
      action: "sprint_summary",
      projectContext: { name: projectName },
      tasks,
      apiKey: activeKey,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate sprint summary");
  }
  return data.summary || "";
}
