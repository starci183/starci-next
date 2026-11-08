import { Badge, Cluster, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { ArtBeside } from "../../frames/ArtBeside"
import { UpsellRow, type UpsellRowProps } from "../UpsellRow"

/** The topic card at the head of the topic page, worded by its block. */
type TopicIntroProps = {
    readonly title: string
    /** What the topic is about; empty hides it until the data carries it. */
    readonly description: string
    /** The facts under the title (lessons open of total, the source), already in words. */
    readonly facts: ReadonlyArray<string>
    /** The learner's progress in the topic, already in words. */
    readonly progress: string
    /** The upsell for a reader without Premium; undefined hides it. */
    /** The decorative picture beside the text, already drawn; undefined leaves the card text only. */
    readonly art?: ReactNode
    readonly upsell: UpsellRowProps | undefined
}

/** The topic card: its name, what it covers, how much is open, the learner's progress and, without Premium, the way to Premium. */
export const TopicIntro = (props: TopicIntroProps) => (
    <SurfaceCard ariaLabel={props.title}>
        <ArtBeside art={props.art}>
            <Stack gap="row">
                {props.description === "" ? null : <Text as="p">{props.description}</Text>}
                <Cluster gap="inline" wrap>
                    {props.facts.map((fact) => (
                        <Badge key={fact} tone="neutral">
                            {fact}
                        </Badge>
                    ))}
                </Cluster>
                {props.progress === "" ? null : (
                    <Text size="sm" tone="muted">
                        {props.progress}
                    </Text>
                )}
                {props.upsell === undefined ? null : <UpsellRow {...props.upsell} />}
            </Stack>
        </ArtBeside>
    </SurfaceCard>
)
