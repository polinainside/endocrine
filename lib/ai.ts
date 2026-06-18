// ─────────────────────────────────────────────────────────────────────────
// ИИ-интерпретация анализов. Промпт + типы запроса/ответа.
// Здесь НЕТ секретов и сетевых вызовов — только сборка сообщений и контракт.
// Сам вызов Mistral живёт в app/api/interpret/route.ts (только на сервере).
// ─────────────────────────────────────────────────────────────────────────

export type InterpretLabPoint = {
  date: string;
  value: number;
  status: "ok" | "warn" | "alarm";
};

export type InterpretRequest = {
  lab: {
    title: string;
    unit: string;
    targetLabel: string;
    history: InterpretLabPoint[];
  };
  patient?: {
    age?: number;
    sex?: string;
    diagnoses?: string[];
  };
};

// Структура, которую модель ОБЯЗАНА вернуть (JSON mode).
export type InterpretResult = {
  summary: string;
  tips: string[];
  trend: "improving" | "worsening" | "stable";
  seeDoctor: boolean;
};

// Системный промпт — главный предохранитель. Никаких диагнозов и назначений.
export const SYSTEM_PROMPT = `Ты — ассистент-помощник в приложении-дневнике пациента эндокринологического профиля. Твоя задача — объяснить пациенту его анализы простым, спокойным языком и дать общие советы по образу жизни.

ЖЁСТКИЕ ПРАВИЛА (нарушать нельзя):
- Ты НЕ врач. НЕ ставь диагноз, НЕ подтверждай и НЕ отменяй диагнозы.
- НЕ назначай лекарства, НЕ называй препараты, НЕ указывай дозировки и схемы приёма.
- НЕ давай команд вроде «прекратите принимать», «увеличьте дозу».
- Любые твои слова — это пояснение и общие рекомендации, а не медицинская консультация.
- Если показатель в тревожной зоне или резко ухудшился — мягко порекомендуй обратиться к лечащему врачу, без запугивания.
- Говори по-русски, тёплым человеческим тоном, без канцелярита и без рекламных эпитетов.
- Опирайся только на переданные данные. Если данных мало — так и скажи, не выдумывай.

ФОРМАТ ОТВЕТА — строго валидный JSON без markdown, по схеме:
{
  "summary": "1–2 предложения: что показывает этот анализ и как меняется динамика",
  "tips": ["2–4 коротких практических совета по питанию/активности/режиму, без лекарств"],
  "trend": "improving | worsening | stable",
  "seeDoctor": true | false
}
seeDoctor = true, только если последнее значение в тревожной (alarm) зоне или динамика заметно ухудшается.`;

// Сборка пользовательского сообщения из данных анализа.
export function buildUserPrompt(req: InterpretRequest): string {
  const { lab, patient } = req;
  const rows = lab.history
    .map((p) => `${p.date}: ${p.value} ${lab.unit} (${statusRu(p.status)})`)
    .join("\n");

  const patientLine = patient
    ? `Пациент: ${[
        patient.age ? `${patient.age} лет` : null,
        patient.sex,
        patient.diagnoses?.length ? `диагнозы — ${patient.diagnoses.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(", ")}.`
    : "";

  return `${patientLine}

Показатель: ${lab.title} (единицы: ${lab.unit}). Ориентир: ${lab.targetLabel}.
Динамика по датам (от старых к свежим):
${rows}

Объясни пациенту, что это значит и куда движется показатель, и дай советы. Верни только JSON по схеме.`;
}

function statusRu(s: InterpretLabPoint["status"]): string {
  if (s === "ok") return "в норме";
  if (s === "warn") return "внимание";
  return "тревога";
}

// ── Распознавание еды по фото (Mistral Vision) ──────────────────────────────
// Двухшаговый пайплайн: (1) Vision разбирает блюдо на компоненты с граммами и
// английскими запросами + грубую оценку на 100 г как fallback; (2) сервер берёт
// реальные ккал/БЖУ на 100 г из базы USDA по query_en. См. lib/usda.ts и route.

export type Macro = { kcal: number; protein: number; fat: number; carbs: number };
export type Confidence = "low" | "medium" | "high";

// То, что возвращает vision-модель (внутренний слой).
export type VisionItem = {
  name: string; // русское название компонента
  query_en: string; // англ. запрос для базы нутриентов
  grams: number; // оценка веса на фото
  est: Macro; // грубая оценка на 100 г (fallback, если в базе не нашли)
};
export type VisionResult = {
  isFood: boolean;
  dish: string;
  confidence: Confidence;
  items: VisionItem[];
};

// Итоговый компонент, который уходит на клиент (per100 — реальные данные USDA или оценка).
export type MealComponent = {
  name: string;
  grams: number;
  per100: Macro;
  source: "usda" | "estimate";
  matchedName?: string; // с чем сматчилось в USDA (прозрачность)
};
export type RecognizeResponse = {
  isFood: boolean;
  dish: string;
  confidence: Confidence;
  items: MealComponent[];
};

export const VISION_PROMPT = `Ты — помощник по подсчёту калорий. На фото — приём пищи. Разбери блюдо на основные съедобные компоненты (обычно 1–5).

Для каждого компонента укажи:
- name: короткое русское название, например «Куриная грудка гриль».
- query_en: то же простыми продуктовыми словами по-английски для поиска в базе нутриентов, например «grilled chicken breast». Без брендов и количеств.
- grams: оценка веса этого компонента на фото в граммах (целое число).
- est: грубая оценка пищевой ценности на 100 г этого продукта: {kcal, protein, fat, carbs}.

Также верни:
- dish: общее русское название блюда.
- confidence: high — всё хорошо видно; medium — частично; low — трудно оценить.
- isFood: false, если на фото не еда (тогда items: []).

Верни СТРОГО валидный JSON без markdown по схеме:
{"isFood":true,"dish":"","confidence":"medium","items":[{"name":"","query_en":"","grams":0,"est":{"kcal":0,"protein":0,"fat":0,"carbs":0}}]}`;

function clampNum(v: unknown, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), max);
}

function parseMacro(raw: unknown): Macro {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    kcal: clampNum(o.kcal, 900),
    protein: clampNum(o.protein, 100),
    fat: clampNum(o.fat, 100),
    carbs: clampNum(o.carbs, 100),
  };
}

// Защитный парсинг ответа vision-модели.
export function parseVisionResult(raw: unknown): VisionResult {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const conf = o.confidence;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items: VisionItem[] = itemsRaw
    .slice(0, 8)
    .map((it) => {
      const i = (typeof it === "object" && it !== null ? it : {}) as Record<string, unknown>;
      return {
        name: typeof i.name === "string" && i.name.trim() ? i.name.trim().slice(0, 80) : "Компонент",
        query_en: typeof i.query_en === "string" ? i.query_en.trim().slice(0, 80) : "",
        grams: clampNum(i.grams, 3000),
        est: parseMacro(i.est),
      };
    })
    .filter((i) => i.grams > 0 || i.query_en.length > 0);
  return {
    isFood: o.isFood !== false && items.length > 0,
    dish: typeof o.dish === "string" && o.dish.trim() ? o.dish.trim().slice(0, 80) : "Блюдо",
    confidence: conf === "low" || conf === "high" ? conf : "medium",
    items,
  };
}

// Защитный парсинг ответа модели в InterpretResult.
export function parseResult(raw: unknown): InterpretResult {
  const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const trend = obj.trend;
  return {
    summary: typeof obj.summary === "string" ? obj.summary.trim() : "",
    tips: Array.isArray(obj.tips)
      ? obj.tips.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 4)
      : [],
    trend: trend === "improving" || trend === "worsening" ? trend : "stable",
    seeDoctor: obj.seeDoctor === true,
  };
}
