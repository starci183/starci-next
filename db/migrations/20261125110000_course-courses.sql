-- Essentials v2 course catalog (owner 2026-11-25): the course records of the seed standard (set essentials-courses) as versioned json rows,
-- the same shape as course_labs. All additive.

-- One version of a course record: the label is the head of the content hash, a changed record is a new version that supersedes the live one.
create table public.course_courses (
    id uuid primary key default gen_random_uuid(),
    course_id text not null,
    version text not null,
    content_hash text not null,
    record jsonb not null,
    published boolean not null default true,
    created_at timestamptz not null,
    constraint course_courses_natural_key unique (course_id, version),
    constraint ck_course_courses_hash check (content_hash ~ '^[0-9a-f]{64}$')
);

-- At most one live version per course.
create unique index ux_course_courses_published on public.course_courses (course_id) where published;

alter table public.course_courses enable row level security;
alter table public.course_courses force row level security;

revoke all on table public.course_courses from public;
grant select, insert, update, delete on table public.course_courses to app_be;

create policy course_courses_app_be_all on public.course_courses
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
