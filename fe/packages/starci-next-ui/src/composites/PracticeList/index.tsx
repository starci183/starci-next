import { NumberedListCard } from "../NumberedListCard"

/** The tone of the status badge of a practice row. */
export type PracticeRowTone = "accent" | "success" | "warning" | "muted" | "neutral"

/** One row of a practice list: a pattern or a problem, already in words. */
export type PracticeRow = {
    readonly id: string
    readonly title: string
    /** The line under the title (progress of a pattern, tags and difficulty of a problem); may be empty. */
    readonly description: string
    /** The status badge words (solved, tried, Premium, free); empty draws none. */
    readonly badge: string
    readonly badgeTone: PracticeRowTone
    /** The destination of the row. */
    readonly href: string
    /** The words of the row's action. */
    readonly cta: string
    /** True when the reader is on this row (the problem being solved). */
    readonly isCurrent: boolean
}

/** A list of practice patterns or problems. */
type PracticeListProps = {
    readonly label: string
    readonly emptyLabel: string
    readonly rows: ReadonlyArray<PracticeRow>
    readonly isLoading?: boolean
}

/** The list of patterns or problems of Practice code: numbered rows with their status, each linking to where it leads. */
export const PracticeList = (props: PracticeListProps) => (
    <NumberedListCard
        label={props.label}
        emptyLabel={props.emptyLabel}
        isLoading={props.isLoading === true}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description === "" ? undefined : row.description,
            badge: row.badge === "" ? undefined : { label: row.badge, tone: row.badgeTone },
            link: { href: row.href, label: row.cta },
            isCurrent: row.isCurrent,
        }))}
    />
)
