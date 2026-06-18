// ─────────────────────────────────────────────────────────────────────────
// Все данные приложения — статические моки. Никаких API, fetch или БД.
// Прототип для демонстрации видения интерфейса (эндокринология, пациент).
// ─────────────────────────────────────────────────────────────────────────

export type Status = "ok" | "warn" | "alarm";
export type Trend = "up" | "down" | "flat";

export const patient = {
  name: "Анна",
  fullName: "Анна Соколова",
  initials: "АС",
  weight: 72,
  weightSource: "введён вручную",
  steps: 6540,
  stepsSource: "смартфон",
  nextLabInDays: 5,
  // Медкарта
  patientId: "00482",
  age: 34,
  sex: "жен.",
  birthDate: "14.03.1992",
  height: 168,
  bmi: 25.5,
  bloodType: "II (A) Rh+",
  observedSince: "сентябрь 2024",
  diagnoses: [
    { title: "Сахарный диабет 2 типа", code: "E11" },
    { title: "Гипотиреоз", code: "E03.9" },
  ],
  allergies: "Пенициллин",
};

// Носимый датчик глюкозы (CGM). Источник «живых» данных на главной.
export const sensor = {
  name: "NovaSense",
  model: "CGM G4",
  status: "connected" as const,
  battery: 82,
  lastSyncMin: 2,
  wearDaysLeft: 9,
  intervalMin: 5,
  type: "Непрерывный мониторинг глюкозы (CGM)",
  placement: "левое плечо",
  description:
    "Сенсор крепится на плечо и автоматически передаёт данные в приложение каждые 5 минут по Bluetooth — без проколов пальца и ручного ввода. Все значения глюкозы в приложении приходят с датчика в реальном времени.",
};

// Текущая глюкоза — «прилетает» с датчика, не введена руками.
export const glucoseNow: {
  value: number;
  unit: string;
  trend: Trend;
  status: Status;
  source: string;
  agoMin: number;
  timeInRange: number;
} = {
  value: 6.2,
  unit: "ммоль/л",
  trend: "flat",
  status: "ok",
  source: "NovaSense",
  agoMin: 2,
  timeInRange: 78,
};

// Глюкоза за последние ~8 часов для area-графика на главной.
export const glucoseToday: { time: string; value: number }[] = [
  { time: "08:00", value: 5.4 },
  { time: "08:40", value: 7.1 },
  { time: "09:20", value: 8.0 },
  { time: "10:00", value: 6.9 },
  { time: "10:40", value: 6.1 },
  { time: "11:20", value: 5.8 },
  { time: "12:00", value: 6.4 },
  { time: "12:40", value: 7.6 },
  { time: "13:20", value: 6.8 },
  { time: "14:00", value: 6.0 },
  { time: "14:40", value: 5.9 },
  { time: "15:20", value: 6.2 },
];

export const aiHint = {
  title: "Подсказка ассистента",
  text: "Глюкоза стабильна после обеда. Так держать — лёгкая прогулка вечером поможет удержать тренд.",
};

// ── Анализы ───────────────────────────────────────────────────────────────

export type LabPoint = { date: string; value: number; status: Status };

export type LabSeries = {
  key: string;
  title: string;
  unit: string;
  target: number;
  // Целевой диапазон для пунктирной линии «нормы».
  targetLabel: string;
  history: LabPoint[];
};

export const labs: Record<string, LabSeries> = {
  hba1c: {
    key: "hba1c",
    title: "HbA1c",
    unit: "%",
    target: 6.5,
    targetLabel: "цель < 6.5%",
    history: [
      { date: "12.2025", value: 8.1, status: "alarm" },
      { date: "01.2026", value: 7.6, status: "alarm" },
      { date: "02.2026", value: 7.2, status: "warn" },
      { date: "03.2026", value: 6.9, status: "warn" },
      { date: "04.2026", value: 6.7, status: "warn" },
      { date: "05.2026", value: 6.4, status: "ok" },
    ],
  },
  fastingGlu: {
    key: "fastingGlu",
    title: "Глюкоза натощак",
    unit: "ммоль/л",
    target: 5.5,
    targetLabel: "цель < 5.5",
    history: [
      { date: "12.2025", value: 7.8, status: "alarm" },
      { date: "01.2026", value: 7.1, status: "alarm" },
      { date: "02.2026", value: 6.6, status: "warn" },
      { date: "03.2026", value: 6.2, status: "warn" },
      { date: "04.2026", value: 5.8, status: "warn" },
      { date: "05.2026", value: 5.4, status: "ok" },
    ],
  },
  tsh: {
    key: "tsh",
    title: "ТТГ",
    unit: "мМЕ/л",
    target: 4.0,
    targetLabel: "норма 0.4–4.0",
    history: [
      { date: "12.2025", value: 3.1, status: "ok" },
      { date: "01.2026", value: 3.4, status: "ok" },
      { date: "02.2026", value: 3.0, status: "ok" },
      { date: "03.2026", value: 2.8, status: "ok" },
      { date: "04.2026", value: 2.9, status: "ok" },
      { date: "05.2026", value: 2.6, status: "ok" },
    ],
  },
  cholesterol: {
    key: "cholesterol",
    title: "Холестерин",
    unit: "ммоль/л",
    target: 5.0,
    targetLabel: "цель < 5.0",
    history: [
      { date: "12.2025", value: 6.2, status: "alarm" },
      { date: "01.2026", value: 5.9, status: "warn" },
      { date: "02.2026", value: 5.6, status: "warn" },
      { date: "03.2026", value: 5.4, status: "warn" },
      { date: "04.2026", value: 5.2, status: "warn" },
      { date: "05.2026", value: 4.9, status: "ok" },
    ],
  },
};

export const labOrder = ["hba1c", "fastingGlu", "tsh", "cholesterol"] as const;

// ── Питание ────────────────────────────────────────────────────────────────

export type Meal = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  emoji: string;
  // Для блюд, добавленных по фото: data-URL миниатюры (показывается вместо эмодзи).
  photo?: string;
};

export const nutritionGoal = {
  kcalGoal: 1800,
  kcalEaten: 1240,
  carbs: 140,
};

export const meals: Meal[] = [
  {
    id: "m1",
    name: "Овсянка с ягодами",
    kcal: 320,
    protein: 11,
    fat: 7,
    carbs: 52,
    time: "08:30",
    emoji: "🥣",
  },
  {
    id: "m2",
    name: "Греческий салат с тунцом",
    kcal: 410,
    protein: 28,
    fat: 22,
    carbs: 18,
    time: "13:10",
    emoji: "🥗",
  },
  {
    id: "m3",
    name: "Яблоко и горсть миндаля",
    kcal: 190,
    protein: 5,
    fat: 12,
    carbs: 20,
    time: "16:00",
    emoji: "🍎",
  },
];

// ── Препараты ───────────────────────────────────────────────────────────────

export type Med = {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken: boolean;
};

export const meds: Med[] = [
  { id: "med1", name: "Метформин", dose: "1000 мг", time: "09:00", taken: true },
  { id: "med2", name: "Левотироксин", dose: "50 мкг", time: "08:00", taken: true },
  { id: "med3", name: "Метформин (вечер)", dose: "1000 мг", time: "21:00", taken: false },
];

// ── Врач и чат ───────────────────────────────────────────────────────────────

export const doctor = {
  name: "Иванова Мария Петровна",
  role: "врач-эндокринолог",
  clinic: "Клиника «Эндолайн»",
  initials: "ИМ",
  online: true,
  nextAppointment: "12 июня, 11:30",
};

export type ChatMessage = {
  id: string;
  from: "doctor" | "me";
  text: string;
  time: string;
};

export const chatSeed: ChatMessage[] = [
  {
    id: "c1",
    from: "doctor",
    text: "Анна, добрый день! Вижу, что сахар стабилизировался — отлично. Продолжайте текущую схему.",
    time: "10:24",
  },
  {
    id: "c2",
    from: "me",
    text: "Спасибо! Чувствую себя заметно лучше, утренние показатели стали ровнее.",
    time: "10:31",
  },
  {
    id: "c3",
    from: "doctor",
    text: "Прекрасно. Не забудьте сдать HbA1c перед следующим приёмом — направление уже в приложении.",
    time: "10:33",
  },
];

// Фейковый автоответ врача после отправки сообщения.
export const doctorAutoReply =
  "Принято, Анна. Посмотрю динамику и вернусь с комментарием к приёму. Хорошего дня!";
