import { Grid, Section, Stack, Text } from "@starci/grammar/common"
import { LessonTile } from "../LessonTile"
import { TopicTile } from "../TopicTile"

/** One lesson card of a section, already in words. */
type CatalogCard = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly difficulty: string
    readonly status: string
    readonly facts: ReadonlyArray<string>
    readonly href: string
}

/** One topic card of a section, already in words. */
type CatalogTopic = {
    readonly id: string
    readonly eyebrow: string
    readonly title: string
    readonly source: string
    readonly openLabel: string
    readonly preview: ReadonlyArray<{ readonly id: string; readonly title: string; readonly isOpen: boolean }>
    readonly status: string
    readonly progress: number
    readonly href: string
}

/** One group of the catalog: topic cards in the default view, lesson cards while a search or the difficulty filter is active. */
export type CatalogNode = {
    readonly id: string
    readonly label: string
    readonly meta: string
    readonly topics: ReadonlyArray<CatalogTopic>
    readonly cards: ReadonlyArray<CatalogCard>
    /** What is still being moved into the group, already in words; empty hides it. */
    readonly pending: string
}

/** A group with the words of its cards. */
type CatalogSectionProps = {
    readonly node: CatalogNode
    readonly openLabel: string
}

/** A group of the catalog: its name over its topic cards or lesson cards, then what is still to come. */
export const CatalogSection = (props: CatalogSectionProps) => (
    <Section title={props.node.label} meta={props.node.meta}>
        <Stack gap="row">
            {props.node.topics.length === 0 ? null : (
                <Grid kind="cards">
                    {props.node.topics.map((topic) => (
                        <TopicTile key={topic.id} {...topic} openAction={props.openLabel} />
                    ))}
                </Grid>
            )}
            {props.node.cards.length === 0 ? null : (
                <Grid kind="cards">
                    {props.node.cards.map((card) => (
                        <LessonTile key={card.id} {...card} openLabel={props.openLabel} />
                    ))}
                </Grid>
            )}
            {props.node.pending === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.node.pending}
                </Text>
            )}
        </Stack>
    </Section>
)
