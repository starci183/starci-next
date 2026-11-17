import { Stack } from "@starci/grammar/common"
import { SimulationCard } from "../../branches/SimulationCard"
import { WrittenCard } from "../WrittenCard"
import { ResultCard } from "../ResultCard"
import { ungraded } from "../ResultCard/levels"
import type { CardEnv, StudyCardView } from "../StudyBody/types"

/** What a simulation block needs: its card and the environment. */
type SimulationBlockProps = { readonly card: Extract<StudyCardView, { kind: "simulation" }>; readonly env: CardEnv }

/** A simulation card and, once it reaches a goal, its debrief question as a written answer with its result. */
export const SimulationBlock = (props: SimulationBlockProps) => {
    const { card, env } = props
    return (
        <Stack gap="section">
            <SimulationCard
                key={card.isRestored ? "restored" : "fresh"}
                activityId={card.id}
                prompt={card.prompt}
                initialStateId={card.initialStateId}
                states={card.states}
                actions={card.actions}
                transitions={card.transitions}
                initialSteps={card.initialSteps}
                initialTriedActionIds={card.initialTriedActionIds}
                labels={env.labels.simulation}
            />
            {card.isSuccess ? (
                <>
                    <WrittenCard
                        prompt={card.debrief}
                        criteria={[]}
                        instructions=""
                        draft={ungraded(card.draft)}
                        labels={env.labels.written}
                        plansHref={env.plansHref}
                        onChange={(text) => env.on.write(card.id, text)}
                        onSubmit={() => env.on.submitDebrief(card.id, card.draft.value)}
                    />
                    <ResultCard draft={card.draft} labels={env.labels.result} />
                </>
            ) : null}
        </Stack>
    )
}
