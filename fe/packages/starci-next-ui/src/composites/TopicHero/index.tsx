import { Cluster, ProgressCircle, Section, Stack, Text } from "@starci/grammar/common"
import { ArtImage, type topicArt } from "../../leaves/Art"

/** Props of the hero of a topic page. */
type TopicHeroProps = {
    readonly art: ReturnType<typeof topicArt>
    readonly artBase: string
    /** The ring of lessons done: done over total, with the words inside. */
    readonly ring: { readonly done: number; readonly total: number; readonly label: string }
    /** The accessible name of the ring and of the figures strip. */
    readonly ringLabel: string
    readonly figures: ReadonlyArray<{ readonly id: string; readonly term: string; readonly value: string }>
    readonly isLoading?: boolean
}

/** The hero of a topic: the picture of the topic, the ring of lessons done and the figures of its size. */
export const TopicHero = (props: TopicHeroProps) => (
    <Stack gap="section">
        <ArtImage asset={props.art} base={props.artBase} maxWidth={420} />
        <Cluster gap="inline" align="center" wrap>
            <Cluster gap="inline" align="center" wrap={false}>
                <ProgressCircle
                    label={props.ringLabel}
                    size="lg"
                    value={props.ring.total === 0 ? 0 : Math.round((props.ring.done / props.ring.total) * 100)}
                />
                <Text as="span" role="figure" tabular>
                    {props.ring.label}
                </Text>
            </Cluster>
            <Section
                kind="figures"
                ariaLabel={props.ringLabel}
                items={props.figures.map((figure) => ({ id: figure.id, term: figure.term, value: figure.value }))}
                {...(props.isLoading === true ? { isLoading: true } : {})}
            />
        </Cluster>
    </Stack>
)
