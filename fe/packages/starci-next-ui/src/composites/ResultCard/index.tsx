import { SurfaceCard } from "@starci/grammar/common"
import { levelWordsOf, toneOf } from "./levels"
import type { WrittenDraftView, LessonResultLabels } from "../StudyBody/types"

/** What the result card needs: the graded draft and the words. */
type ResultCardProps = { readonly draft: WrittenDraftView; readonly labels: LessonResultLabels }

/** The line under a criterion: what is missing when the grade is not full, else the quote of the answer that earns it. */
const lineOf = (
    criterion: WrittenDraftView["criteria"][number],
    labels: LessonResultLabels,
): { readonly description?: string } => {
    if (criterion.missing !== "") return { description: `${labels.missing}: ${criterion.missing}` }
    return criterion.evidence === "" ? {} : { description: criterion.evidence }
}

/**
 * The result of a graded written answer: the rubric rows with the level badge and the missing line, the score and the time it was saved
 * in the head, and, for the opening diagnostic, the closing line that says falling short is expected. Nothing before a grade.
 */
export const ResultCard = (props: ResultCardProps) => {
    const { draft, labels } = props
    if (draft.criteria.length === 0) return null
    const fact = [draft.scoreShort, draft.savedAt === "" ? "" : labels.savedAt(draft.savedAt)]
        .filter((each) => each !== "")
        .join(" · ")
    return (
        <SurfaceCard
            kind="list"
            label={labels.title}
            {...(fact === "" ? {} : { fact })}
            empty={labels.title}
            items={[
                ...draft.criteria.map((criterion) => ({
                    id: criterion.id,
                    title: criterion.criterion,
                    ...lineOf(criterion, labels),
                    badges: [
                        { label: levelWordsOf(criterion.level, labels.levels, ""), tone: toneOf(criterion.level) },
                    ] as const,
                })),
                ...(draft.isDiagnostic ? [{ id: "note", title: labels.diagnosticNote }] : []),
            ]}
        />
    )
}
