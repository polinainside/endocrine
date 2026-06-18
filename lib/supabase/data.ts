import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayLog, LabSeries, Meal, Med } from "@/lib/mock";

// ─────────────────────────────────────────────────────────────────────────
// Чтение и трансформация данных пользователя из Supabase в формы приложения.
// Всё под RLS (браузерный клиент с сессией) — каждый видит только свои строки.
// ─────────────────────────────────────────────────────────────────────────

export type Diagnosis = { title: string; code: string };

export type Patient = {
  name: string;
  fullName: string;
  initials: string;
  age: number;
  sex: string;
  birthDate: string;
  height: number;
  weight: number;
  bmi: number;
  bloodType: string;
  observedSince: string;
  allergies: string;
  patientId: string;
  steps: number;
  weightSource: string;
  stepsSource: string;
  nextLabInDays: number;
  diagnoses: Diagnosis[];
};

export type Doctor = {
  name: string;
  role: string;
  clinic: string;
  initials: string;
  online: boolean;
  nextAppointment: string;
};

export type Sensor = {
  name: string;
  model: string;
  battery: number;
  lastSyncMin: number;
  wearDaysLeft: number;
  intervalMin: number;
  type: string;
  placement: string;
  description: string;
};

export type AppData = {
  patient: Patient;
  doctor: Doctor;
  sensor: Sensor;
  labs: Record<string, LabSeries>;
  labOrder: string[];
  meds: Med[];
  week: DayLog[];
};

const BUCKET = "meal-photos";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayLabels(offset: number, date: Date): { label: string; short: string } {
  if (offset === 0) return { label: "Сегодня", short: "Сег" };
  if (offset === 1) return { label: "Вчера", short: "Вчр" };
  return {
    label: cap(new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date)),
    short: cap(new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date)),
  };
}

function photoUrl(client: SupabaseClient, path: string | null): string | undefined {
  if (!path) return undefined;
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToMeal(client: SupabaseClient, r: Record<string, unknown>): Meal {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    kcal: Number(r.kcal ?? 0),
    protein: Number(r.protein ?? 0),
    fat: Number(r.fat ?? 0),
    carbs: Number(r.carbs ?? 0),
    time: String(r.time ?? ""),
    emoji: String(r.emoji ?? "🍽️"),
    photo: photoUrl(client, (r.photo_path as string) ?? null),
  };
}

// Группирует строки meals в неделю (7 дней, сегодня первым).
export function buildWeek(client: SupabaseClient, rows: Record<string, unknown>[]): DayLog[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week: DayLog[] = [];
  for (let off = 0; off < 7; off++) {
    const date = new Date(today);
    date.setDate(today.getDate() - off);
    const key = ymd(date);
    const meals = rows
      .filter((r) => String(r.eaten_on) === key)
      .map((r) => rowToMeal(client, r));
    const { label, short } = dayLabels(off, date);
    week.push({ id: `d${off}`, label, short, meals });
  }
  return week;
}

export async function loadAppData(client: SupabaseClient): Promise<AppData> {
  const [profileRes, labsRes, medsRes, mealsRes] = await Promise.all([
    client.from("profiles").select("*").maybeSingle(),
    client.from("labs").select("*").order("sort"),
    client.from("meds").select("*").order("sort"),
    client.from("meals").select("*").order("eaten_on", { ascending: false }).order("time", { ascending: true }),
  ]);

  if (profileRes.error) throw profileRes.error;
  const p = profileRes.data;
  if (!p) throw new Error("Профиль не найден");

  const patient: Patient = {
    name: p.name,
    fullName: p.full_name,
    initials: p.initials,
    age: p.age,
    sex: p.sex,
    birthDate: p.birth_date,
    height: p.height,
    weight: Number(p.weight),
    bmi: Number(p.bmi),
    bloodType: p.blood_type,
    observedSince: p.observed_since,
    allergies: p.allergies,
    patientId: p.patient_id,
    steps: p.steps,
    weightSource: p.weight_source,
    stepsSource: p.steps_source,
    nextLabInDays: p.next_lab_in_days,
    diagnoses: Array.isArray(p.diagnoses) ? p.diagnoses : [],
  };

  const labs: Record<string, LabSeries> = {};
  const labOrder: string[] = [];
  for (const row of labsRes.data ?? []) {
    labs[row.key] = {
      key: row.key,
      title: row.title,
      unit: row.unit,
      target: Number(row.target),
      targetLabel: row.target_label,
      history: Array.isArray(row.history) ? row.history : [],
    };
    labOrder.push(row.key);
  }

  const meds: Med[] = (medsRes.data ?? []).map((m) => ({
    id: String(m.id),
    name: m.name,
    dose: m.dose,
    time: m.time,
    taken: !!m.taken,
  }));

  const week = buildWeek(client, mealsRes.data ?? []);

  return { patient, doctor: p.doctor, sensor: p.sensor, labs, labOrder, meds, week };
}

// ── Мутаторы ────────────────────────────────────────────────────────────────

// Добавляет приём пищи на сегодня; при наличии фото грузит его в Storage.
export async function insertMeal(
  client: SupabaseClient,
  userId: string,
  meal: Omit<Meal, "id" | "photo">,
  photoBlob: Blob | null,
): Promise<Meal> {
  let photo_path: string | null = null;
  if (photoBlob) {
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const up = await client.storage.from(BUCKET).upload(path, photoBlob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (!up.error) photo_path = path;
    else console.error("photo upload failed", up.error.message);
  }

  const today = new Date();
  const eaten_on = ymd(today);
  const { data, error } = await client
    .from("meals")
    .insert({
      user_id: userId,
      eaten_on,
      name: meal.name,
      kcal: meal.kcal,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
      time: meal.time,
      emoji: meal.emoji,
      photo_path,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToMeal(client, data);
}

export async function setMedTaken(client: SupabaseClient, id: string, taken: boolean): Promise<void> {
  const { error } = await client.from("meds").update({ taken }).eq("id", id);
  if (error) throw error;
}
