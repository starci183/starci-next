-- The baseline: the schema of every module exactly as the TypeORM migrations left the database (dev database starci_next_dev, schema-only dump),
-- including the Keycloak-era identity tables, in the old key shape. Left out: TypeORM's own history table primary_migrations and the harness-made
-- starci_seed_receipts. A database that already holds this schema is ADOPTED (starci app db adopt): this file is recorded as applied and never
-- replayed there. 20261120150100 puts the application role and row security on it and 20261120150200 reshapes every database, fresh ones
-- included, to the keys the edition requires (see the cutover runbook of mig-db).

set search_path = public;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: career_experience_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_experience_items (
    item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    verification_code text NOT NULL,
    learner_id uuid NOT NULL,
    item_type text NOT NULL,
    part text NOT NULL,
    subject text NOT NULL,
    project_id text,
    evidence jsonb NOT NULL,
    evidence_revision integer DEFAULT 1 NOT NULL,
    slot_values jsonb NOT NULL,
    grade jsonb,
    draft_line jsonb,
    line jsonb,
    state text NOT NULL,
    assignee_id uuid,
    teacher_only boolean DEFAULT false NOT NULL,
    submitted_at timestamp with time zone,
    due_at timestamp with time zone,
    signer_id uuid,
    signer_role text,
    signed_at timestamp with time zone,
    revoked_at timestamp with time zone,
    return_note text,
    return_count integer DEFAULT 0 NOT NULL,
    returned_line jsonb,
    returned_evidence_revision integer,
    shown_publicly boolean DEFAULT false NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT career_experience_items_check CHECK (((state <> 'verified'::text) OR ((signer_id IS NOT NULL) AND (signed_at IS NOT NULL)))),
    CONSTRAINT career_experience_items_check1 CHECK (((shown_publicly = false) OR (state = 'verified'::text))),
    CONSTRAINT career_experience_items_evidence_check CHECK ((jsonb_typeof(evidence) = 'array'::text)),
    CONSTRAINT career_experience_items_part_check CHECK ((part = ANY (ARRAY['essentials'::text, 'projects'::text, 'incidents'::text, 'practice'::text, 'harness'::text]))),
    CONSTRAINT career_experience_items_signer_role_check CHECK ((signer_role = ANY (ARRAY['TEACHER'::text, 'REVIEWER'::text]))),
    CONSTRAINT career_experience_items_state_check CHECK ((state = ANY (ARRAY['practising'::text, 'ai-graded'::text, 'pending-review'::text, 'verified'::text, 'returned'::text, 'revoked'::text]))),
    CONSTRAINT career_experience_items_subject_check CHECK (((char_length(subject) >= 1) AND (char_length(subject) <= 300)))
);

--
-- Name: career_review_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_review_decisions (
    decision_id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    action text NOT NULL,
    actor_id uuid,
    actor_role text NOT NULL,
    from_state text,
    to_state text NOT NULL,
    note text,
    snapshot jsonb NOT NULL,
    at timestamp with time zone NOT NULL,
    CONSTRAINT career_review_decisions_action_check CHECK ((action = ANY (ARRAY['grade'::text, 'submit'::text, 'resubmit'::text, 'assign'::text, 'approve'::text, 'return'::text, 'escalate'::text, 'revoke'::text]))),
    CONSTRAINT career_review_decisions_actor_role_check CHECK ((actor_role = ANY (ARRAY['learner'::text, 'REVIEWER'::text, 'TEACHER'::text, 'system'::text])))
);

--
-- Name: career_reviewers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.career_reviewers (
    appointment_id uuid DEFAULT gen_random_uuid() NOT NULL,
    reviewer_id uuid NOT NULL,
    parts jsonb NOT NULL,
    capacity integer NOT NULL,
    conflicts jsonb NOT NULL,
    appointed_by uuid NOT NULL,
    appointed_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT career_reviewers_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT career_reviewers_conflicts_check CHECK ((jsonb_typeof(conflicts) = 'array'::text)),
    CONSTRAINT career_reviewers_parts_check CHECK ((jsonb_typeof(parts) = 'array'::text))
);

--
-- Name: entitlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entitlements (
    learner_id uuid NOT NULL,
    premium_until timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_entitlements_premium_until CHECK ((premium_until > '-infinity'::timestamp with time zone))
);

--
-- Name: harness_build_bindings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.harness_build_bindings (
    learner_id uuid NOT NULL,
    build_id text NOT NULL,
    bound_at timestamp with time zone NOT NULL,
    binding_id uuid DEFAULT gen_random_uuid() NOT NULL,
    repository text NOT NULL,
    repository_id text
);

--
-- Name: harness_contents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.harness_contents (
    kind text NOT NULL,
    content_key text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status character varying(16) NOT NULL,
    sort_index integer NOT NULL,
    content jsonb NOT NULL,
    pack bytea,
    pack_sha256 text,
    imported_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_harness_contents_kind CHECK ((kind = ANY (ARRAY['build'::text, 'guide'::text, 'doc'::text, 'probe'::text, 'trap'::text, 'doctor-pack'::text]))),
    CONSTRAINT ck_harness_contents_status CHECK ((status IN ('published', 'superseded')))
);

--
-- Name: harness_stage_proofs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.harness_stage_proofs (
    learner_id uuid NOT NULL,
    build_id text NOT NULL,
    stage_id text NOT NULL,
    e2e_id text NOT NULL,
    run_id text NOT NULL,
    passed boolean NOT NULL,
    commit_sha text,
    recorded_at timestamp with time zone NOT NULL,
    binding_id uuid NOT NULL
);

--
-- Name: http_security_rate_windows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.http_security_rate_windows (
    key character varying(128) NOT NULL,
    hits integer NOT NULL,
    reset_at timestamp with time zone NOT NULL,
    CONSTRAINT http_security_rate_windows_hits_check CHECK ((hits > 0))
);

--
-- Name: identity_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_challenges (
    challenge_digest character varying(64) NOT NULL,
    purpose character varying(16) NOT NULL,
    email text NOT NULL,
    locale character varying(2) NOT NULL,
    code_digest character varying(64) NOT NULL,
    attempts_left integer NOT NULL,
    deliver boolean NOT NULL,
    payload text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    CONSTRAINT identity_challenges_attempts_left_check CHECK ((attempts_left >= 0)),
    CONSTRAINT identity_challenges_locale_check CHECK ((locale IN ('vi', 'en'))),
    CONSTRAINT identity_challenges_purpose_check CHECK ((purpose IN ('sign-in', 'sign-up', 'password-reset')))
);

--
-- Name: identity_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_sessions (
    reference_digest character varying(64) NOT NULL,
    subject text NOT NULL,
    roles jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    refresh_ciphertext text NOT NULL,
    refresh_expires_at timestamp with time zone NOT NULL,
    issued_at timestamp with time zone NOT NULL,
    display_name text,
    email text,
    CONSTRAINT ck_identity_sessions_display_name CHECK (((display_name IS NULL) OR ((char_length(display_name) >= 1) AND (char_length(display_name) <= 120)))),
    CONSTRAINT ck_identity_sessions_email CHECK (((email IS NULL) OR ((char_length(email) >= 3) AND (char_length(email) <= 254)))),
    CONSTRAINT identity_sessions_roles_check CHECK ((jsonb_typeof(roles) = 'array'::text))
);

--
-- Name: identity_social_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identity_social_bundles (
    state_digest character varying(64) NOT NULL,
    nonce character varying(43) NOT NULL,
    code_verifier character varying(43) NOT NULL,
    return_to text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone
);

--
-- Name: inbox_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inbox_claims (
    source character varying(200) NOT NULL,
    event_id character varying(200) NOT NULL,
    claimed_at timestamp with time zone NOT NULL,
    request_fingerprint character varying(64),
    outcome jsonb
);

--
-- Name: lesson_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_attempts (
    attempt_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    lesson_version text NOT NULL,
    activity_id text NOT NULL,
    revision integer NOT NULL,
    kind character varying(16) NOT NULL,
    phase character varying(16) NOT NULL,
    locale character varying(8) NOT NULL,
    is_diagnostic boolean NOT NULL,
    answer jsonb NOT NULL,
    status character varying(16) NOT NULL,
    result jsonb,
    failure_code character varying(64),
    submitted_at timestamp with time zone NOT NULL,
    graded_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_lesson_attempts_failure CHECK ((((status)::text = 'failed'::text) = (failure_code IS NOT NULL))),
    CONSTRAINT ck_lesson_attempts_graded_at CHECK ((((status)::text = 'graded'::text) = (graded_at IS NOT NULL))),
    CONSTRAINT ck_lesson_attempts_kind CHECK ((kind IN ('choice', 'simulation', 'explain', 'exercise'))),
    CONSTRAINT ck_lesson_attempts_locale CHECK ((locale IN ('vi', 'en'))),
    CONSTRAINT ck_lesson_attempts_phase CHECK ((phase IN ('challenge', 'predict', 'explore', 'explain', 'apply', 'reflect'))),
    CONSTRAINT ck_lesson_attempts_result CHECK ((((status)::text = 'graded'::text) = (result IS NOT NULL))),
    CONSTRAINT ck_lesson_attempts_revision CHECK ((revision >= 1)),
    CONSTRAINT ck_lesson_attempts_status CHECK ((status IN ('saved', 'grading', 'graded', 'failed')))
);

--
-- Name: lesson_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_completions (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    lesson_version text NOT NULL,
    completed_at timestamp with time zone NOT NULL
);

--
-- Name: lesson_hint_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_hint_uses (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    scenario_id text NOT NULL,
    used_at timestamp with time zone NOT NULL
);

--
-- Name: lesson_incident_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_incident_scores (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    mutation_score smallint NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_lesson_incident_scores_score CHECK (((mutation_score >= 0) AND (mutation_score <= 100)))
);

--
-- Name: lesson_outcome_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_outcome_levels (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    outcome_id text NOT NULL,
    understood smallint NOT NULL,
    proved smallint NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_lesson_outcome_levels_proved CHECK (((proved >= 0) AND (proved <= 2))),
    CONSTRAINT ck_lesson_outcome_levels_understood CHECK (((understood >= 0) AND (understood <= 2)))
);

--
-- Name: lesson_section_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_section_reads (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    section_id text NOT NULL,
    read_at timestamp with time zone NOT NULL
);

--
-- Name: lesson_simulation_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_simulation_progress (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    activity_id text NOT NULL,
    lesson_version text NOT NULL,
    current_state_id text NOT NULL,
    action_ids text[] NOT NULL,
    tried_transition_ids text[] NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

--
-- Name: lesson_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_topics (
    topic text NOT NULL,
    title text NOT NULL,
    source_note text NOT NULL,
    description text,
    prerequisites jsonb,
    related jsonb,
    path jsonb NOT NULL,
    ref text NOT NULL,
    imported_at timestamp with time zone NOT NULL
);

--
-- Name: lesson_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_versions (
    lesson_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status character varying(16) NOT NULL,
    category text NOT NULL,
    difficulty character varying(16) NOT NULL,
    minutes_read integer NOT NULL,
    implementation text NOT NULL,
    sort_index integer NOT NULL,
    titles jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    source_hashes jsonb NOT NULL,
    content jsonb NOT NULL,
    imported_at timestamp with time zone NOT NULL,
    lesson_group text NOT NULL,
    topic text NOT NULL,
    source_key text,
    CONSTRAINT ck_lesson_versions_difficulty CHECK ((difficulty IN ('foundation', 'intermediate', 'advanced'))),
    CONSTRAINT ck_lesson_versions_minutes CHECK ((minutes_read > 0)),
    CONSTRAINT ck_lesson_versions_status CHECK ((status IN ('published', 'superseded')))
);

--
-- Name: mcp_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_access_tokens (
    token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    name text NOT NULL,
    token_digest character varying(64) NOT NULL,
    hint character varying(4) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone,
    CONSTRAINT mcp_access_tokens_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 60)))
);

--
-- Name: mcp_vector_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcp_vector_points (
    point_id uuid NOT NULL,
    kind text NOT NULL,
    source_id text NOT NULL,
    locale text NOT NULL,
    content_hash character varying(64) NOT NULL,
    part text NOT NULL,
    access text NOT NULL,
    synced_at timestamp with time zone,
    CONSTRAINT mcp_vector_points_access_check CHECK ((access = ANY (ARRAY['free'::text, 'premium'::text]))),
    CONSTRAINT mcp_vector_points_kind_check CHECK ((kind = ANY (ARRAY['lesson'::text, 'code'::text, 'harness'::text]))),
    CONSTRAINT mcp_vector_points_locale_check CHECK (((char_length(locale) >= 1) AND (char_length(locale) <= 8))),
    CONSTRAINT mcp_vector_points_source_id_check CHECK (((char_length(source_id) >= 1) AND (char_length(source_id) <= 120)))
);

--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT notes_body_check CHECK ((char_length(body) > 0))
);

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    kind text NOT NULL,
    params jsonb NOT NULL,
    link text,
    created_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone,
    CONSTRAINT ck_notifications_kind CHECK ((kind = ANY (ARRAY['premium.activated'::text, 'premium.revoked'::text, 'experience.verified'::text, 'experience.returned'::text, 'review.due'::text, 'project.milestone-proved'::text, 'project.deployed'::text]))),
    CONSTRAINT ck_notifications_link CHECK (((link IS NULL) OR ((link ~~ '/%'::text) AND (link !~~ '//%'::text) AND (strpos(link, chr(92)) = 0)))),
    CONSTRAINT ck_notifications_params CHECK ((jsonb_typeof(params) = 'object'::text))
);

--
-- Name: path_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.path_choices (
    learner_id uuid NOT NULL,
    active_path_id text NOT NULL,
    chosen_at timestamp with time zone NOT NULL,
    history jsonb NOT NULL,
    CONSTRAINT ck_path_choices_path CHECK ((active_path_id = ANY (ARRAY['founder'::text, 'ai-engineer'::text, 'backend-fullstack'::text, 'devops-sre'::text, 'system-design-senior'::text])))
);

--
-- Name: practice_hint_reveals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_hint_reveals (
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    step smallint NOT NULL,
    revealed_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_practice_hint_reveals_step CHECK (((step >= 1) AND (step <= 3)))
);

--
-- Name: practice_pattern_intros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_pattern_intros (
    pattern_id text NOT NULL,
    locale character varying(8) NOT NULL,
    intro text NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_practice_pattern_intros_locale CHECK ((locale IN ('vi', 'en')))
);

--
-- Name: practice_problem_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_problem_versions (
    problem_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status character varying(16) NOT NULL,
    pattern_id text NOT NULL,
    order_index integer NOT NULL,
    difficulty character varying(16) NOT NULL,
    tags jsonb NOT NULL,
    time_limit_ms integer NOT NULL,
    memory_limit_kb integer NOT NULL,
    titles jsonb NOT NULL,
    content jsonb NOT NULL,
    starter_codes jsonb NOT NULL,
    examples jsonb NOT NULL,
    tests jsonb NOT NULL,
    solutions jsonb NOT NULL,
    source_hashes jsonb NOT NULL,
    imported_at timestamp with time zone NOT NULL,
    explanations jsonb DEFAULT '{"en": "", "vi": ""}'::jsonb NOT NULL,
    CONSTRAINT ck_practice_problem_versions_difficulty CHECK ((difficulty IN ('easy', 'medium', 'hard'))),
    CONSTRAINT ck_practice_problem_versions_limits CHECK (((time_limit_ms > 0) AND (memory_limit_kb > 0))),
    CONSTRAINT ck_practice_problem_versions_status CHECK ((status IN ('published', 'superseded')))
);

--
-- Name: practice_solution_reveals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_solution_reveals (
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    revealed_at timestamp with time zone NOT NULL
);

--
-- Name: practice_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_submissions (
    submission_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    problem_version text NOT NULL,
    language character varying(16) NOT NULL,
    kind character varying(8) NOT NULL,
    source text NOT NULL,
    verdict character varying(24) NOT NULL,
    failure_code character varying(64),
    compile_output text,
    tests jsonb NOT NULL,
    passed_count integer NOT NULL,
    total_count integer NOT NULL,
    time_ms integer,
    memory_kb integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone,
    CONSTRAINT ck_practice_submissions_counts CHECK (((passed_count >= 0) AND (total_count >= 0) AND (passed_count <= total_count))),
    CONSTRAINT ck_practice_submissions_kind CHECK ((kind IN ('run', 'submit'))),
    CONSTRAINT ck_practice_submissions_language CHECK ((language IN ('cpp', 'java', 'javascript', 'python', 'typescript'))),
    CONSTRAINT ck_practice_submissions_verdict CHECK ((verdict IN ('queued', 'running', 'accepted', 'wrong-answer', 'time-limit-exceeded', 'compile-error', 'runtime-error', 'internal-error')))
);

--
-- Name: profile_learners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_learners (
    learner_id uuid NOT NULL,
    display_name text,
    avatar_key text,
    avatar_content_type text,
    avatar_size integer,
    avatar_updated_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL,
    cv_slug text,
    cv_public boolean DEFAULT false NOT NULL,
    account_name text,
    CONSTRAINT ck_profile_learners_avatar CHECK ((((avatar_key IS NULL) = (avatar_content_type IS NULL)) AND ((avatar_key IS NULL) = (avatar_size IS NULL)))),
    CONSTRAINT ck_profile_learners_cv_slug CHECK (((cv_slug IS NULL) OR (cv_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text))),
    CONSTRAINT ck_profile_learners_name CHECK (((display_name IS NULL) OR ((char_length(display_name) >= 1) AND (char_length(display_name) <= 60))))
);

--
-- Name: project_check_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_check_documents (
    document_set text NOT NULL,
    document_key text NOT NULL,
    body jsonb NOT NULL,
    imported_at timestamp with time zone NOT NULL
);

--
-- Name: project_ci_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_ci_runs (
    project_id uuid NOT NULL,
    run_id text NOT NULL,
    commit_sha text NOT NULL,
    passed boolean NOT NULL,
    received_at timestamp with time zone NOT NULL,
    attestation character varying(16) DEFAULT 'signed-only'::character varying NOT NULL,
    CONSTRAINT ck_project_ci_runs_attestation CHECK ((attestation IN ('attested', 'signed-only')))
);

--
-- Name: project_concepts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_concepts (
    project_id uuid NOT NULL,
    concept_id text NOT NULL,
    location text,
    endpoint text,
    sample_body text,
    updated_at timestamp with time zone NOT NULL
);

--
-- Name: project_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_evidence (
    evidence_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    concept_id text NOT NULL,
    slot character varying(12) NOT NULL,
    source character varying(16) NOT NULL,
    passed boolean NOT NULL,
    ref text NOT NULL,
    run_id text NOT NULL,
    commit_sha text,
    detail jsonb NOT NULL,
    at timestamp with time zone NOT NULL,
    CONSTRAINT ck_project_evidence_slot CHECK ((slot IN ('test', 'e2e', 'probe', 'code-read'))),
    CONSTRAINT ck_project_evidence_source CHECK ((source IN ('relay', 'ci', 'ci-signed', 'server-probe', 'ai')))
);

--
-- Name: project_probe_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_probe_runs (
    run_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    url text NOT NULL,
    passed boolean NOT NULL,
    results jsonb NOT NULL,
    at timestamp with time zone NOT NULL
);

--
-- Name: project_proofs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_proofs (
    project_id uuid NOT NULL,
    subject text NOT NULL,
    proved_at timestamp with time zone NOT NULL
);

--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    name text NOT NULL,
    kind character varying(8) NOT NULL,
    topic text NOT NULL,
    language text NOT NULL,
    stack text NOT NULL,
    track character varying(16),
    repo_url text,
    deployed_url text,
    ci_secret text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    github_repository text,
    github_repository_id text,
    CONSTRAINT ck_projects_kind CHECK ((kind IN ('app', 'agent'))),
    CONSTRAINT ck_projects_track CHECK (((track IS NULL) OR (track IN ('claude', 'openclaw', 'hermes'))))
);

--
-- Name: purchase_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_events (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_id uuid,
    kind text NOT NULL,
    rail text NOT NULL,
    provider_ref text,
    created_at timestamp with time zone NOT NULL,
    order_code text,
    amount_vnd integer,
    currency text,
    reason text,
    CONSTRAINT ck_purchase_events_kind CHECK ((kind = ANY (ARRAY['paid'::text, 'late-paid'::text, 'canceled'::text, 'expired'::text, 'checkout-refused'::text, 'confirmation-refused'::text, 'payment-voided'::text, 'premium-revoked'::text]))),
    CONSTRAINT ck_purchase_events_reason CHECK (((kind = ANY (ARRAY['confirmation-refused'::text, 'payment-voided'::text])) = (reason IS NOT NULL))),
    CONSTRAINT ck_purchase_events_subject CHECK (((purchase_id IS NOT NULL) OR (kind = ANY (ARRAY['confirmation-refused'::text, 'payment-voided'::text]))))
);

--
-- Name: purchase_order_codes; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_order_codes
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    purchase_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid NOT NULL,
    plan text NOT NULL,
    amount_vnd integer NOT NULL,
    currency text NOT NULL,
    rail text NOT NULL,
    order_code text NOT NULL,
    provider_ref text,
    status text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    confirmed_at timestamp with time zone,
    CONSTRAINT ck_purchases_amount CHECK ((amount_vnd > 0)),
    CONSTRAINT ck_purchases_confirmed CHECK (((status = ANY (ARRAY['paid'::text, 'voided'::text])) = (confirmed_at IS NOT NULL))),
    CONSTRAINT ck_purchases_currency CHECK ((currency = 'VND'::text)),
    CONSTRAINT ck_purchases_status CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'canceled'::text, 'expired'::text, 'voided'::text])))
);

--
-- Name: relay_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relay_devices (
    device_id uuid DEFAULT gen_random_uuid() NOT NULL,
    learner_id uuid,
    name text NOT NULL,
    platform text NOT NULL,
    device_code_digest character varying(64) NOT NULL,
    user_code character varying(9) NOT NULL,
    status text NOT NULL,
    token_digest character varying(64),
    created_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    confirmed_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    revoked_at timestamp with time zone,
    online_since timestamp with time zone,
    CONSTRAINT ck_relay_devices_learner CHECK (((status = 'pending'::text) = (learner_id IS NULL))),
    CONSTRAINT ck_relay_devices_platform CHECK ((platform = ANY (ARRAY['windows'::text, 'macos'::text, 'linux'::text]))),
    CONSTRAINT ck_relay_devices_status CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'active'::text, 'revoked'::text]))),
    CONSTRAINT ck_relay_devices_token CHECK (((status = 'active'::text) = (token_digest IS NOT NULL)))
);

--
-- Name: relay_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relay_events (
    device_id uuid NOT NULL,
    event_id uuid NOT NULL,
    learner_id uuid NOT NULL,
    kind text NOT NULL,
    task_id text NOT NULL,
    run_id text NOT NULL,
    check_id text,
    concept_id text,
    slot text,
    ref text,
    passed boolean,
    exit_code integer,
    duration_ms integer,
    commit_sha text,
    body text,
    created_at timestamp with time zone NOT NULL,
    detail jsonb,
    CONSTRAINT ck_relay_events_body CHECK (((body IS NULL) OR (length(body) <= 16384))),
    CONSTRAINT ck_relay_events_kind CHECK ((kind = ANY (ARRAY['check.started'::text, 'check.result'::text, 'log'::text, 'manifest.ack'::text]))),
    CONSTRAINT ck_relay_events_slot CHECK (((slot IS NULL) OR (slot = ANY (ARRAY['test'::text, 'e2e'::text, 'probe'::text, 'scenario'::text, 'challenge'::text]))))
);

--
-- Name: review_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_answers (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    revision integer NOT NULL,
    answer_text text NOT NULL,
    submitted_at timestamp with time zone NOT NULL
);

--
-- Name: review_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_cards (
    item_id text NOT NULL,
    version text NOT NULL,
    deck_id text NOT NULL,
    sort_index integer NOT NULL,
    level character varying(16) NOT NULL,
    langs text,
    front jsonb NOT NULL,
    back jsonb NOT NULL,
    CONSTRAINT ck_review_cards_level CHECK ((level IN ('junior', 'middle', 'senior', 'staff')))
);

--
-- Name: review_deck_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_deck_versions (
    deck_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    source_hashes jsonb NOT NULL,
    imported_at timestamp with time zone NOT NULL
);

--
-- Name: review_decks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_decks (
    deck_id text NOT NULL,
    course text NOT NULL,
    sort_index integer NOT NULL,
    live_version text NOT NULL,
    difficulty character varying(16) NOT NULL,
    titles jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    module_refs jsonb NOT NULL,
    tracks jsonb NOT NULL,
    card_count integer NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

--
-- Name: review_learner_decks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_learner_decks (
    learner_id uuid NOT NULL,
    deck_id text NOT NULL,
    active boolean NOT NULL,
    added_at timestamp with time zone NOT NULL
);

--
-- Name: review_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reviews (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    revision integer NOT NULL,
    grade character varying(8) NOT NULL,
    cloze_correct boolean,
    answered_at timestamp with time zone NOT NULL,
    answered_on date NOT NULL,
    CONSTRAINT ck_review_reviews_grade CHECK ((grade IN ('again', 'hard', 'good', 'easy')))
);

--
-- Name: review_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_settings (
    learner_id uuid NOT NULL,
    daily_goal integer NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    due_notified_on date,
    CONSTRAINT ck_review_settings_goal CHECK (((daily_goal >= 5) AND (daily_goal <= 50)))
);

--
-- Name: review_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_states (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    source character varying(16) NOT NULL,
    status character varying(16) NOT NULL,
    step smallint NOT NULL,
    due_on date NOT NULL,
    added_by character varying(16) NOT NULL,
    deck_id text,
    lesson_id text,
    activity_id text,
    lesson_version text,
    after_days integer,
    suspended_from character varying(16),
    last_revision integer NOT NULL,
    flipped_revision integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_review_states_added_by CHECK ((added_by IN ('deck', 'lesson', 'track'))),
    CONSTRAINT ck_review_states_source CHECK ((source IN ('flashcard', 'retrieval'))),
    CONSTRAINT ck_review_states_status CHECK ((status IN ('new', 'learning', 'review', 'done', 'suspended')))
);

--
-- Name: streak_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.streak_actions (
    learner_id uuid NOT NULL,
    action_id text NOT NULL,
    shard text NOT NULL,
    kind text NOT NULL,
    source_ref text,
    day date NOT NULL,
    recorded_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_streak_actions_kind CHECK ((kind = ANY (ARRAY['review-due-done'::text, 'graded-attempt'::text, 'project-run'::text, 'interview-submitted'::text]))),
    CONSTRAINT ck_streak_actions_shard CHECK ((shard = ANY (ARRAY['essentials'::text, 'review'::text, 'practice'::text, 'projects'::text, 'incidents'::text, 'interview'::text])))
);

--
-- Name: streak_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.streak_states (
    learner_id uuid NOT NULL,
    current_streak integer NOT NULL,
    longest_streak integer NOT NULL,
    last_closed_day date NOT NULL,
    last_grant_week date NOT NULL,
    weekly_goal smallint NOT NULL,
    freezes_held smallint NOT NULL,
    shard_counters jsonb NOT NULL,
    freeze_days jsonb NOT NULL,
    badges jsonb NOT NULL,
    reminder jsonb,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT ck_streak_states_freezes CHECK ((freezes_held >= 0)),
    CONSTRAINT ck_streak_states_goal CHECK (((weekly_goal >= 2) AND (weekly_goal <= 7)))
);

--
-- Name: career_experience_items career_experience_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_experience_items
    ADD CONSTRAINT career_experience_items_pkey PRIMARY KEY (item_id);

--
-- Name: career_experience_items career_experience_items_verification_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_experience_items
    ADD CONSTRAINT career_experience_items_verification_code_key UNIQUE (verification_code);

--
-- Name: career_review_decisions career_review_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_review_decisions
    ADD CONSTRAINT career_review_decisions_pkey PRIMARY KEY (decision_id);

--
-- Name: career_reviewers career_reviewers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_reviewers
    ADD CONSTRAINT career_reviewers_pkey PRIMARY KEY (appointment_id);

--
-- Name: entitlements entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entitlements
    ADD CONSTRAINT entitlements_pkey PRIMARY KEY (learner_id);

--
-- Name: http_security_rate_windows http_security_rate_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.http_security_rate_windows
    ADD CONSTRAINT http_security_rate_windows_pkey PRIMARY KEY (key);

--
-- Name: identity_challenges identity_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_challenges
    ADD CONSTRAINT identity_challenges_pkey PRIMARY KEY (challenge_digest);

--
-- Name: identity_sessions identity_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_sessions
    ADD CONSTRAINT identity_sessions_pkey PRIMARY KEY (reference_digest);

--
-- Name: identity_social_bundles identity_social_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identity_social_bundles
    ADD CONSTRAINT identity_social_bundles_pkey PRIMARY KEY (state_digest);

--
-- Name: inbox_claims inbox_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inbox_claims
    ADD CONSTRAINT inbox_claims_pkey PRIMARY KEY (source, event_id);

--
-- Name: lesson_attempts lesson_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attempts
    ADD CONSTRAINT lesson_attempts_pkey PRIMARY KEY (attempt_id);

--
-- Name: lesson_topics lesson_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_topics
    ADD CONSTRAINT lesson_topics_pkey PRIMARY KEY (topic);

--
-- Name: mcp_access_tokens mcp_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_access_tokens
    ADD CONSTRAINT mcp_access_tokens_pkey PRIMARY KEY (token_id);

--
-- Name: mcp_vector_points mcp_vector_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcp_vector_points
    ADD CONSTRAINT mcp_vector_points_pkey PRIMARY KEY (point_id);

--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--
-- Name: path_choices path_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.path_choices
    ADD CONSTRAINT path_choices_pkey PRIMARY KEY (learner_id);

--
-- Name: harness_build_bindings pk_harness_build_bindings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.harness_build_bindings
    ADD CONSTRAINT pk_harness_build_bindings PRIMARY KEY (learner_id, build_id);

--
-- Name: harness_contents pk_harness_contents; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.harness_contents
    ADD CONSTRAINT pk_harness_contents PRIMARY KEY (kind, content_key, version);

--
-- Name: harness_stage_proofs pk_harness_stage_proofs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.harness_stage_proofs
    ADD CONSTRAINT pk_harness_stage_proofs PRIMARY KEY (learner_id, build_id, stage_id, e2e_id, run_id);

--
-- Name: lesson_completions pk_lesson_completions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_completions
    ADD CONSTRAINT pk_lesson_completions PRIMARY KEY (learner_id, lesson_id);

--
-- Name: lesson_hint_uses pk_lesson_hint_uses; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_hint_uses
    ADD CONSTRAINT pk_lesson_hint_uses PRIMARY KEY (learner_id, lesson_id, scenario_id);

--
-- Name: lesson_incident_scores pk_lesson_incident_scores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_incident_scores
    ADD CONSTRAINT pk_lesson_incident_scores PRIMARY KEY (learner_id, lesson_id);

--
-- Name: lesson_outcome_levels pk_lesson_outcome_levels; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_outcome_levels
    ADD CONSTRAINT pk_lesson_outcome_levels PRIMARY KEY (learner_id, lesson_id, outcome_id);

--
-- Name: lesson_section_reads pk_lesson_section_reads; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_section_reads
    ADD CONSTRAINT pk_lesson_section_reads PRIMARY KEY (learner_id, lesson_id, section_id);

--
-- Name: lesson_simulation_progress pk_lesson_simulation_progress; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_simulation_progress
    ADD CONSTRAINT pk_lesson_simulation_progress PRIMARY KEY (learner_id, lesson_id, activity_id);

--
-- Name: lesson_versions pk_lesson_versions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_versions
    ADD CONSTRAINT pk_lesson_versions PRIMARY KEY (lesson_id, version);

--
-- Name: practice_hint_reveals pk_practice_hint_reveals; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_hint_reveals
    ADD CONSTRAINT pk_practice_hint_reveals PRIMARY KEY (learner_id, problem_id, step);

--
-- Name: practice_pattern_intros pk_practice_pattern_intros; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_pattern_intros
    ADD CONSTRAINT pk_practice_pattern_intros PRIMARY KEY (pattern_id, locale);

--
-- Name: practice_problem_versions pk_practice_problem_versions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_problem_versions
    ADD CONSTRAINT pk_practice_problem_versions PRIMARY KEY (problem_id, version);

--
-- Name: practice_solution_reveals pk_practice_solution_reveals; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_solution_reveals
    ADD CONSTRAINT pk_practice_solution_reveals PRIMARY KEY (learner_id, problem_id);

--
-- Name: project_check_documents pk_project_check_documents; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_check_documents
    ADD CONSTRAINT pk_project_check_documents PRIMARY KEY (document_set, document_key);

--
-- Name: project_ci_runs pk_project_ci_runs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_ci_runs
    ADD CONSTRAINT pk_project_ci_runs PRIMARY KEY (project_id, run_id);

--
-- Name: project_concepts pk_project_concepts; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_concepts
    ADD CONSTRAINT pk_project_concepts PRIMARY KEY (project_id, concept_id);

--
-- Name: project_proofs pk_project_proofs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_proofs
    ADD CONSTRAINT pk_project_proofs PRIMARY KEY (project_id, subject);

--
-- Name: review_answers pk_review_answers; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_answers
    ADD CONSTRAINT pk_review_answers PRIMARY KEY (learner_id, item_id, revision);

--
-- Name: review_cards pk_review_cards; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_cards
    ADD CONSTRAINT pk_review_cards PRIMARY KEY (item_id, version);

--
-- Name: review_deck_versions pk_review_deck_versions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_deck_versions
    ADD CONSTRAINT pk_review_deck_versions PRIMARY KEY (deck_id, version);

--
-- Name: review_learner_decks pk_review_learner_decks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_learner_decks
    ADD CONSTRAINT pk_review_learner_decks PRIMARY KEY (learner_id, deck_id);

--
-- Name: review_reviews pk_review_reviews; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reviews
    ADD CONSTRAINT pk_review_reviews PRIMARY KEY (learner_id, item_id, revision);

--
-- Name: review_states pk_review_states; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_states
    ADD CONSTRAINT pk_review_states PRIMARY KEY (learner_id, item_id);

--
-- Name: streak_actions pk_streak_actions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streak_actions
    ADD CONSTRAINT pk_streak_actions PRIMARY KEY (learner_id, action_id);

--
-- Name: practice_submissions practice_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_submissions
    ADD CONSTRAINT practice_submissions_pkey PRIMARY KEY (submission_id);

--
-- Name: profile_learners profile_learners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_learners
    ADD CONSTRAINT profile_learners_pkey PRIMARY KEY (learner_id);

--
-- Name: project_evidence project_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_evidence
    ADD CONSTRAINT project_evidence_pkey PRIMARY KEY (evidence_id);

--
-- Name: project_probe_runs project_probe_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_probe_runs
    ADD CONSTRAINT project_probe_runs_pkey PRIMARY KEY (run_id);

--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);

--
-- Name: purchase_events purchase_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_events
    ADD CONSTRAINT purchase_events_pkey PRIMARY KEY (event_id);

--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (purchase_id);

--
-- Name: relay_devices relay_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relay_devices
    ADD CONSTRAINT relay_devices_pkey PRIMARY KEY (device_id);

--
-- Name: relay_events relay_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relay_events
    ADD CONSTRAINT relay_events_pkey PRIMARY KEY (device_id, event_id);

--
-- Name: review_decks review_decks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_decks
    ADD CONSTRAINT review_decks_pkey PRIMARY KEY (deck_id);

--
-- Name: review_settings review_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_settings
    ADD CONSTRAINT review_settings_pkey PRIMARY KEY (learner_id);

--
-- Name: streak_states streak_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.streak_states
    ADD CONSTRAINT streak_states_pkey PRIMARY KEY (learner_id);

--
-- Name: project_evidence ux_project_evidence_run; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_evidence
    ADD CONSTRAINT ux_project_evidence_run UNIQUE (project_id, source, run_id, concept_id, slot, ref);

--
-- Name: identity_challenges_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_challenges_expires_idx ON public.identity_challenges USING btree (expires_at);

--
-- Name: identity_sessions_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_sessions_subject_idx ON public.identity_sessions USING btree (subject);

--
-- Name: identity_social_bundles_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX identity_social_bundles_expires_idx ON public.identity_social_bundles USING btree (expires_at);

--
-- Name: inbox_claims_client_retention_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inbox_claims_client_retention_idx ON public.inbox_claims USING btree (claimed_at, source, event_id) WHERE (((source)::text ~~ 'client:%'::text) AND (request_fingerprint IS NOT NULL) AND (outcome IS NOT NULL));

--
-- Name: ix_career_decisions_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_career_decisions_item ON public.career_review_decisions USING btree (item_id, at);

--
-- Name: ix_career_items_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_career_items_learner ON public.career_experience_items USING btree (learner_id, updated_at DESC);

--
-- Name: ix_career_items_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_career_items_queue ON public.career_experience_items USING btree (state, due_at);

--
-- Name: ix_harness_stage_proofs_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_harness_stage_proofs_learner ON public.harness_stage_proofs USING btree (learner_id, build_id, recorded_at DESC);

--
-- Name: ix_http_security_rate_windows_reset_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_http_security_rate_windows_reset_at ON public.http_security_rate_windows USING btree (reset_at);

--
-- Name: ix_mcp_access_tokens_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_access_tokens_learner ON public.mcp_access_tokens USING btree (learner_id, created_at DESC);

--
-- Name: ix_mcp_vector_points_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcp_vector_points_pending ON public.mcp_vector_points USING btree (kind, source_id) WHERE (synced_at IS NULL);

--
-- Name: ix_notes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notes_created_at ON public.notes USING btree (created_at DESC);

--
-- Name: ix_notifications_learner_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_learner_page ON public.notifications USING btree (learner_id, created_at DESC, id DESC);

--
-- Name: ix_notifications_learner_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_notifications_learner_unread ON public.notifications USING btree (learner_id) WHERE (read_at IS NULL);

--
-- Name: ix_practice_problem_versions_pattern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_practice_problem_versions_pattern ON public.practice_problem_versions USING btree (pattern_id, order_index) WHERE ((status)::text = 'published'::text);

--
-- Name: ix_practice_submissions_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_practice_submissions_history ON public.practice_submissions USING btree (learner_id, created_at DESC, submission_id DESC) INCLUDE (problem_id) WHERE ((kind)::text = 'submit'::text);

--
-- Name: ix_practice_submissions_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_practice_submissions_learner ON public.practice_submissions USING btree (learner_id, created_at DESC);

--
-- Name: ix_practice_submissions_problem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_practice_submissions_problem ON public.practice_submissions USING btree (learner_id, problem_id, kind, verdict);

--
-- Name: ix_project_evidence_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_evidence_latest ON public.project_evidence USING btree (project_id, concept_id, slot, source, ref, at DESC);

--
-- Name: ix_project_probe_runs_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_project_probe_runs_project ON public.project_probe_runs USING btree (project_id, at DESC);

--
-- Name: ix_projects_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_projects_learner ON public.projects USING btree (learner_id, created_at DESC);

--
-- Name: ix_purchase_events_purchase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_purchase_events_purchase ON public.purchase_events USING btree (purchase_id, created_at);

--
-- Name: ix_purchases_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_purchases_learner ON public.purchases USING btree (learner_id, created_at DESC);

--
-- Name: ix_relay_devices_learner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_relay_devices_learner ON public.relay_devices USING btree (learner_id, confirmed_at DESC);

--
-- Name: ix_relay_events_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_relay_events_task ON public.relay_events USING btree (learner_id, task_id, created_at);

--
-- Name: ix_review_cards_deck; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_cards_deck ON public.review_cards USING btree (deck_id, version, sort_index);

--
-- Name: ix_review_reviews_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_reviews_day ON public.review_reviews USING btree (learner_id, answered_on);

--
-- Name: ix_review_states_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_review_states_due ON public.review_states USING btree (learner_id, status, due_on);

--
-- Name: ix_streak_actions_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_streak_actions_day ON public.streak_actions USING btree (learner_id, day);

--
-- Name: ux_career_items_open; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_career_items_open ON public.career_experience_items USING btree (learner_id, item_type, subject) WHERE (state <> 'revoked'::text);

--
-- Name: ux_career_reviewers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_career_reviewers_active ON public.career_reviewers USING btree (reviewer_id) WHERE (ended_at IS NULL);

--
-- Name: ux_harness_build_bindings_binding; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_harness_build_bindings_binding ON public.harness_build_bindings USING btree (binding_id);

--
-- Name: ux_harness_contents_published; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_harness_contents_published ON public.harness_contents USING btree (kind, content_key) WHERE ((status)::text = 'published'::text);

--
-- Name: ux_lesson_attempts_revision; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lesson_attempts_revision ON public.lesson_attempts USING btree (learner_id, lesson_id, lesson_version, activity_id, revision);

--
-- Name: ux_lesson_versions_published; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lesson_versions_published ON public.lesson_versions USING btree (lesson_id) WHERE ((status)::text = 'published'::text);

--
-- Name: ux_mcp_access_tokens_digest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_mcp_access_tokens_digest ON public.mcp_access_tokens USING btree (token_digest);

--
-- Name: ux_mcp_vector_points_chunk; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_mcp_vector_points_chunk ON public.mcp_vector_points USING btree (kind, source_id, locale, content_hash);

--
-- Name: ux_practice_problem_versions_published; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_practice_problem_versions_published ON public.practice_problem_versions USING btree (problem_id) WHERE ((status)::text = 'published'::text);

--
-- Name: ux_profile_learners_cv_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_profile_learners_cv_slug ON public.profile_learners USING btree (cv_slug) WHERE (cv_slug IS NOT NULL);

--
-- Name: ux_purchase_events_refusal; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_purchase_events_refusal ON public.purchase_events USING btree (rail, provider_ref, kind, reason) WHERE (kind = ANY (ARRAY['confirmation-refused'::text, 'payment-voided'::text]));

--
-- Name: ux_purchases_rail_order; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_purchases_rail_order ON public.purchases USING btree (rail, order_code);

--
-- Name: ux_purchases_rail_provider_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_purchases_rail_provider_ref ON public.purchases USING btree (rail, provider_ref) WHERE (provider_ref IS NOT NULL);

--
-- Name: ux_relay_devices_device_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_relay_devices_device_code ON public.relay_devices USING btree (device_code_digest);

--
-- Name: ux_relay_devices_pending_user_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_relay_devices_pending_user_code ON public.relay_devices USING btree (user_code) WHERE (status = 'pending'::text);

--
-- Name: ux_relay_devices_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_relay_devices_token ON public.relay_devices USING btree (token_digest) WHERE (token_digest IS NOT NULL);

--
-- Name: career_review_decisions career_review_decisions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.career_review_decisions
    ADD CONSTRAINT career_review_decisions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.career_experience_items(item_id);

--
-- Name: project_ci_runs project_ci_runs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_ci_runs
    ADD CONSTRAINT project_ci_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;

--
-- Name: project_concepts project_concepts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_concepts
    ADD CONSTRAINT project_concepts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;

--
-- Name: project_evidence project_evidence_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_evidence
    ADD CONSTRAINT project_evidence_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;

--
-- Name: project_probe_runs project_probe_runs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_probe_runs
    ADD CONSTRAINT project_probe_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;

--
-- Name: project_proofs project_proofs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_proofs
    ADD CONSTRAINT project_proofs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;

--
-- Name: purchase_events purchase_events_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_events
    ADD CONSTRAINT purchase_events_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(purchase_id);
