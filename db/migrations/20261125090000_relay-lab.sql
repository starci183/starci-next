-- Essentials v2 lab relay (owner 2026-11-24): the state a learner's machine last synced for one lesson's lab, the submissions graded on
-- the learner's machine, the web-issued six-digit pairing codes, the client event ids of the lab uploads (the idempotency record: the lab
-- uploads change state rather than add rows to relay_events) and the Ed25519 device key a grading result is signed with. All additive.

-- The lab of one lesson for one learner: boot stages by stage name, the last visible-test run, the mirrored files and the chaos switches on.
create table public.relay_lab_states (
    id uuid primary key default gen_random_uuid(),
    learner_id uuid not null,
    course_id text not null,
    lesson_id text not null,
    device_id uuid not null,
    boot jsonb not null default '{}'::jsonb,
    tests jsonb,
    files jsonb,
    chaos_on jsonb not null default '[]'::jsonb,
    last_synced_at timestamptz,
    updated_at timestamptz not null,
    constraint relay_lab_states_natural_key unique (learner_id, course_id, lesson_id)
);

-- One submission of a lab: graded on the learner's machine against the hidden tests, in the random order seed_order, bound to its nonce.
create table public.relay_lab_submissions (
    id uuid primary key default gen_random_uuid(),
    learner_id uuid not null,
    course_id text not null,
    lesson_id text not null,
    nonce text not null,
    seed_order jsonb not null,
    commit_sha text,
    status text not null,
    tests jsonb,
    passed boolean not null default false,
    reject_reason text,
    hints_opened integer not null default 0,
    time_spent_ms integer not null default 0,
    design_doc jsonb not null default '[]'::jsonb,
    device_id uuid not null,
    created_at timestamptz not null,
    graded_at timestamptz,
    constraint ck_relay_lab_submissions_status check (status = any (array['queued'::text, 'running'::text, 'graded'::text, 'rejected'::text])),
    constraint ck_relay_lab_submissions_nonce check (nonce ~ '^[0-9a-f]{64}$'),
    constraint ck_relay_lab_submissions_commit check (commit_sha is null or commit_sha ~ '^[0-9a-f]{40}$'),
    constraint ck_relay_lab_submissions_counts check (hints_opened >= 0 and time_spent_ms >= 0)
);

create index ix_relay_lab_submissions_lab on public.relay_lab_submissions (learner_id, course_id, lesson_id, created_at desc);

-- A pairing code the signed-in learner asked for on the web: six digits, stored by its digest, one use, ten minutes.
create table public.relay_pair_codes (
    id uuid primary key default gen_random_uuid(),
    code_digest varchar(64) not null,
    learner_id uuid not null,
    created_at timestamptz not null,
    expires_at timestamptz not null,
    used_at timestamptz,
    constraint relay_pair_codes_natural_key unique (code_digest)
);

create index ix_relay_pair_codes_learner on public.relay_pair_codes (learner_id);

-- The client event ids of the lab uploads a device sent, so a resend changes nothing twice.
create table public.relay_lab_events (
    id uuid primary key default gen_random_uuid(),
    device_id uuid not null,
    event_id uuid not null,
    created_at timestamptz not null,
    constraint relay_lab_events_natural_key unique (device_id, event_id)
);

-- The base64 SPKI Ed25519 public key a device registered once; a new key needs a new pairing (a new device row).
alter table public.relay_devices add column if not exists public_key text;

alter table public.relay_lab_states enable row level security;
alter table public.relay_lab_states force row level security;
alter table public.relay_lab_submissions enable row level security;
alter table public.relay_lab_submissions force row level security;
alter table public.relay_pair_codes enable row level security;
alter table public.relay_pair_codes force row level security;
alter table public.relay_lab_events enable row level security;
alter table public.relay_lab_events force row level security;

revoke all on table public.relay_lab_states from public;
revoke all on table public.relay_lab_submissions from public;
revoke all on table public.relay_pair_codes from public;
revoke all on table public.relay_lab_events from public;
grant select, insert, update, delete on table public.relay_lab_states to app_be;
grant select, insert, update, delete on table public.relay_lab_submissions to app_be;
grant select, insert, update, delete on table public.relay_pair_codes to app_be;
grant select, insert, update, delete on table public.relay_lab_events to app_be;

create policy relay_lab_states_app_be_all on public.relay_lab_states
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
create policy relay_lab_submissions_app_be_all on public.relay_lab_submissions
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
create policy relay_pair_codes_app_be_all on public.relay_pair_codes
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
create policy relay_lab_events_app_be_all on public.relay_lab_events
    for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
