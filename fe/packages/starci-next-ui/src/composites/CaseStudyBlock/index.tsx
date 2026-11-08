import { Grid, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One case study of the collection, announced and not open yet, already in words. */
export type CatalogCaseCard = {
    readonly id: string
    readonly title: string
    /** The lessons it needs first, already in words. */
    readonly description: string
    /** The status badge ("coming soon"). */
    readonly status: string
    /** The kind of card ("case study"). */
    readonly kind: string
}

/** The case-study collection, worded by its block. */
type CaseStudyBlockProps = {
    readonly title: string
    readonly meta: string
    /** What is still to come, already in words; empty hides it. */
    readonly pending: string
    readonly cards: ReadonlyArray<CatalogCaseCard>
}

/** What a case tile needs. */
type CaseTileProps = { readonly card: CatalogCaseCard }

/** One announced case study as a peer tile. */
const CaseTile = (props: CaseTileProps) => (
    <SurfaceCard
        kind="tile"
        name={props.card.title}
        description={props.card.description}
        mark={{ avatar: { name: props.card.title, seed: props.card.id } }}
        badges={[{ label: props.card.kind }, { label: props.card.status, tone: "muted" }]}
    />
)

/** The case-study collection of the catalog: announced real-world case studies, each naming the lessons it needs, until they are published. */
export const CaseStudyBlock = (props: CaseStudyBlockProps) => (
    <Section title={props.title} meta={props.meta}>
        <Stack gap="row">
            <Grid kind="cards">
                {props.cards.map((card) => (
                    <CaseTile key={card.id} card={card} />
                ))}
            </Grid>
            {props.pending === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.pending}
                </Text>
            )}
        </Stack>
    </Section>
)
