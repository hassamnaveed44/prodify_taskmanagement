export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    // 1. Retrieve RAG Database context details under the active workspace
    const dbProjects = await db.project.findMany({
      where: { workspaceId: payload.workspaceId },
      select: { id: true, name: true, slug: true },
    });

    const dbTasks = await db.task.findMany({
      where: { project: { workspaceId: payload.workspaceId } },
      include: {
        project: { select: { name: true } },
        assignee: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const dbMembers = await db.workspaceMember.findMany({
      where: { workspaceId: payload.workspaceId },
      include: { user: { select: { name: true, email: true } } },
    });

    // 2. Format database snapshot context summary prompt
    const contextSummary = `
You are Prodify AI, the virtual project management assistant for the Prodify Task Management system.
Here is the live database snapshot context for the current workspace. Use it to answer the user's questions truthfully and precisely:

PROJECTS IN WORKSPACE:
${dbProjects.length === 0 ? "No projects created yet." : dbProjects.map((p) => `- "${p.name}" (Slug: ${p.slug})`).join("\n")}

ALL TASKS IN WORKSPACE:
${dbTasks.length === 0 ? "No tasks added yet." : dbTasks.map((t) => `- "${t.name}" | Project: "${t.project.name}" | Status: ${t.status} | Priority: ${t.priority} | Due Date: ${t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'None'} | Assigned To: ${t.assignee ? t.assignee.user.name : 'Unassigned'}`).join("\n")}

WORKSPACE MEMBERS & ACCESS ROLES:
${dbMembers.map((m) => `- Name: ${m.user.name} | Email: ${m.user.email} | Access Role: ${m.role}`).join("\n")}

LOGGED-IN USER SESSION DETAILS:
- Name: ${payload.name}
- Email: ${payload.email}

INSTRUCTIONS:
1. Always base task priorities, deadlines, and summaries strictly on the database context provided above.
2. If the user asks what to work on next, identify tasks assigned to them that are NOT COMPLETED. Prioritize HIGH priority tasks, then MEDIUM, then LOW.
3. If they ask about progress or stats, provide ratio summaries (e.g. COMPLETED vs TODO tasks) and bullet lists.
4. Keep your answers clear, concise, and structured. Use bolding and markdown bullet points extensively. Do not repeat instructions.
6. You are also a general-purpose AI companion. If the user's prompt is a general knowledge question, code query, greeting, or conversation unrelated to project management or tasks, ignore the workspace database context and answer their question directly, fully, and helpfully.
`;

    // 3. Detect AI provider setting
    const provider = process.env.AI_PROVIDER || "gemini";
    const userPrompt = prompt.trim();
    const encoder = new TextEncoder();

    // 4. Construct ReadableStream for EventSource/SSE Streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === "gemini") {
            const apiKey = process.env.GEMINI_API_KEY;

            // Fallback check if user hasn't replaced placeholder key
            if (!apiKey || apiKey.startsWith("your_google")) {
              const warningMsg = `⚠️ **Gemini API Key is not configured.**

Please configure your actual \`GEMINI_API_KEY\` inside your database configuration file [\\.env](file:///D:/prodify_taskmanagement/.env) to activate the live assistant!

Here is what your live workspace database context contains right now:
*   **Active User**: **${payload.name}** (${payload.email})
*   **Projects Count**: ${dbProjects.length}
*   **Total Tasks**: ${dbTasks.length}

*Mock Response Preview:*
Based on your database, you have ${dbTasks.filter(t => t.status !== "COMPLETED").length} pending tasks. Try resolving your highest priority item in the project: **"${dbProjects[0]?.name || 'N/A'}"**!`;
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: warningMsg })}\n\n`));
              controller.close();
              return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: "gemini-2.5-flash",
              systemInstruction: contextSummary,
            });
            const responseStream = await model.generateContentStream({
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            });

            for await (const chunk of responseStream.stream) {
              const text = chunk.text();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } else {
            // Grok AI Mode
            const apiKey = process.env.GROK_API_KEY;

            if (!apiKey || apiKey.startsWith("your_xai")) {
              const warningMsg = `⚠️ **xAI Grok API Key is not configured.**

Please configure your actual \`GROK_API_KEY\` inside your database configuration file [\\.env](file:///D:/prodify_taskmanagement/.env) to activate the live Grok assistant!`;
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: warningMsg })}\n\n`));
              controller.close();
              return;
            }

            const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "grok-2-1212",
                stream: true,
                messages: [
                  { role: "system", content: contextSummary },
                  { role: "user", content: userPrompt },
                ],
              }),
            });

            if (!grokResponse.ok || !grokResponse.body) {
              throw new Error(`Grok API error: ${grokResponse.statusText}`);
            }

            const reader = grokResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine.startsWith("data:")) continue;
                const dataStr = cleanLine.substring(5).trim();
                if (dataStr === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(dataStr);
                  const text = parsed.choices?.[0]?.delta?.content || "";
                  if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch (e) {
                  // Ignore partial parsing errors
                }
              }
            }
          }
        } catch (err: any) {
          console.error("SSE Streaming failure:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err.message || "Streaming text tokens failed." })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/ai/chat failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred executing AI prompt." },
      { status: 500 }
    );
  }
}
