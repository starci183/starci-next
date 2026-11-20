-- The trusted application role and the boundary of every table of the baseline (the same statements the baseline ends with, idempotent): a database that
-- recorded the baseline as applied (adopted from the TypeORM era) gets the role, forced row security, grants and policies here; a fresh database
-- already has them and this file changes nothing there.

do $$
begin
    if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_be') then
        create role app_be login noinherit nosuperuser nobypassrls nocreatedb nocreaterole;
    end if;
end;
$$;

alter role app_be login noinherit nocreatedb nocreaterole;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

grant usage on schema public to app_be;
grant usage, select, update on sequence public.purchase_order_codes to app_be;

alter table public.career_experience_items enable row level security;
alter table public.career_experience_items force row level security;
revoke all on table public.career_experience_items from public;
grant select, insert, update, delete on table public.career_experience_items to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'career_experience_items' and policyname = 'career_experience_items_app_be_all') then
        create policy career_experience_items_app_be_all on public.career_experience_items
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.career_review_decisions enable row level security;
alter table public.career_review_decisions force row level security;
revoke all on table public.career_review_decisions from public;
grant select, insert, update, delete on table public.career_review_decisions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'career_review_decisions' and policyname = 'career_review_decisions_app_be_all') then
        create policy career_review_decisions_app_be_all on public.career_review_decisions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.career_reviewers enable row level security;
alter table public.career_reviewers force row level security;
revoke all on table public.career_reviewers from public;
grant select, insert, update, delete on table public.career_reviewers to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'career_reviewers' and policyname = 'career_reviewers_app_be_all') then
        create policy career_reviewers_app_be_all on public.career_reviewers
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;
revoke all on table public.entitlements from public;
grant select, insert, update, delete on table public.entitlements to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'entitlements' and policyname = 'entitlements_app_be_all') then
        create policy entitlements_app_be_all on public.entitlements
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.harness_build_bindings enable row level security;
alter table public.harness_build_bindings force row level security;
revoke all on table public.harness_build_bindings from public;
grant select, insert, update, delete on table public.harness_build_bindings to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'harness_build_bindings' and policyname = 'harness_build_bindings_app_be_all') then
        create policy harness_build_bindings_app_be_all on public.harness_build_bindings
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.harness_contents enable row level security;
alter table public.harness_contents force row level security;
revoke all on table public.harness_contents from public;
grant select, insert, update, delete on table public.harness_contents to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'harness_contents' and policyname = 'harness_contents_app_be_all') then
        create policy harness_contents_app_be_all on public.harness_contents
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.harness_stage_proofs enable row level security;
alter table public.harness_stage_proofs force row level security;
revoke all on table public.harness_stage_proofs from public;
grant select, insert, update, delete on table public.harness_stage_proofs to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'harness_stage_proofs' and policyname = 'harness_stage_proofs_app_be_all') then
        create policy harness_stage_proofs_app_be_all on public.harness_stage_proofs
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.http_security_rate_windows enable row level security;
alter table public.http_security_rate_windows force row level security;
revoke all on table public.http_security_rate_windows from public;
grant select, insert, update, delete on table public.http_security_rate_windows to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'http_security_rate_windows' and policyname = 'http_security_rate_windows_app_be_all') then
        create policy http_security_rate_windows_app_be_all on public.http_security_rate_windows
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.inbox_claims enable row level security;
alter table public.inbox_claims force row level security;
revoke all on table public.inbox_claims from public;
grant select, insert, update, delete on table public.inbox_claims to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'inbox_claims' and policyname = 'inbox_claims_app_be_all') then
        create policy inbox_claims_app_be_all on public.inbox_claims
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_attempts enable row level security;
alter table public.lesson_attempts force row level security;
revoke all on table public.lesson_attempts from public;
grant select, insert, update, delete on table public.lesson_attempts to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_attempts' and policyname = 'lesson_attempts_app_be_all') then
        create policy lesson_attempts_app_be_all on public.lesson_attempts
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_completions enable row level security;
alter table public.lesson_completions force row level security;
revoke all on table public.lesson_completions from public;
grant select, insert, update, delete on table public.lesson_completions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_completions' and policyname = 'lesson_completions_app_be_all') then
        create policy lesson_completions_app_be_all on public.lesson_completions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_hint_uses enable row level security;
alter table public.lesson_hint_uses force row level security;
revoke all on table public.lesson_hint_uses from public;
grant select, insert, update, delete on table public.lesson_hint_uses to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_hint_uses' and policyname = 'lesson_hint_uses_app_be_all') then
        create policy lesson_hint_uses_app_be_all on public.lesson_hint_uses
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_incident_scores enable row level security;
alter table public.lesson_incident_scores force row level security;
revoke all on table public.lesson_incident_scores from public;
grant select, insert, update, delete on table public.lesson_incident_scores to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_incident_scores' and policyname = 'lesson_incident_scores_app_be_all') then
        create policy lesson_incident_scores_app_be_all on public.lesson_incident_scores
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_outcome_levels enable row level security;
alter table public.lesson_outcome_levels force row level security;
revoke all on table public.lesson_outcome_levels from public;
grant select, insert, update, delete on table public.lesson_outcome_levels to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_outcome_levels' and policyname = 'lesson_outcome_levels_app_be_all') then
        create policy lesson_outcome_levels_app_be_all on public.lesson_outcome_levels
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_section_reads enable row level security;
alter table public.lesson_section_reads force row level security;
revoke all on table public.lesson_section_reads from public;
grant select, insert, update, delete on table public.lesson_section_reads to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_section_reads' and policyname = 'lesson_section_reads_app_be_all') then
        create policy lesson_section_reads_app_be_all on public.lesson_section_reads
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_simulation_progress enable row level security;
alter table public.lesson_simulation_progress force row level security;
revoke all on table public.lesson_simulation_progress from public;
grant select, insert, update, delete on table public.lesson_simulation_progress to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_simulation_progress' and policyname = 'lesson_simulation_progress_app_be_all') then
        create policy lesson_simulation_progress_app_be_all on public.lesson_simulation_progress
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_topics enable row level security;
alter table public.lesson_topics force row level security;
revoke all on table public.lesson_topics from public;
grant select, insert, update, delete on table public.lesson_topics to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_topics' and policyname = 'lesson_topics_app_be_all') then
        create policy lesson_topics_app_be_all on public.lesson_topics
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.lesson_versions enable row level security;
alter table public.lesson_versions force row level security;
revoke all on table public.lesson_versions from public;
grant select, insert, update, delete on table public.lesson_versions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'lesson_versions' and policyname = 'lesson_versions_app_be_all') then
        create policy lesson_versions_app_be_all on public.lesson_versions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.mcp_access_tokens enable row level security;
alter table public.mcp_access_tokens force row level security;
revoke all on table public.mcp_access_tokens from public;
grant select, insert, update, delete on table public.mcp_access_tokens to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'mcp_access_tokens' and policyname = 'mcp_access_tokens_app_be_all') then
        create policy mcp_access_tokens_app_be_all on public.mcp_access_tokens
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.mcp_vector_points enable row level security;
alter table public.mcp_vector_points force row level security;
revoke all on table public.mcp_vector_points from public;
grant select, insert, update, delete on table public.mcp_vector_points to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'mcp_vector_points' and policyname = 'mcp_vector_points_app_be_all') then
        create policy mcp_vector_points_app_be_all on public.mcp_vector_points
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.notes enable row level security;
alter table public.notes force row level security;
revoke all on table public.notes from public;
grant select, insert, update, delete on table public.notes to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'notes' and policyname = 'notes_app_be_all') then
        create policy notes_app_be_all on public.notes
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.notifications enable row level security;
alter table public.notifications force row level security;
revoke all on table public.notifications from public;
grant select, insert, update, delete on table public.notifications to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_app_be_all') then
        create policy notifications_app_be_all on public.notifications
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.path_choices enable row level security;
alter table public.path_choices force row level security;
revoke all on table public.path_choices from public;
grant select, insert, update, delete on table public.path_choices to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'path_choices' and policyname = 'path_choices_app_be_all') then
        create policy path_choices_app_be_all on public.path_choices
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.practice_hint_reveals enable row level security;
alter table public.practice_hint_reveals force row level security;
revoke all on table public.practice_hint_reveals from public;
grant select, insert, update, delete on table public.practice_hint_reveals to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'practice_hint_reveals' and policyname = 'practice_hint_reveals_app_be_all') then
        create policy practice_hint_reveals_app_be_all on public.practice_hint_reveals
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.practice_pattern_intros enable row level security;
alter table public.practice_pattern_intros force row level security;
revoke all on table public.practice_pattern_intros from public;
grant select, insert, update, delete on table public.practice_pattern_intros to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'practice_pattern_intros' and policyname = 'practice_pattern_intros_app_be_all') then
        create policy practice_pattern_intros_app_be_all on public.practice_pattern_intros
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.practice_problem_versions enable row level security;
alter table public.practice_problem_versions force row level security;
revoke all on table public.practice_problem_versions from public;
grant select, insert, update, delete on table public.practice_problem_versions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'practice_problem_versions' and policyname = 'practice_problem_versions_app_be_all') then
        create policy practice_problem_versions_app_be_all on public.practice_problem_versions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.practice_solution_reveals enable row level security;
alter table public.practice_solution_reveals force row level security;
revoke all on table public.practice_solution_reveals from public;
grant select, insert, update, delete on table public.practice_solution_reveals to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'practice_solution_reveals' and policyname = 'practice_solution_reveals_app_be_all') then
        create policy practice_solution_reveals_app_be_all on public.practice_solution_reveals
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.practice_submissions enable row level security;
alter table public.practice_submissions force row level security;
revoke all on table public.practice_submissions from public;
grant select, insert, update, delete on table public.practice_submissions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'practice_submissions' and policyname = 'practice_submissions_app_be_all') then
        create policy practice_submissions_app_be_all on public.practice_submissions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.profile_learners enable row level security;
alter table public.profile_learners force row level security;
revoke all on table public.profile_learners from public;
grant select, insert, update, delete on table public.profile_learners to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'profile_learners' and policyname = 'profile_learners_app_be_all') then
        create policy profile_learners_app_be_all on public.profile_learners
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_check_documents enable row level security;
alter table public.project_check_documents force row level security;
revoke all on table public.project_check_documents from public;
grant select, insert, update, delete on table public.project_check_documents to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_check_documents' and policyname = 'project_check_documents_app_be_all') then
        create policy project_check_documents_app_be_all on public.project_check_documents
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_ci_runs enable row level security;
alter table public.project_ci_runs force row level security;
revoke all on table public.project_ci_runs from public;
grant select, insert, update, delete on table public.project_ci_runs to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_ci_runs' and policyname = 'project_ci_runs_app_be_all') then
        create policy project_ci_runs_app_be_all on public.project_ci_runs
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_concepts enable row level security;
alter table public.project_concepts force row level security;
revoke all on table public.project_concepts from public;
grant select, insert, update, delete on table public.project_concepts to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_concepts' and policyname = 'project_concepts_app_be_all') then
        create policy project_concepts_app_be_all on public.project_concepts
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_evidence enable row level security;
alter table public.project_evidence force row level security;
revoke all on table public.project_evidence from public;
grant select, insert, update, delete on table public.project_evidence to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_evidence' and policyname = 'project_evidence_app_be_all') then
        create policy project_evidence_app_be_all on public.project_evidence
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_probe_runs enable row level security;
alter table public.project_probe_runs force row level security;
revoke all on table public.project_probe_runs from public;
grant select, insert, update, delete on table public.project_probe_runs to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_probe_runs' and policyname = 'project_probe_runs_app_be_all') then
        create policy project_probe_runs_app_be_all on public.project_probe_runs
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.project_proofs enable row level security;
alter table public.project_proofs force row level security;
revoke all on table public.project_proofs from public;
grant select, insert, update, delete on table public.project_proofs to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'project_proofs' and policyname = 'project_proofs_app_be_all') then
        create policy project_proofs_app_be_all on public.project_proofs
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.projects enable row level security;
alter table public.projects force row level security;
revoke all on table public.projects from public;
grant select, insert, update, delete on table public.projects to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_app_be_all') then
        create policy projects_app_be_all on public.projects
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.purchase_events enable row level security;
alter table public.purchase_events force row level security;
revoke all on table public.purchase_events from public;
grant select, insert, update, delete on table public.purchase_events to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'purchase_events' and policyname = 'purchase_events_app_be_all') then
        create policy purchase_events_app_be_all on public.purchase_events
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.purchases enable row level security;
alter table public.purchases force row level security;
revoke all on table public.purchases from public;
grant select, insert, update, delete on table public.purchases to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'purchases' and policyname = 'purchases_app_be_all') then
        create policy purchases_app_be_all on public.purchases
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.relay_devices enable row level security;
alter table public.relay_devices force row level security;
revoke all on table public.relay_devices from public;
grant select, insert, update, delete on table public.relay_devices to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'relay_devices' and policyname = 'relay_devices_app_be_all') then
        create policy relay_devices_app_be_all on public.relay_devices
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.relay_events enable row level security;
alter table public.relay_events force row level security;
revoke all on table public.relay_events from public;
grant select, insert, update, delete on table public.relay_events to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'relay_events' and policyname = 'relay_events_app_be_all') then
        create policy relay_events_app_be_all on public.relay_events
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_answers enable row level security;
alter table public.review_answers force row level security;
revoke all on table public.review_answers from public;
grant select, insert, update, delete on table public.review_answers to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_answers' and policyname = 'review_answers_app_be_all') then
        create policy review_answers_app_be_all on public.review_answers
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_cards enable row level security;
alter table public.review_cards force row level security;
revoke all on table public.review_cards from public;
grant select, insert, update, delete on table public.review_cards to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_cards' and policyname = 'review_cards_app_be_all') then
        create policy review_cards_app_be_all on public.review_cards
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_deck_versions enable row level security;
alter table public.review_deck_versions force row level security;
revoke all on table public.review_deck_versions from public;
grant select, insert, update, delete on table public.review_deck_versions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_deck_versions' and policyname = 'review_deck_versions_app_be_all') then
        create policy review_deck_versions_app_be_all on public.review_deck_versions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_decks enable row level security;
alter table public.review_decks force row level security;
revoke all on table public.review_decks from public;
grant select, insert, update, delete on table public.review_decks to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_decks' and policyname = 'review_decks_app_be_all') then
        create policy review_decks_app_be_all on public.review_decks
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_learner_decks enable row level security;
alter table public.review_learner_decks force row level security;
revoke all on table public.review_learner_decks from public;
grant select, insert, update, delete on table public.review_learner_decks to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_learner_decks' and policyname = 'review_learner_decks_app_be_all') then
        create policy review_learner_decks_app_be_all on public.review_learner_decks
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_reviews enable row level security;
alter table public.review_reviews force row level security;
revoke all on table public.review_reviews from public;
grant select, insert, update, delete on table public.review_reviews to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_reviews' and policyname = 'review_reviews_app_be_all') then
        create policy review_reviews_app_be_all on public.review_reviews
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_settings enable row level security;
alter table public.review_settings force row level security;
revoke all on table public.review_settings from public;
grant select, insert, update, delete on table public.review_settings to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_settings' and policyname = 'review_settings_app_be_all') then
        create policy review_settings_app_be_all on public.review_settings
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.review_states enable row level security;
alter table public.review_states force row level security;
revoke all on table public.review_states from public;
grant select, insert, update, delete on table public.review_states to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'review_states' and policyname = 'review_states_app_be_all') then
        create policy review_states_app_be_all on public.review_states
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.streak_actions enable row level security;
alter table public.streak_actions force row level security;
revoke all on table public.streak_actions from public;
grant select, insert, update, delete on table public.streak_actions to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'streak_actions' and policyname = 'streak_actions_app_be_all') then
        create policy streak_actions_app_be_all on public.streak_actions
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;

alter table public.streak_states enable row level security;
alter table public.streak_states force row level security;
revoke all on table public.streak_states from public;
grant select, insert, update, delete on table public.streak_states to app_be;
do $$
begin
    if not exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'streak_states' and policyname = 'streak_states_app_be_all') then
        create policy streak_states_app_be_all on public.streak_states
            for all to app_be using (current_user = 'app_be') with check (current_user = 'app_be');
    end if;
end;
$$;
