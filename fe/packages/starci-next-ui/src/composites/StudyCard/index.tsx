import { Markdown, Stack, SurfaceCard } from "@starci/grammar/common"
import { WrittenCard } from "../WrittenCard"
import { LessonCode } from "../LessonCode"
import { ChoiceBlock } from "../ChoiceBlock"
import { EvidenceBlock } from "../EvidenceBlock"
import { FilesBlock } from "../FilesBlock"
import { ResultCard } from "../ResultCard"
import { SimulationBlock } from "../SimulationBlock"
import { ungraded } from "../ResultCard/levels"
import type { CardEnv, SectionTabs, StudyCardView } from "../StudyBody/types"

/** One card of the body with the environment it is drawn in; the reading card of a theory phase also carries the section tabs. */
type StudyCardProps = {
    readonly card: StudyCardView
    readonly env: CardEnv
    readonly sectionTabs?: SectionTabs
}

/** One card of the phase body, drawn by its kind. */
export const StudyCard = (props: StudyCardProps) => {
    const { card, env } = props
    switch (card.kind) {
        case "reading":
            return (
                <SurfaceCard
                    {...(props.sectionTabs === undefined ? { label: card.title } : { ariaLabel: card.title })}
                    {...(props.sectionTabs === undefined
                        ? {}
                        : { headers: [{ kind: "filter" as const, ...props.sectionTabs }] })}
                >
                    <Markdown
                        source={card.markdown}
                        labels={env.labels.markdown}
                        renderCode={(code) => <LessonCode code={code} />}
                    />
                </SurfaceCard>
            )
        case "choice":
            return <ChoiceBlock card={card} env={env} />
        case "written":
            return (
                <Stack gap="row">
                    <WrittenCard
                        prompt={card.prompt}
                        criteria={card.criteria}
                        instructions={card.instructions}
                        draft={ungraded(card.draft)}
                        labels={env.labels.written}
                        plansHref={env.plansHref}
                        onChange={(text) => env.on.write(card.id, text)}
                        onSubmit={() => env.on.submitWritten(card.id, card.draft.value)}
                    />
                    <ResultCard draft={card.draft} labels={env.labels.result} />
                </Stack>
            )
        case "simulation":
            return <SimulationBlock card={card} env={env} />
        case "evidence":
            return <EvidenceBlock card={card} env={env} />
        case "files":
            return <FilesBlock card={card} env={env} />
    }
}
