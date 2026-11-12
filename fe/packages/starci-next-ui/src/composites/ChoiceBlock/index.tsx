import { Section, Stack, Text } from "@starci/grammar/common"
import { ChoiceCard } from "../ChoiceCard"
import { ChoiceWhy } from "../ChoiceWhy"
import type { CardEnv, StudyCardView } from "../StudyBody/types"

/** What a choice card needs: its data, the environment and whether it is the quick check of a theory section. */
type ChoiceBlockProps = { readonly card: Extract<StudyCardView, { kind: "choice" }>; readonly env: CardEnv }

/**
 * A choice. The quick check after a theory section keeps the explanation of each option under it (graded answers saved); a prediction
 * shows the verdict and then one "why" card with the reason of each option in normal text.
 */
export const ChoiceBlock = (props: ChoiceBlockProps) => {
    const { card, env } = props
    const isGraded = card.status === "graded"
    const body = (
        <ChoiceCard
            prompt={card.prompt}
            options={card.options}
            pickedId={card.pickedId}
            status={card.status}
            isSendFailed={card.isSendFailed}
            isCorrect={card.isCorrect}
            explanations={card.isCheck ? card.explanations : {}}
            labels={env.labels.choice}
            plansHref={env.plansHref}
            onPick={(optionId) => env.on.pick(card.id, optionId)}
            onSubmit={() => env.on.submitChoice(card.id, card.pickedId)}
        />
    )
    const saved =
        isGraded && card.savedAt !== "" ? (
            <Text size="xs" tone="muted">
                {env.labels.result.savedAt(card.savedAt)}
            </Text>
        ) : null
    const why =
        isGraded && !card.isCheck ? (
            <ChoiceWhy
                title={env.labels.result.why}
                options={card.options}
                explanations={card.explanations}
                correctId={card.correctId}
                correctWords={env.labels.choice.correct}
                markdownLabels={env.labels.markdown}
            />
        ) : null
    return card.isCheck ? (
        <Section title={env.labels.result.check} headingLevel={2}>
            {body}
            {saved}
        </Section>
    ) : (
        <Stack gap="row">
            {body}
            {saved}
            {why}
        </Stack>
    )
}
