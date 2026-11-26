-- Essentials, Saga lesson `saga-compensation` (seed standard bbf12f8, 2026-11-26): the lab renamed its unhappy case `crash-mid-saga` to
-- `crash-mid-checkout` when the learner file became checkout.ts. Every row keyed by the old case id moves to the new one, so a learner who
-- had that case green keeps it (the next case stays open, and the named pages and page 6 still show).
-- Idempotent: a second run finds no `crash-mid-saga` row and changes nothing. A learner who already has both marks keeps one row under
-- the new id, merged so nothing they earned is lost (the higher hint level, green if either was green, the later reset and update).

-- 1. Marks of learners who hold both ids: fold the old mark into the new one, then drop the old row.
update public.course_case_marks as new
set hints_opened = greatest(new.hints_opened, old.hints_opened),
    ever_green = new.ever_green or old.ever_green,
    last_reset_at = case
        when new.last_reset_at is null then old.last_reset_at
        when old.last_reset_at is null then new.last_reset_at
        else greatest(new.last_reset_at, old.last_reset_at)
    end,
    stashed_branch = coalesce(new.stashed_branch, old.stashed_branch),
    updated_at = greatest(new.updated_at, old.updated_at)
from public.course_case_marks as old
where new.lesson_id = 'saga-compensation'
  and new.case_id = 'crash-mid-checkout'
  and old.lesson_id = 'saga-compensation'
  and old.case_id = 'crash-mid-saga'
  and old.learner_id = new.learner_id;

delete from public.course_case_marks as old
using public.course_case_marks as new
where old.lesson_id = 'saga-compensation'
  and old.case_id = 'crash-mid-saga'
  and new.lesson_id = 'saga-compensation'
  and new.case_id = 'crash-mid-checkout'
  and new.learner_id = old.learner_id;

-- 2. Every other old mark is renamed in place (no new-id row exists for its learner any more, so the natural key holds).
update public.course_case_marks
set case_id = 'crash-mid-checkout'
where lesson_id = 'saga-compensation' and case_id = 'crash-mid-saga';

-- 3. Runs: the case a run names (runs have no key on the case id, so a plain rename cannot collide).
update public.course_case_runs
set case_id = 'crash-mid-checkout'
where lesson_id = 'saga-compensation' and case_id = 'crash-mid-saga';

-- 4. Runs: the cases a run covered (`up_to`, an array of {caseId, status}), so a later run of the next case still reads this one as green.
update public.course_case_runs
set up_to = (
    select coalesce(
        jsonb_agg(
            case when entry ->> 'caseId' = 'crash-mid-saga' then jsonb_set(entry, '{caseId}', '"crash-mid-checkout"') else entry end
            order by position
        ),
        '[]'::jsonb
    )
    from jsonb_array_elements(up_to) with ordinality as item(entry, position)
)
where lesson_id = 'saga-compensation'
  and jsonb_typeof(up_to) = 'array'
  and up_to @> '[{"caseId": "crash-mid-saga"}]'::jsonb;
