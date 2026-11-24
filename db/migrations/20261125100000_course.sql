-- Essentials v2 course (owner 2026-11-25): the lab@2 lesson records of the seed standard as versioned json rows, the runs a learner's
-- machine uploads for each case of a lab, and the per-case marks (hints opened, ever green, the last reset). All additive.

-- One version of a lab record: the label is the head of the content hash, a changed record is a new version that supersedes the live one.
create table public.course_labs (
    id uuid primary key default gen_random_uuid(),
    lesson_id text not null,
    version text not null,
    content_hash text not null,
    record jsonb not null,
    published boolean not null default true,
    created_at timestamptz not null,
    constraint course_labs_natural_key unique (lesson_id, version),
    constraint ck_course_labs_hash check (content_hash ~ '^[0-9a-f]{64}$')
);

-- At most one live version per lesson.
create unique index ux_course_labs_published on public.course_labs (lesson_id) where published;

-- One uploaded run of one case on a learner's machine; the client event id makes a resend change nothing twice.
create table public.course_case_runs (
    id uuid primary key default gen_random_uuid(),
    learner_id uuid not null,
    lesson_id text not null,
    case_id text not null,
    kind text not null,
    status text not null,
    ran_at timestamptz not null,
    duration_ms integer not null,
    learner_commit text not null,
    chaos jsonb not null default '{}'::jsonb,
    up_to jsonb not null default '[]'::jsonb,
    failed jsonb,
    event_id uuid not null,
    created_at timestamptz not null,
    constraint course_case_runs_natural_key unique (learner_id, event_id),
    constraint ck_course_case_runs_kind check (kind = any (array['happy'::text, 'unhappy'::text])),
    constraint ck_course_case_runs_status check (status = any (array['green'::text, 'red'::text, 'error'::text])),
    constraint ck_course_case_runs_duration check (duration_ms >= 0)
);

create index ix_course_case_runs_case on public.course_case_runs (learner_id, lesson_id, case_id, ran_at desc);

-- What a learner has done with one case: hints opened (a level opens only after the one below), whether it ever ran green and the last reset.
create table public.course_case_marks (
    id uuid primary key default gen_random_uuid(),
    learner_id uuid not null,
    lesson_id text not null,
    case_id text not null,
    hints_opened integer not null default 0,
    ever_green boolean not null default false,
    last_reset_at timestamptz,
    stashed_branch text,
    updated_at timestamptz not null,
    constraint course_case_marks_natural_key unique (learner_id, lesson_id, case_id),
    constraint ck_course_case_marks_hints check (hints_opened between 0 and 3)
);

alter table public.course_labs enable row level security;
alter table public.course_labs force row level security;
alter table public.course_case_runs enable row level security;
alter table public.course_case_runs force row level security;
alter table public.course_case_marks enable row level security;
alter table public.course_case_marks force row level security;

revoke all on table public.course_labs from public;
revoke all on table public.course_case_runs from public;
revoke all on table public.course_case_marks from public;
grant select, insert, update, delete on table public.course_labs to app_be;
grant select, insert, update, delete on table public.course_case_runs to app_be;
grant select, insert, update, delete on table public.course_case_marks to app_be;

create policy course_labs_app_be_all on public.course_labs
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
create policy course_case_runs_app_be_all on public.course_case_runs
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
create policy course_case_marks_app_be_all on public.course_case_marks
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
