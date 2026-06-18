-- ─────────────────────────────────────────────────────────────────────────
-- Схема Supabase для «Дневника пациента». Вставить целиком в SQL Editor.
-- Создаёт таблицы, RLS (каждый видит только свои строки), бакет для фото и
-- триггер, который наполняет нового пользователя демо-данными.
-- Идемпотентно: можно выполнять повторно.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Таблицы ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  name text, full_name text, initials text,
  age int, sex text, birth_date text, height int, weight numeric, bmi numeric,
  blood_type text, observed_since text, allergies text, patient_id text,
  steps int, weight_source text, steps_source text, next_lab_in_days int,
  diagnoses jsonb not null default '[]',
  doctor jsonb,
  sensor jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  key text not null, title text, unit text,
  target numeric, target_label text,
  history jsonb not null default '[]',
  sort int not null default 0
);

create table if not exists public.meds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text, dose text, time text,
  taken boolean not null default false,
  sort int not null default 0
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  eaten_on date not null default current_date,
  name text, kcal int, protein int, fat int, carbs int,
  time text, emoji text, photo_path text,
  created_at timestamptz not null default now()
);

-- ── RLS: каждый пользователь — только свои строки ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.labs     enable row level security;
alter table public.meds     enable row level security;
alter table public.meals    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','labs','meds','meals'] loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ── Storage: бакет для фото блюд ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

drop policy if exists meal_photos_read on storage.objects;
create policy meal_photos_read on storage.objects for select to public
  using (bucket_id = 'meal-photos');

drop policy if exists meal_photos_write on storage.objects;
create policy meal_photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists meal_photos_modify on storage.objects;
create policy meal_photos_modify on storage.objects for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists meal_photos_delete on storage.objects;
create policy meal_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Сид демо-данными для нового пользователя ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare uid uuid := new.id;
begin
  -- профиль
  insert into public.profiles (
    user_id, name, full_name, initials, age, sex, birth_date, height, weight, bmi,
    blood_type, observed_since, allergies, patient_id, steps, weight_source, steps_source,
    next_lab_in_days, diagnoses, doctor, sensor)
  values (
    uid, 'Анна', 'Анна Соколова', 'АС', 34, 'жен.', '14.03.1992', 168, 72, 25.5,
    'II (A) Rh+', 'сентябрь 2024', 'Пенициллин', '00482', 6540, 'введён вручную', 'смартфон', 5,
    '[{"title":"Сахарный диабет 2 типа","code":"E11"},{"title":"Гипотиреоз","code":"E03.9"}]'::jsonb,
    '{"name":"Иванова Мария Петровна","role":"врач-эндокринолог","clinic":"Клиника «Эндолайн»","initials":"ИМ","online":true,"nextAppointment":"12 июня, 11:30"}'::jsonb,
    '{"name":"NovaSense","model":"CGM G4","battery":82,"lastSyncMin":2,"wearDaysLeft":9,"intervalMin":5,"type":"Непрерывный мониторинг глюкозы (CGM)","placement":"левое плечо","description":"Сенсор крепится на плечо и автоматически передаёт данные в приложение каждые 5 минут по Bluetooth — без проколов пальца и ручного ввода."}'::jsonb)
  on conflict (user_id) do nothing;

  -- анализы
  insert into public.labs (user_id, key, title, unit, target, target_label, history, sort) values
  (uid,'hba1c','HbA1c','%',6.5,'цель < 6.5%',
   '[{"date":"12.2025","value":8.1,"status":"alarm"},{"date":"01.2026","value":7.6,"status":"alarm"},{"date":"02.2026","value":7.2,"status":"warn"},{"date":"03.2026","value":6.9,"status":"warn"},{"date":"04.2026","value":6.7,"status":"warn"},{"date":"05.2026","value":6.4,"status":"ok"}]'::jsonb,0),
  (uid,'fastingGlu','Глюкоза натощак','ммоль/л',5.5,'цель < 5.5',
   '[{"date":"12.2025","value":7.8,"status":"alarm"},{"date":"01.2026","value":7.1,"status":"alarm"},{"date":"02.2026","value":6.6,"status":"warn"},{"date":"03.2026","value":6.2,"status":"warn"},{"date":"04.2026","value":5.8,"status":"warn"},{"date":"05.2026","value":5.4,"status":"ok"}]'::jsonb,1),
  (uid,'tsh','ТТГ','мМЕ/л',4.0,'норма 0.4–4.0',
   '[{"date":"12.2025","value":3.1,"status":"ok"},{"date":"01.2026","value":3.4,"status":"ok"},{"date":"02.2026","value":3.0,"status":"ok"},{"date":"03.2026","value":2.8,"status":"ok"},{"date":"04.2026","value":2.9,"status":"ok"},{"date":"05.2026","value":2.6,"status":"ok"}]'::jsonb,2),
  (uid,'cholesterol','Холестерин','ммоль/л',5.0,'цель < 5.0',
   '[{"date":"12.2025","value":6.2,"status":"alarm"},{"date":"01.2026","value":5.9,"status":"warn"},{"date":"02.2026","value":5.6,"status":"warn"},{"date":"03.2026","value":5.4,"status":"warn"},{"date":"04.2026","value":5.2,"status":"warn"},{"date":"05.2026","value":4.9,"status":"ok"}]'::jsonb,3);

  -- препараты
  insert into public.meds (user_id, name, dose, time, taken, sort) values
  (uid,'Метформин','1000 мг','09:00',true,0),
  (uid,'Левотироксин','50 мкг','08:00',true,1),
  (uid,'Метформин (вечер)','1000 мг','21:00',false,2);

  -- питание за 7 дней (eaten_on относительно текущей даты)
  insert into public.meals (user_id, eaten_on, name, kcal, protein, fat, carbs, time, emoji) values
  (uid, current_date, 'Овсянка с ягодами',320,11,7,52,'08:30','🥣'),
  (uid, current_date, 'Греческий салат с тунцом',410,28,22,18,'13:10','🥗'),
  (uid, current_date, 'Яблоко и горсть миндаля',190,5,12,20,'16:00','🍎'),
  (uid, current_date-1, 'Творог с орехами',280,26,14,12,'08:40','🥛'),
  (uid, current_date-1, 'Куриный суп с овощами',320,24,11,24,'13:30','🍲'),
  (uid, current_date-1, 'Запечённая рыба с брокколи',430,38,18,16,'19:00','🐟'),
  (uid, current_date-2, 'Сырники со сметаной',520,22,26,48,'10:00','🥞'),
  (uid, current_date-2, 'Паста карбонара',680,26,30,78,'15:00','🍝'),
  (uid, current_date-2, 'Кусок торта',420,5,22,52,'18:30','🍰'),
  (uid, current_date-3, 'Омлет с овощами',300,20,20,8,'08:30','🍳'),
  (uid, current_date-3, 'Гречка с курицей',460,34,12,52,'13:30','🍗'),
  (uid, current_date-3, 'Салат с авокадо',320,8,26,14,'19:00','🥑'),
  (uid, current_date-4, 'Овсянка с бананом',360,10,7,64,'08:30','🥣'),
  (uid, current_date-4, 'Бургер с картофелем фри',820,30,42,78,'14:00','🍔'),
  (uid, current_date-4, 'Шаурма',540,26,26,48,'20:00','🌯'),
  (uid, current_date-5, 'Йогурт без сахара с ягодами',220,14,6,26,'08:30','🫐'),
  (uid, current_date-5, 'Тушёная индейка с овощами',420,40,14,28,'13:30','🦃'),
  (uid, current_date-5, 'Овощной салат с нутом',360,14,16,38,'19:00','🥗'),
  (uid, current_date-6, 'Бутерброды с колбасой',480,16,28,42,'08:30','🥪'),
  (uid, current_date-6, 'Плов',620,22,24,78,'14:00','🍚'),
  (uid, current_date-6, 'Печенье к чаю',340,4,14,50,'17:00','🍪');

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
