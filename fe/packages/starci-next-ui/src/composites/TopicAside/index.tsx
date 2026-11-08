import { EntryList } from "../EntryList"

/** One related entry of the aside. */
export type TopicAsideEntry = {
    readonly id: string
    readonly title: string
    /** The destination, or empty for text only. */
    readonly href: string
}

/** The aside of a topic page; a block with nothing in it is left out. */
type TopicAsideProps = {
    readonly prerequisitesLabel: string
    readonly prerequisites: ReadonlyArray<TopicAsideEntry>
    readonly relatedLabel: string
    readonly related: ReadonlyArray<TopicAsideEntry>
    readonly emptyLabel: string
}

/** One list card of the aside. */
type AsideListProps = {
    readonly label: string
    readonly entries: ReadonlyArray<TopicAsideEntry>
    readonly emptyLabel: string
}

/** One list of the aside, hidden when it has no entry. */
const AsideList = (props: AsideListProps) =>
    props.entries.length === 0 ? null : (
        <EntryList label={props.label} empty={props.emptyLabel} entries={props.entries} />
    )

/** "Should know first" and "related topics", each shown only once the data carries it. */
export const TopicAside = (props: TopicAsideProps) => (
    <>
        <AsideList label={props.prerequisitesLabel} entries={props.prerequisites} emptyLabel={props.emptyLabel} />
        <AsideList label={props.relatedLabel} entries={props.related} emptyLabel={props.emptyLabel} />
    </>
)
