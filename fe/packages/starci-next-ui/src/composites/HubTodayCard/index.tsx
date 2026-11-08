import { SurfaceCard, Text } from "@starci/grammar/common"

/** One thing left for the streak today. */
export type HubTodayRow = {
    readonly id: string
    readonly title: string
    /** The learning part it belongs to. */
    readonly part: string
    readonly href: string
}

/** The list of today: what is left to keep the streak, each row one click away. */
type HubTodayCardProps = {
    readonly label: string
    /** The sentence beside the label (how many things are left, or that today already counts). */
    readonly summary: string
    readonly rows: ReadonlyArray<HubTodayRow>
    readonly emptyLabel: string
    readonly isLoading?: boolean
}

/** The today card: one linked row per thing left today. */
export const HubTodayCard = (props: HubTodayCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        fact={props.summary}
        {...(props.isLoading === true ? { isLoading: true } : {})}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.title,
            href: row.href,
            badges: [{ label: row.part }] as const,
        }))}
        empty={<Text tone="muted">{props.emptyLabel}</Text>}
    />
)
