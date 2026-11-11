import type { LessonLocaleDocument } from "./lesson.contracts"
import type { LessonOutline } from "./lesson-read.contracts"

/** The outline of one stored locale: every section activity with its phase, outcomes, diagnostic mark and the evidence of its criteria. */
export const outlineOf = (document: LessonLocaleDocument): LessonOutline => ({
    outcomeIds: document.learningOutcomes.map((outcome) => outcome.id),
    activities: document.sections.flatMap((section) =>
        (section.activities ?? []).map((activity) => ({
            id: activity.id,
            kind: activity.kind,
            phase: section.phase,
            isDiagnostic: activity.isDiagnostic === true,
            outcomeIds: [...activity.outcomeIds],
            expectedEvidence: Object.fromEntries(
                (activity.rubric ?? []).map((criterion) => [criterion.id, criterion.expectedEvidence]),
            ),
        })),
    ),
})
