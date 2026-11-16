import { Section } from "@starci/grammar/common"

/** One line of an outline: where it jumps to and how it reads, already in words. */
export type OutlineEntry = {
    readonly id: string
    readonly label: string
    readonly href: string
}

/** The outline beside a long document. */
type OutlineListProps = {
    /** The name of the outline, drawn as its heading. */
    readonly label: string
    /** What a document with no sections says. */
    readonly emptyLabel: string
    readonly entries: ReadonlyArray<OutlineEntry>
    readonly isLoading?: boolean
}

/** The sections of a document as a flat numbered list; each line jumps to its section. */
export const OutlineList = (props: OutlineListProps) => (
    <Section
        kind="list"
        title={props.label}
        headingLevel={2}
        empty={props.emptyLabel}
        {...(props.isLoading === true ? { isLoading: true } : {})}
        items={props.entries.map((entry, index) => ({
            id: entry.id,
            title: entry.label,
            leading: { position: index + 1 },
            href: entry.href,
        }))}
    />
)
