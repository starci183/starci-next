import { SurfaceCard } from "@starci/grammar/common"

/** The tone of the badge of a numbered row. */
export type NumberedListTone = "accent" | "success" | "warning" | "muted" | "neutral"

/** One row of a numbered list, already in words; the position is drawn by the list. */
export type NumberedListItem = {
    readonly id: string
    readonly title: string
    readonly description?: string | undefined
    readonly badge?: { readonly label: string; readonly tone: NumberedListTone } | undefined
    /** Where the row leads, with the words of its action; both or none. */
    readonly link?: { readonly href: string; readonly label: string } | undefined
    /** True when the reader is on this row. */
    readonly isCurrent?: boolean | undefined
}

/** A numbered list of rows. */
type NumberedListCardProps = {
    readonly label: string
    readonly emptyLabel: string
    readonly items: ReadonlyArray<NumberedListItem>
    readonly isLoading?: boolean
}

/** A card with a numbered list of rows, each with an optional badge and an optional way on. */
export const NumberedListCard = (props: NumberedListCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        empty={props.emptyLabel}
        {...(props.isLoading === true ? { isLoading: true } : {})}
        items={props.items.map((item, index) => ({
            id: item.id,
            title: item.title,
            ...(item.description === undefined ? {} : { description: item.description }),
            leading: { position: index + 1 },
            ...(item.badge === undefined ? {} : { badges: [item.badge] as const }),
            ...(item.link === undefined
                ? {}
                : {
                      state: item.isCurrent === true ? ("informative" as const) : ("neutral" as const),
                      href: item.link.href,
                      action: { label: item.link.label, href: item.link.href },
                  }),
        }))}
    />
)
