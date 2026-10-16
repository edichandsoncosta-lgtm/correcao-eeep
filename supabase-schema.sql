-- Execute no Supabase: Editor SQL > Nova consulta > Executar.
-- Pode ser executado novamente com segurança: turmas, alunos e disciplinas existentes serão preservados.
-- A segurança em nível de linha limita cada registro à conta autenticada que o possui.
-- A tabela de professores é restrita ao e-mail administrativo abaixo; mantenha-o igual ao definido em supabase-config.js.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  constraint classes_user_name_unique unique (user_id, name),
  constraint classes_id_user_unique unique (id, user_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 100),
  enrollment text not null check (length(trim(enrollment)) between 1 and 40),
  created_at timestamptz not null default now(),
  constraint students_user_enrollment_unique unique (user_id, enrollment),
  constraint students_class_owner_fk foreign key (class_id, user_id)
    references public.classes(id, user_id) on delete restrict
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint teachers_user_name_unique unique (user_id, name),
  constraint teachers_id_user_unique unique (id, user_id)
);

create table if not exists public.knowledge_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint knowledge_areas_user_name_unique unique (user_id, name),
  constraint knowledge_areas_id_user_unique unique (id, user_id)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  constraint subjects_user_class_name_unique unique (user_id, class_id, name),
  constraint subjects_class_owner_fk foreign key (class_id, user_id)
    references public.classes(id, user_id) on delete restrict
);

create table if not exists public.teacher_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.subjects add column if not exists area_id uuid;
alter table public.subjects add column if not exists teacher_id uuid;
alter table public.subjects alter column class_id drop not null;
alter table public.teacher_workspaces add column if not exists revision integer not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subjects_area_owner_fk') then
    alter table public.subjects add constraint subjects_area_owner_fk
      foreign key (area_id, user_id)
      references public.knowledge_areas(id, user_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subjects_teacher_owner_fk') then
    alter table public.subjects add constraint subjects_teacher_owner_fk
      foreign key (teacher_id, user_id)
      references public.teachers(id, user_id) on delete restrict;
  end if;
end $$;

create index if not exists students_user_class_idx on public.students(user_id, class_id);
create index if not exists subjects_user_class_idx on public.subjects(user_id, class_id);
create index if not exists subjects_user_area_idx on public.subjects(user_id, area_id);
create index if not exists subjects_user_teacher_idx on public.subjects(user_id, teacher_id);
create unique index if not exists subjects_user_general_name_unique
  on public.subjects(user_id, name) where class_id is null;

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.knowledge_areas enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_workspaces enable row level security;

drop policy if exists "Users manage their own classes" on public.classes;
create policy "Users manage their own classes" on public.classes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own students" on public.students;
create policy "Users manage their own students" on public.students
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own teachers" on public.teachers;
drop policy if exists "Administrator manages teachers" on public.teachers;
create policy "Administrator manages teachers" on public.teachers
  for all to authenticated
  using (
    auth.uid() = user_id
    and lower(auth.jwt() ->> 'email') = 'edinhason@gmail.com'
  )
  with check (
    auth.uid() = user_id
    and lower(auth.jwt() ->> 'email') = 'edinhason@gmail.com'
  );

drop policy if exists "Users manage their own knowledge areas" on public.knowledge_areas;
create policy "Users manage their own knowledge areas" on public.knowledge_areas
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own subjects" on public.subjects;
create policy "Users manage their own subjects" on public.subjects
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own workspaces" on public.teacher_workspaces;
create policy "Users manage their own workspaces" on public.teacher_workspaces
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.classes, public.students, public.teachers, public.knowledge_areas, public.subjects, public.teacher_workspaces to authenticated;
