import { NumberedListCard, type NumberedListItem } from "../NumberedListCard"

/** One of the seven mindset concepts, already in words. */
export type AgentConceptRow = {
    readonly id: string
    readonly title: string
    /** What counts as evidence of the concept. */
    readonly description: string
    /** The badge words (the free taste); empty draws none. */
    readonly badge: string
}

/** The seven mindset concepts every track is graded on. */
type AgentConceptListProps = {
    readonly label: string
    readonly emptyLabel: string
    readonly rows: ReadonlyArray<AgentConceptRow>
    readonly isLoading?: boolean
}

/** The numbered row of a concept: its evidence and, for the free taste, a badge. */
const itemOf = (row: AgentConceptRow): NumberedListItem => ({
    id: row.id,
    title: row.title,
    description: row.description,
    badge: row.badge === "" ? undefined : { label: row.badge, tone: "accent" },
})

/** The grid of mindset concepts: numbered rows, each with what counts as its evidence. */
export const AgentConceptList = (props: AgentConceptListProps) => (
    <NumberedListCard
        label={props.label}
        emptyLabel={props.emptyLabel}
        isLoading={props.isLoading === true}
        items={props.rows.map((row) => itemOf(row))}
    />
)
