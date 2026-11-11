import { SurfaceCard } from "@starci/grammar/common"
import { FileGlyph } from "../../leaves/Icon"

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

/** The case-study collection of the catalog: one list card of announced real-world case studies, each naming the lessons it needs, until they are published. */
export const CaseStudyBlock = (props: CaseStudyBlockProps) => (
    <SurfaceCard
        kind="list"
        label={props.title}
        count={props.cards.length}
        {...(props.meta === "" ? {} : { fact: props.meta })}
        items={props.cards.map((card) => ({
            id: card.id,
            title: card.title,
            description: card.description,
            leading: { icon: FileGlyph },
            badges: [{ label: card.kind }, { label: card.status, tone: "muted" as const }],
        }))}
        empty={props.pending}
        {...(props.pending === "" ? {} : { note: props.pending })}
    />
)
