import { SurfaceCard } from "@starci/grammar/common"

/** One entry of an entry list: its title and, when it has one, its destination. */
type EntryListEntry = {
    readonly id: string
    readonly title: string
    /** The destination, or empty for text only. */
    readonly href: string
}

/** A list card of titled entries, worded by its block. */
type EntryListProps = {
    readonly label: string
    /** What the card shows when it has no entry. */
    readonly empty: string
    readonly entries: ReadonlyArray<EntryListEntry>
}

/** A list card whose rows are titles, each a link when it has a destination and plain text otherwise. */
export const EntryList = (props: EntryListProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        empty={props.empty}
        items={props.entries.map((entry) => ({
            id: entry.id,
            title: entry.title,
            ...(entry.href === "" ? {} : { href: entry.href }),
        }))}
    />
)
