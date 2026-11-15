import { NextRequest, NextResponse } from "next/server";
import { getVertexAIClient } from "@/lib/gemini/client";

export async function POST(req: NextRequest) {
  try {
    const headerKey = req.headers.get("x-vertex-ai-key") || req.headers.get("x-gemini-api-key");
    const { action, title, description, tasks, projectContext, apiKey: bodyKey } = await req.json();

    const ai = getVertexAIClient(headerKey || bodyKey);

    if (action === "breakdown_subtasks") {
      // Generates 3-6 actionable subtasks for a given task title and description
      const prompt = `
You are a senior technical agile product manager.
Analyze the task:
Title: "${title}"
Description: "${description || "None provided"}"

Generate 4 to 6 clear, granular, actionable subtasks to complete this task.
Return ONLY a valid JSON array of strings, without any markdown code fences or backticks.
Example output format:
["Design the modal UI component", "Wire up state management", "Integrate API call", "Add unit tests"]
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text?.trim() || "[]";
      // Clean possible markdown code fences if model included any
      const cleaned = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
      const subtasks = JSON.parse(cleaned);

      return NextResponse.json({ subtasks });
    }

    if (action === "improve_description") {
      // Enhances and standardizes task descriptions with user stories and acceptance criteria
      const prompt = `
You are an expert software project manager. Improve and expand this task description to include a clear User Story, Context, and Acceptance Criteria.
Task Title: "${title}"
Draft Description: "${description || ""}"

Format the response using clean Markdown with bullet points. Be concise, professional, and practical.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ enhancedDescription: response.text });
    }

    if (action === "sprint_summary") {
      // Summarizes sprint health, risks, and velocity recommendations
      const prompt = `
You are a scrum master and engineering delivery lead.
Analyze the following project workload:
Project: "${projectContext?.name || "Sprint Project"}"
Total tasks: ${tasks?.length || 0}
Tasks summary:
${JSON.stringify(tasks?.slice(0, 30) || [])}

Provide:
1. Executive Sprint Health Summary (2-3 sentences)
2. Top 3 Delivery Risks or Blockers
3. Key Recommended Action for the team today

Format in clean Markdown with bold headers.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ summary: response.text });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Vertex AI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Vertex AI response. Verify your Vertex AI / Google Cloud credentials." },
      { status: 500 }
    );
  }
}
