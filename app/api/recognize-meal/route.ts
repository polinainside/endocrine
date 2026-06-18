import { NextResponse } from "next/server";
import { VISION_PROMPT, parseRecognizedMeal } from "@/lib/ai";

// Только серверный код. Фото (base64 data URI) уходит в Mistral Vision, ключ на клиент не попадает.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
// Vision-модель Mistral. Переопределяется через MISTRAL_VISION_MODEL.
const DEFAULT_VISION_MODEL = "pixtral-12b-2409";
const MAX_IMAGE_CHARS = 8 * 1024 * 1024; // ~8 МБ data URI (клиент присылает сжатое ~1024px)

export async function POST(request: Request) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "no_key",
        message:
          "Распознавание не настроено: не задан MISTRAL_API_KEY. Добавьте ключ в .env.local и перезапустите сервер.",
      },
      { status: 503 },
    );
  }

  let body: { image?: unknown };
  try {
    body = (await request.json()) as { image?: unknown };
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Невалидный JSON." }, { status: 400 });
  }

  const image = body?.image;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "bad_request", message: "Нужно фото в формате data:image/...;base64,…" },
      { status: 400 },
    );
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json(
      { error: "too_large", message: "Фото слишком большое. Попробуйте снять ещё раз." },
      { status: 413 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_VISION_MODEL || DEFAULT_VISION_MODEL,
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_PROMPT },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Mistral vision error", res.status, detail.slice(0, 500));
      const message =
        res.status === 401
          ? "Mistral отклонил ключ (401). Проверьте MISTRAL_API_KEY."
          : res.status === 429
            ? "Лимит запросов Mistral исчерпан (429). Попробуйте позже."
            : `Сервис распознавания недоступен (${res.status}).`;
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
      console.error("Mistral vision returned non-JSON:", content.slice(0, 300));
      return NextResponse.json(
        { error: "parse", message: "Не удалось разобрать ответ. Попробуйте ещё раз." },
        { status: 502 },
      );
    }

    return NextResponse.json(parseRecognizedMeal(parsed));
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("recognize-meal route failed", err);
    return NextResponse.json(
      {
        error: aborted ? "timeout" : "network",
        message: aborted
          ? "Распознавание долго не отвечает. Попробуйте ещё раз."
          : "Не удалось связаться с сервисом распознавания.",
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
