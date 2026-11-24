-- Essentials v2 lab files (owner 2026-11-25): the files of a lab (the c0 learner checkout, the NestJS version, the hidden grader and the cells it
-- judges) from the seed standard (set essentials-lab-files) as versioned json rows, the same shape as course_labs. SERVER-ONLY: no door of the web
-- reads this table, the relay cuts the tarballs of a paired device from it. All additive.

-- One version of a lab files record: the label is the head of the content hash, a changed record is a new version that supersedes the live one.
create table public.course_lab_files (
    id uuid primary key default gen_random_uuid(),
    lesson_id text not null,
    version text not null,
    content_hash text not null,
    record jsonb not null,
    published boolean not null default true,
    created_at timestamptz not null,
    constraint course_lab_files_natural_key unique (lesson_id, version),
    constraint ck_course_lab_files_hash check (content_hash ~ '^[0-9a-f]{64}$')
);

-- At most one live version per lesson.
create unique index ux_course_lab_files_published on public.course_lab_files (lesson_id) where published;

alter table public.course_lab_files enable row level security;
alter table public.course_lab_files force row level security;

revoke all on table public.course_lab_files from public;
grant select, insert, update, delete on table public.course_lab_files to app_be;

create policy course_lab_files_app_be_all on public.course_lab_files
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
