import { Badge, Meter, Section, Stack, Text } from "@starci/grammar/common"
import type { ApplyLabels, ApplyPartView } from "./types"

/** What the right column needs. */
type EssentialApplyAsideProps = { readonly part: ApplyPartView; readonly labels: ApplyLabels }

/** The right column of the apply part: the score of the rung on screen out of its maximum and the profile line the proof will add. */
export const EssentialApplyAside = (props: EssentialApplyAsideProps) => {
    const { part, labels } = props
    const challenge = part.challenge
    return (
        <Stack gap="section">
            {challenge === undefined ? null : (
                <Section title={labels.aside.score} headingLevel={2}>
                    <Stack gap="inline">
                        <Text as="p" size="figure" isStrong tabular>
                            {`${challenge.score} / ${challenge.maxScore}`}
                        </Text>
                        <Meter
                            label={labels.aside.score}
                            value={challenge.score}
                            maxValue={challenge.maxScore}
                            isLabelHidden
                        />
                        <Text tone="muted">{labels.aside.scoreNote(challenge.maxScore)}</Text>
                    </Stack>
                </Section>
            )}
            <Section title={labels.aside.cvTitle} headingLevel={2}>
                <Stack gap="inline">
                    {part.cvLine === "" ? (
                        <Text tone="muted">{labels.aside.cvNone}</Text>
                    ) : (
                        <Badge tone="success">{part.cvLine}</Badge>
                    )}
                    <Text tone="muted">{labels.aside.cvNote}</Text>
                </Stack>
            </Section>
        </Stack>
    )
}
