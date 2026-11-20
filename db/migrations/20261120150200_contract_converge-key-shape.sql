-- Reshapes EVERY database, fresh and adopted alike, from the old TypeORM shape of the baseline to the keys the edition requires; each step is guarded by
-- the old shape, so a re-run does nothing. Contract migration: it replaces primary keys, renames a column and drops retired tables.
--   1. career_review_decisions.item_id becomes career_experience_item_id (a foreign key column is named by the table it references).
--   2. every table still keyed by its old key gets `id uuid default gen_random_uuid()` as primary key; the old key columns become the unique
--      constraint <table>_natural_key; the foreign keys that referenced the old key are dropped and re-created on the same columns (now the unique key).
--   3. the retired Keycloak-era identity tables are dropped (ephemeral, read by no code of this release).

do $$
begin
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'career_review_decisions' and column_name = 'item_id') then
        alter table public.career_review_decisions rename column item_id to career_experience_item_id;
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'career_experience_items' and column_name = 'id') then
        alter table public.career_experience_items add constraint career_experience_items_natural_key unique (item_id);
        alter table public.career_review_decisions drop constraint career_review_decisions_item_id_fkey;
        alter table public.career_experience_items drop constraint career_experience_items_pkey;
        alter table public.career_experience_items add column id uuid not null default gen_random_uuid();
        alter table public.career_experience_items add constraint career_experience_items_pkey primary key (id);
        alter table public.career_review_decisions add constraint career_review_decisions_item_id_fkey FOREIGN KEY (career_experience_item_id) REFERENCES public.career_experience_items(item_id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'career_review_decisions' and column_name = 'id') then
        alter table public.career_review_decisions add constraint career_review_decisions_natural_key unique (decision_id);
        alter table public.career_review_decisions drop constraint career_review_decisions_pkey;
        alter table public.career_review_decisions add column id uuid not null default gen_random_uuid();
        alter table public.career_review_decisions add constraint career_review_decisions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'career_reviewers' and column_name = 'id') then
        alter table public.career_reviewers add constraint career_reviewers_natural_key unique (appointment_id);
        alter table public.career_reviewers drop constraint career_reviewers_pkey;
        alter table public.career_reviewers add column id uuid not null default gen_random_uuid();
        alter table public.career_reviewers add constraint career_reviewers_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'entitlements' and column_name = 'id') then
        alter table public.entitlements add constraint entitlements_natural_key unique (learner_id);
        alter table public.entitlements drop constraint entitlements_pkey;
        alter table public.entitlements add column id uuid not null default gen_random_uuid();
        alter table public.entitlements add constraint entitlements_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'harness_build_bindings' and column_name = 'id') then
        alter table public.harness_build_bindings add constraint harness_build_bindings_natural_key unique (learner_id, build_id);
        alter table public.harness_build_bindings drop constraint pk_harness_build_bindings;
        alter table public.harness_build_bindings add column id uuid not null default gen_random_uuid();
        alter table public.harness_build_bindings add constraint harness_build_bindings_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'harness_contents' and column_name = 'id') then
        alter table public.harness_contents add constraint harness_contents_natural_key unique (kind, content_key, version);
        alter table public.harness_contents drop constraint pk_harness_contents;
        alter table public.harness_contents add column id uuid not null default gen_random_uuid();
        alter table public.harness_contents add constraint harness_contents_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'harness_stage_proofs' and column_name = 'id') then
        alter table public.harness_stage_proofs add constraint harness_stage_proofs_natural_key unique (learner_id, build_id, stage_id, e2e_id, run_id);
        alter table public.harness_stage_proofs drop constraint pk_harness_stage_proofs;
        alter table public.harness_stage_proofs add column id uuid not null default gen_random_uuid();
        alter table public.harness_stage_proofs add constraint harness_stage_proofs_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'http_security_rate_windows' and column_name = 'id') then
        alter table public.http_security_rate_windows add constraint http_security_rate_windows_natural_key unique (key);
        alter table public.http_security_rate_windows drop constraint http_security_rate_windows_pkey;
        alter table public.http_security_rate_windows add column id uuid not null default gen_random_uuid();
        alter table public.http_security_rate_windows add constraint http_security_rate_windows_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'inbox_claims' and column_name = 'id') then
        alter table public.inbox_claims add constraint inbox_claims_natural_key unique (source, event_id);
        alter table public.inbox_claims drop constraint inbox_claims_pkey;
        alter table public.inbox_claims add column id uuid not null default gen_random_uuid();
        alter table public.inbox_claims add constraint inbox_claims_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_attempts' and column_name = 'id') then
        alter table public.lesson_attempts add constraint lesson_attempts_natural_key unique (attempt_id);
        alter table public.lesson_attempts drop constraint lesson_attempts_pkey;
        alter table public.lesson_attempts add column id uuid not null default gen_random_uuid();
        alter table public.lesson_attempts add constraint lesson_attempts_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_completions' and column_name = 'id') then
        alter table public.lesson_completions add constraint lesson_completions_natural_key unique (learner_id, lesson_id);
        alter table public.lesson_completions drop constraint pk_lesson_completions;
        alter table public.lesson_completions add column id uuid not null default gen_random_uuid();
        alter table public.lesson_completions add constraint lesson_completions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_hint_uses' and column_name = 'id') then
        alter table public.lesson_hint_uses add constraint lesson_hint_uses_natural_key unique (learner_id, lesson_id, scenario_id);
        alter table public.lesson_hint_uses drop constraint pk_lesson_hint_uses;
        alter table public.lesson_hint_uses add column id uuid not null default gen_random_uuid();
        alter table public.lesson_hint_uses add constraint lesson_hint_uses_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_incident_scores' and column_name = 'id') then
        alter table public.lesson_incident_scores add constraint lesson_incident_scores_natural_key unique (learner_id, lesson_id);
        alter table public.lesson_incident_scores drop constraint pk_lesson_incident_scores;
        alter table public.lesson_incident_scores add column id uuid not null default gen_random_uuid();
        alter table public.lesson_incident_scores add constraint lesson_incident_scores_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_outcome_levels' and column_name = 'id') then
        alter table public.lesson_outcome_levels add constraint lesson_outcome_levels_natural_key unique (learner_id, lesson_id, outcome_id);
        alter table public.lesson_outcome_levels drop constraint pk_lesson_outcome_levels;
        alter table public.lesson_outcome_levels add column id uuid not null default gen_random_uuid();
        alter table public.lesson_outcome_levels add constraint lesson_outcome_levels_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_section_reads' and column_name = 'id') then
        alter table public.lesson_section_reads add constraint lesson_section_reads_natural_key unique (learner_id, lesson_id, section_id);
        alter table public.lesson_section_reads drop constraint pk_lesson_section_reads;
        alter table public.lesson_section_reads add column id uuid not null default gen_random_uuid();
        alter table public.lesson_section_reads add constraint lesson_section_reads_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_simulation_progress' and column_name = 'id') then
        alter table public.lesson_simulation_progress add constraint lesson_simulation_progress_natural_key unique (learner_id, lesson_id, activity_id);
        alter table public.lesson_simulation_progress drop constraint pk_lesson_simulation_progress;
        alter table public.lesson_simulation_progress add column id uuid not null default gen_random_uuid();
        alter table public.lesson_simulation_progress add constraint lesson_simulation_progress_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_topics' and column_name = 'id') then
        alter table public.lesson_topics add constraint lesson_topics_natural_key unique (topic);
        alter table public.lesson_topics drop constraint lesson_topics_pkey;
        alter table public.lesson_topics add column id uuid not null default gen_random_uuid();
        alter table public.lesson_topics add constraint lesson_topics_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'lesson_versions' and column_name = 'id') then
        alter table public.lesson_versions add constraint lesson_versions_natural_key unique (lesson_id, version);
        alter table public.lesson_versions drop constraint pk_lesson_versions;
        alter table public.lesson_versions add column id uuid not null default gen_random_uuid();
        alter table public.lesson_versions add constraint lesson_versions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mcp_access_tokens' and column_name = 'id') then
        alter table public.mcp_access_tokens add constraint mcp_access_tokens_natural_key unique (token_id);
        alter table public.mcp_access_tokens drop constraint mcp_access_tokens_pkey;
        alter table public.mcp_access_tokens add column id uuid not null default gen_random_uuid();
        alter table public.mcp_access_tokens add constraint mcp_access_tokens_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mcp_vector_points' and column_name = 'id') then
        alter table public.mcp_vector_points add constraint mcp_vector_points_natural_key unique (point_id);
        alter table public.mcp_vector_points drop constraint mcp_vector_points_pkey;
        alter table public.mcp_vector_points add column id uuid not null default gen_random_uuid();
        alter table public.mcp_vector_points add constraint mcp_vector_points_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'path_choices' and column_name = 'id') then
        alter table public.path_choices add constraint path_choices_natural_key unique (learner_id);
        alter table public.path_choices drop constraint path_choices_pkey;
        alter table public.path_choices add column id uuid not null default gen_random_uuid();
        alter table public.path_choices add constraint path_choices_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_hint_reveals' and column_name = 'id') then
        alter table public.practice_hint_reveals add constraint practice_hint_reveals_natural_key unique (learner_id, problem_id, step);
        alter table public.practice_hint_reveals drop constraint pk_practice_hint_reveals;
        alter table public.practice_hint_reveals add column id uuid not null default gen_random_uuid();
        alter table public.practice_hint_reveals add constraint practice_hint_reveals_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_pattern_intros' and column_name = 'id') then
        alter table public.practice_pattern_intros add constraint practice_pattern_intros_natural_key unique (pattern_id, locale);
        alter table public.practice_pattern_intros drop constraint pk_practice_pattern_intros;
        alter table public.practice_pattern_intros add column id uuid not null default gen_random_uuid();
        alter table public.practice_pattern_intros add constraint practice_pattern_intros_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_problem_versions' and column_name = 'id') then
        alter table public.practice_problem_versions add constraint practice_problem_versions_natural_key unique (problem_id, version);
        alter table public.practice_problem_versions drop constraint pk_practice_problem_versions;
        alter table public.practice_problem_versions add column id uuid not null default gen_random_uuid();
        alter table public.practice_problem_versions add constraint practice_problem_versions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_solution_reveals' and column_name = 'id') then
        alter table public.practice_solution_reveals add constraint practice_solution_reveals_natural_key unique (learner_id, problem_id);
        alter table public.practice_solution_reveals drop constraint pk_practice_solution_reveals;
        alter table public.practice_solution_reveals add column id uuid not null default gen_random_uuid();
        alter table public.practice_solution_reveals add constraint practice_solution_reveals_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_submissions' and column_name = 'id') then
        alter table public.practice_submissions add constraint practice_submissions_natural_key unique (submission_id);
        alter table public.practice_submissions drop constraint practice_submissions_pkey;
        alter table public.practice_submissions add column id uuid not null default gen_random_uuid();
        alter table public.practice_submissions add constraint practice_submissions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profile_learners' and column_name = 'id') then
        alter table public.profile_learners add constraint profile_learners_natural_key unique (learner_id);
        alter table public.profile_learners drop constraint profile_learners_pkey;
        alter table public.profile_learners add column id uuid not null default gen_random_uuid();
        alter table public.profile_learners add constraint profile_learners_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_check_documents' and column_name = 'id') then
        alter table public.project_check_documents add constraint project_check_documents_natural_key unique (document_set, document_key);
        alter table public.project_check_documents drop constraint pk_project_check_documents;
        alter table public.project_check_documents add column id uuid not null default gen_random_uuid();
        alter table public.project_check_documents add constraint project_check_documents_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_ci_runs' and column_name = 'id') then
        alter table public.project_ci_runs add constraint project_ci_runs_natural_key unique (project_id, run_id);
        alter table public.project_ci_runs drop constraint pk_project_ci_runs;
        alter table public.project_ci_runs add column id uuid not null default gen_random_uuid();
        alter table public.project_ci_runs add constraint project_ci_runs_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_concepts' and column_name = 'id') then
        alter table public.project_concepts add constraint project_concepts_natural_key unique (project_id, concept_id);
        alter table public.project_concepts drop constraint pk_project_concepts;
        alter table public.project_concepts add column id uuid not null default gen_random_uuid();
        alter table public.project_concepts add constraint project_concepts_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_evidence' and column_name = 'id') then
        alter table public.project_evidence add constraint project_evidence_natural_key unique (evidence_id);
        alter table public.project_evidence drop constraint project_evidence_pkey;
        alter table public.project_evidence add column id uuid not null default gen_random_uuid();
        alter table public.project_evidence add constraint project_evidence_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_probe_runs' and column_name = 'id') then
        alter table public.project_probe_runs add constraint project_probe_runs_natural_key unique (run_id);
        alter table public.project_probe_runs drop constraint project_probe_runs_pkey;
        alter table public.project_probe_runs add column id uuid not null default gen_random_uuid();
        alter table public.project_probe_runs add constraint project_probe_runs_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'project_proofs' and column_name = 'id') then
        alter table public.project_proofs add constraint project_proofs_natural_key unique (project_id, subject);
        alter table public.project_proofs drop constraint pk_project_proofs;
        alter table public.project_proofs add column id uuid not null default gen_random_uuid();
        alter table public.project_proofs add constraint project_proofs_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'id') then
        alter table public.projects add constraint projects_natural_key unique (project_id);
        alter table public.project_ci_runs drop constraint project_ci_runs_project_id_fkey;
        alter table public.project_concepts drop constraint project_concepts_project_id_fkey;
        alter table public.project_evidence drop constraint project_evidence_project_id_fkey;
        alter table public.project_probe_runs drop constraint project_probe_runs_project_id_fkey;
        alter table public.project_proofs drop constraint project_proofs_project_id_fkey;
        alter table public.projects drop constraint projects_pkey;
        alter table public.projects add column id uuid not null default gen_random_uuid();
        alter table public.projects add constraint projects_pkey primary key (id);
        alter table public.project_ci_runs add constraint project_ci_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
        alter table public.project_concepts add constraint project_concepts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
        alter table public.project_evidence add constraint project_evidence_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
        alter table public.project_probe_runs add constraint project_probe_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
        alter table public.project_proofs add constraint project_proofs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'purchase_events' and column_name = 'id') then
        alter table public.purchase_events add constraint purchase_events_natural_key unique (event_id);
        alter table public.purchase_events drop constraint purchase_events_pkey;
        alter table public.purchase_events add column id uuid not null default gen_random_uuid();
        alter table public.purchase_events add constraint purchase_events_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'purchases' and column_name = 'id') then
        alter table public.purchases add constraint purchases_natural_key unique (purchase_id);
        alter table public.purchase_events drop constraint purchase_events_purchase_id_fkey;
        alter table public.purchases drop constraint purchases_pkey;
        alter table public.purchases add column id uuid not null default gen_random_uuid();
        alter table public.purchases add constraint purchases_pkey primary key (id);
        alter table public.purchase_events add constraint purchase_events_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(purchase_id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'relay_devices' and column_name = 'id') then
        alter table public.relay_devices add constraint relay_devices_natural_key unique (device_id);
        alter table public.relay_devices drop constraint relay_devices_pkey;
        alter table public.relay_devices add column id uuid not null default gen_random_uuid();
        alter table public.relay_devices add constraint relay_devices_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'relay_events' and column_name = 'id') then
        alter table public.relay_events add constraint relay_events_natural_key unique (device_id, event_id);
        alter table public.relay_events drop constraint relay_events_pkey;
        alter table public.relay_events add column id uuid not null default gen_random_uuid();
        alter table public.relay_events add constraint relay_events_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_answers' and column_name = 'id') then
        alter table public.review_answers add constraint review_answers_natural_key unique (learner_id, item_id, revision);
        alter table public.review_answers drop constraint pk_review_answers;
        alter table public.review_answers add column id uuid not null default gen_random_uuid();
        alter table public.review_answers add constraint review_answers_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_cards' and column_name = 'id') then
        alter table public.review_cards add constraint review_cards_natural_key unique (item_id, version);
        alter table public.review_cards drop constraint pk_review_cards;
        alter table public.review_cards add column id uuid not null default gen_random_uuid();
        alter table public.review_cards add constraint review_cards_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_deck_versions' and column_name = 'id') then
        alter table public.review_deck_versions add constraint review_deck_versions_natural_key unique (deck_id, version);
        alter table public.review_deck_versions drop constraint pk_review_deck_versions;
        alter table public.review_deck_versions add column id uuid not null default gen_random_uuid();
        alter table public.review_deck_versions add constraint review_deck_versions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_decks' and column_name = 'id') then
        alter table public.review_decks add constraint review_decks_natural_key unique (deck_id);
        alter table public.review_decks drop constraint review_decks_pkey;
        alter table public.review_decks add column id uuid not null default gen_random_uuid();
        alter table public.review_decks add constraint review_decks_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_learner_decks' and column_name = 'id') then
        alter table public.review_learner_decks add constraint review_learner_decks_natural_key unique (learner_id, deck_id);
        alter table public.review_learner_decks drop constraint pk_review_learner_decks;
        alter table public.review_learner_decks add column id uuid not null default gen_random_uuid();
        alter table public.review_learner_decks add constraint review_learner_decks_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_reviews' and column_name = 'id') then
        alter table public.review_reviews add constraint review_reviews_natural_key unique (learner_id, item_id, revision);
        alter table public.review_reviews drop constraint pk_review_reviews;
        alter table public.review_reviews add column id uuid not null default gen_random_uuid();
        alter table public.review_reviews add constraint review_reviews_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_settings' and column_name = 'id') then
        alter table public.review_settings add constraint review_settings_natural_key unique (learner_id);
        alter table public.review_settings drop constraint review_settings_pkey;
        alter table public.review_settings add column id uuid not null default gen_random_uuid();
        alter table public.review_settings add constraint review_settings_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'review_states' and column_name = 'id') then
        alter table public.review_states add constraint review_states_natural_key unique (learner_id, item_id);
        alter table public.review_states drop constraint pk_review_states;
        alter table public.review_states add column id uuid not null default gen_random_uuid();
        alter table public.review_states add constraint review_states_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'streak_actions' and column_name = 'id') then
        alter table public.streak_actions add constraint streak_actions_natural_key unique (learner_id, action_id);
        alter table public.streak_actions drop constraint pk_streak_actions;
        alter table public.streak_actions add column id uuid not null default gen_random_uuid();
        alter table public.streak_actions add constraint streak_actions_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'streak_states' and column_name = 'id') then
        alter table public.streak_states add constraint streak_states_natural_key unique (learner_id);
        alter table public.streak_states drop constraint streak_states_pkey;
        alter table public.streak_states add column id uuid not null default gen_random_uuid();
        alter table public.streak_states add constraint streak_states_pkey primary key (id);
    end if;
end;
$$;

do $$
begin
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'identity_sessions' and column_name = 'reference_digest') then
        -- The retired Keycloak-era table (reference_digest shape); 20261120150300 creates the passport table of the same name and says so with its replaces line.
        drop table public.identity_sessions;
    end if;
end;
$$;

drop table if exists public.identity_challenges;
drop table if exists public.identity_social_bundles;
