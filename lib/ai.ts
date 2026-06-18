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

export type RecognizedMeal = {
  isFood: boolean;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence: "low" | "medium" | "high";
};

// Промпт для vision-модели. Кладётся рядом с картинкой в одном user-сообщении.
export const VISION_PROMPT = `Ты — помощник по подсчёту калорий в дневнике питания. На фото — приём пищи.
Определи блюдо и оцени пищевую ценность ВСЕЙ видимой порции.

Правила:
- name — коротко по-русски (2–5 слов), например «Греческий салат с тунцом».
- kcal, protein, fat, carbs — целые числа на всю порцию на фото. Это приблизительная оценка, не точное измерение.
- confidence: high — блюдо явно видно и понятно; medium — частично; low — плохо видно или трудно оценить.
- Если на фото НЕ еда или определить невозможно — верни isFood:false и нули.

Верни СТРОГО валидный JSON без markdown по схеме:
{"isFood":true,"name":"","kcal":0,"protein":0,"fat":0,"carbs":0,"confidence":"medium"}`;

// Защитный парсинг + клампинг (модель может вернуть строки/мусор/огромные числа).
export function parseRecognizedMeal(raw: unknown): RecognizedMeal {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, max: number) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.round(n), max);
  };
  const conf = o.confidence;
  return {
    isFood: o.isFood !== false,
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 80) : "Блюдо",
    kcal: num(o.kcal, 5000),
    protein: num(o.protein, 1000),
    fat: num(o.fat, 1000),
    carbs: num(o.carbs, 1000),
    confidence: conf === "low" || conf === "high" ? conf : "medium",
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
