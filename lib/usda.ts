// ─────────────────────────────────────────────────────────────────────────
// Поиск пищевой ценности на 100 г в USDA FoodData Central (только сервер).
// Открытый источник: https://fdc.nal.usda.gov/. Ключ — env USDA_API_KEY,
// fallback на публичный DEMO_KEY (жёсткие лимиты — для прода нужен свой ключ).
// ─────────────────────────────────────────────────────────────────────────

import type { Macro } from "@/lib/ai";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
// Generic-категории: чистые данные на 100 г (не branded с порциями/шумом).
const DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)"];

// nutrientNumber → ключ макроса (значения в этих категориях — на 100 г).
const NUTRIENT_CODES: Record<string, keyof Macro> = {
  "208": "kcal",
  "203": "protein",
  "204": "fat",
  "205": "carbs",
};

// Слова, не несущие «что это за продукт»: способы готовки, связки, общие термины.
// Их выкидываем при оценке совпадения, чтобы «steamed vegetables» не матчилось
// в «oysters, steamed» через общее слово «steamed».
const STOP = new Set([
  "cooked", "raw", "grilled", "fried", "baked", "roasted", "boiled", "steamed",
  "fresh", "with", "and", "without", "the", "of", "in", "a", "ns", "nfs",
  "prepared", "homemade", "style", "sauce", "mixed",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

type UsdaFood = {
  description?: string;
  dataType?: string;
  foodNutrients?: { nutrientNumber?: string | number; value?: number }[];
};

function extractPer100(food: UsdaFood): Macro {
  const m: Macro = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  for (const n of food.foodNutrients ?? []) {
    const key = NUTRIENT_CODES[String(n.nutrientNumber)];
    if (key && typeof n.value === "number") m[key] = Math.round(n.value * 10) / 10;
  }
  return m;
}

export type UsdaMatch = { per100: Macro; matchedName: string };

// Возвращает данные на 100 г лучшего совпадения, или null если уверенного нет.
export async function lookupPer100(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<UsdaMatch | null> {
  if (!query.trim()) return null;

  const res = await fetch(`${USDA_SEARCH}?api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, dataType: DATA_TYPES, pageSize: 5 }),
    signal,
  });
  if (!res.ok) throw new Error(`USDA ${res.status}`);

  const data = (await res.json()) as { foods?: UsdaFood[] };
  const foods = data.foods ?? [];
  if (foods.length === 0) return null;

  const queryTokens = tokens(query);
  // Ранжируем по числу совпавших «продуктовых» слов; при равенстве — порядок USDA.
  let best: UsdaFood | null = null;
  let bestScore = -1;
  let bestOverlap = 0;
  for (let idx = 0; idx < foods.length; idx++) {
    const f = foods[idx];
    const descTokens = new Set(tokens(f.description ?? ""));
    const overlap = queryTokens.filter((t) => descTokens.has(t)).length;
    const score = overlap * 10 - idx; // overlap главное, порядок — тай-брейк
    if (score > bestScore) {
      bestScore = score;
      bestOverlap = overlap;
      best = f;
    }
  }

  // Нет ни одного совпадения по продуктовому слову → не доверяем (вернётся оценка LLM).
  if (!best || (queryTokens.length > 0 && bestOverlap === 0)) return null;

  const per100 = extractPer100(best);
  if (per100.kcal === 0 && per100.protein === 0 && per100.carbs === 0 && per100.fat === 0) return null;

  return { per100, matchedName: best.description ?? query };
}
