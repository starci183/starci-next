import { SurfaceCard } from "@starci/grammar/common"

/** One lesson of the topic path in the teacher's module order. */
export type TopicPathRow = {
    readonly id: string
    readonly title: string
    /** Difficulty, minutes and phases for a published lesson, or what is pending, already in words. */
    readonly meta: string
    /** The status badge, already in words ("coming soon" or where the learner stands). */
    readonly status: string
    /** The destination of a published lesson; empty for a lesson not yet moved. */
    readonly href: string
    /** The words of the button that opens a published lesson (start, continue, view); empty for a lesson not yet moved. */
    readonly cta: string
    readonly isOpen: boolean
}

/** The path of a topic. */
type TopicPathProps = {
    readonly label: string
    readonly emptyLabel: string
    readonly rows: ReadonlyArray<TopicPathRow>
}

/** The "path" of a topic: its lessons in the teacher's order, published ones linking to the lesson and the others marked as coming. */
export const TopicPath = (props: TopicPathProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        empty={props.emptyLabel}
        items={props.rows.map((row, index) => ({
            id: row.id,
            title: row.title,
            description: row.meta,
            leading: { position: index + 1 },
            badges: [
                row.isOpen
                    ? ({ label: row.status, tone: "accent", isDot: true } as const)
                    : ({ label: row.status, tone: "muted" } as const),
            ] as const,
            state: row.isOpen ? "informative" : "neutral",
            ...(row.href === "" ? {} : { href: row.href, action: { label: row.cta, href: row.href } }),
        }))}
    />
)
