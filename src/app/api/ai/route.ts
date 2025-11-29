import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const MAX_PROMPT_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 10000;
const VALID_ACTIONS = [
  "write", "summarize", "translate_en", "translate_km",
  "improve", "explain", "brainstorm", "outline", "chat"
] as const;

const AI_RATE_LIMIT = { limit: 20, window: 60 };

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
}

const SYSTEM_PROMPTS: Record<string, string> = {
  write: `You are a helpful writing assistant. Help the user write, expand, or improve their content.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Be concise but helpful. Format your response in markdown when appropriate.`,

  summarize: `You are a summarization expert. Summarize the given content concisely while preserving key points.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Use bullet points for clarity when appropriate.`,

  translate_en: `You are a professional translator. Translate the given text to English.
    Preserve the original meaning and tone. Be accurate and natural.`,

  translate_km: `You are a professional translator. Translate the given text to Khmer (ភាសាខ្មែរ).
    Preserve the original meaning and tone. Be accurate and natural.`,

  improve: `You are an expert editor. Improve the given text by fixing grammar, enhancing clarity,
    and making it more professional. Keep the same language as the input.
    Explain your changes briefly at the end in Khmer (ភាសាខ្មែរ).`,

  explain: `You are a helpful teacher. Explain the given concept or text in simple terms.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Use examples when helpful.`,

  brainstorm: `You are a creative brainstorming partner. Generate ideas related to the given topic.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Provide at least 5 creative ideas.
    Format as a numbered list.`,

  outline: `You are a content strategist. Create a structured outline for the given topic.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Use proper heading hierarchy.`,

  chat: `You are a helpful AI assistant. You can help with writing, analysis, and general questions.
    ALWAYS respond in Khmer (ភាសាខ្មែរ) unless the user explicitly asks for another language.
    Format your response using Markdown (headings, lists, bold, italic, etc.) so it can be rendered correctly in the editor.
    Be concise, friendly, and helpful.`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = `ai:${session.user.id}`;
    const rateLimitResult = rateLimit(rateLimitKey, AI_RATE_LIMIT);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json(
        { error: "AI service not configured. Please add GROQ_API_KEY to environment." },
        { status: 503 }
      );
    }

    const { prompt, action, context, chatId } = await request.json();

    if (!prompt || !action) {
      return NextResponse.json(
        { error: "Missing prompt or action" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (typeof prompt !== "string" || prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt must be a string with max ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (context && (typeof context !== "string" || context.length > MAX_CONTEXT_LENGTH)) {
      return NextResponse.json(
        { error: `Context must be a string with max ${MAX_CONTEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.write;

    let currentChatId = chatId;

    if (action === "chat") {
      if (!currentChatId) {
        const newChat = await db.aiChat.create({
          data: {
            userId: session.user.id,
            title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
          },
        });
        currentChatId = newChat.id;
      }

      await db.aiMessage.create({
        data: {
          chatId: currentChatId,
          role: "user",
          content: prompt,
        },
      });
    }

    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `Context from the document:\n${context}\n\n---\n\nUser request: ${prompt}`,
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const response = completion.choices[0]?.message?.content || "";

    if (action === "chat" && currentChatId) {
      await db.aiMessage.create({
        data: {
          chatId: currentChatId,
          role: "assistant",
          content: response,
        },
      });
    }

    return NextResponse.json({ response, chatId: currentChatId });
  } catch (error) {
    logger.error("AI API error", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
