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
