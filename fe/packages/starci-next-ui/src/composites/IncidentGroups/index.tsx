import { EmptyNotice, Stack, SurfaceCard } from "@starci/grammar/common"

/** One lesson row of the incident list, already in words. */
export type IncidentRowView = {
    readonly id: string
    readonly title: string
    /** The line under the title (the minutes and the difficulty of the lesson). */
    readonly description: string
    /** The status badge words (the incident is open, or coming soon). */
    readonly badge: string
    readonly badgeTone: "success" | "muted"
    /** Where an authored incident opens; empty while it is coming soon (the row then links nowhere). */
    readonly href: string
    /** The words of the row action; used only with a destination. */
    readonly cta: string
}

/** The lessons of one topic. */
export type IncidentGroupView = {
    readonly id: string
    readonly label: string
    readonly rows: ReadonlyArray<IncidentRowView>
}

/** The incident list grouped by topic. */
type IncidentGroupsProps = {
    readonly groups: ReadonlyArray<IncidentGroupView>
    /** The notice when no lesson is listed at all. */
    readonly emptyLabel: string
    readonly isLoading?: boolean
}

/** The incident list: one card of rows per topic, each row a lesson with its incident status; coming-soon rows are not links. */
export const IncidentGroups = (props: IncidentGroupsProps) =>
    props.groups.length === 0 ? (
        <EmptyNotice message={props.emptyLabel} />
    ) : (
        <Stack gap="region">
            {props.groups.map((group) => (
                <SurfaceCard
                    key={group.id}
                    kind="list"
                    label={group.label}
                    empty={props.emptyLabel}
                    {...(props.isLoading === true ? { isLoading: true } : {})}
                    items={group.rows.map((row) => ({
                        id: row.id,
                        title: row.title,
                        ...(row.description === "" ? {} : { description: row.description }),
                        badges: [{ label: row.badge, tone: row.badgeTone }] as const,
                        ...(row.href === "" ? {} : { href: row.href, action: { label: row.cta, href: row.href } }),
                    }))}
                />
            ))}
        </Stack>
    )
