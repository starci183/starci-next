import { ApplyEvidence } from "../ApplyEvidence"
import type { CardEnv, StudyCardView, WrittenDraftView } from "../StudyBody/types"

/** What the evidence block needs: its card and the environment. */
type EvidenceBlockProps = { readonly card: Extract<StudyCardView, { kind: "evidence" }>; readonly env: CardEnv }

/** The graded result of an evidence, once there is a grade. */
const evidenceResultOf = (draft: WrittenDraftView) =>
    draft.criteria.length === 0
        ? {}
        : {
              result: {
                  scoreLine: draft.scoreShort,
                  savedAt: draft.savedAt,
                  criteria: draft.criteria.map((each) => ({
                      id: each.id,
                      criterion: each.criterion,
                      level: each.level,
                      missing: each.missing,
                  })),
              },
          }

/** The evidence of an apply exercise: the red test output and the explanation, graded together. */
export const EvidenceBlock = (props: EvidenceBlockProps) => {
    const { card, env } = props
    return (
        <ApplyEvidence
            task={card.task}
            outputValue={card.outputValue}
            explanationValue={card.explanationValue}
            status={card.draft.status}
            isSendFailed={card.draft.isSendFailed}
            issue={card.draft.issue}
            {...evidenceResultOf(card.draft)}
            labels={env.labels.evidence}
            plansHref={env.plansHref}
            onOutputChange={(text) => env.on.writeEvidence(card.id, "output", text)}
            onExplanationChange={(text) => env.on.writeEvidence(card.id, "explanation", text)}
            onSubmit={() => env.on.submitEvidence(card.id, card.outputValue, card.explanationValue)}
        />
    )
}
