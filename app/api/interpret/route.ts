import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseResult,
  type InterpretRequest,
} from "@/lib/ai";

// Только серверный код. Ключ Mistral читается из окружения и НИКОГДА не уходит на клиент.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
// Бесплатный tier Mistral. Переопределяется через MISTRAL_MODEL.
const DEFAULT_MODEL = "mistral-small-latest";

export async function POST(request: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "no_key",
        message:
          "ИИ-интерпретация не настроена: не задан MISTRAL_API_KEY. Добавьте ключ в .env.local и перезапустите сервер.",
      },
      { status: 503 },
    );
  }

  let body: InterpretRequest;
  try {
    body = (await request.json()) as InterpretRequest;
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Невалидный JSON." }, { status: 400 });
  }

  if (!body?.lab?.title || !Array.isArray(body.lab.history) || body.lab.history.length === 0) {
    return NextResponse.json(
      { error: "bad_request", message: "Нужны данные анализа (lab.title и непустая lab.history)." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(body) },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Mistral error", res.status, detail.slice(0, 500));
      const message =
        res.status === 401
          ? "Mistral отклонил ключ (401). Проверьте MISTRAL_API_KEY."
          : res.status === 429
            ? "Лимит запросов Mistral исчерпан (429). Попробуйте позже."
            : `Сервис ИИ недоступен (${res.status}).`;
      return NextResponse.json({ error: "upstream", message }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Mistral returned non-JSON content:", content.slice(0, 300));
      return NextResponse.json(
        { error: "parse", message: "Не удалось разобрать ответ ИИ. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    return NextResponse.json(parseResult(parsed));
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("interpret route failed", err);
    return NextResponse.json(
      {
        error: aborted ? "timeout" : "network",
        message: aborted
          ? "ИИ долго не отвечает. Попробуйте ещё раз."
          : "Не удалось связаться с сервисом ИИ.",
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
