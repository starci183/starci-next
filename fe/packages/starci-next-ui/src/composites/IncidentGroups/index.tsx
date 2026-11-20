import { Section, Stack } from "@starci/grammar/common"

/** One lesson row of the incident list, already in words. */
export type IncidentRowView = {
    readonly id: string
    readonly title: string
    /** The line under the title (the minutes and the difficulty of the lesson). */
    readonly description: string
    /** The status badge words (the incident is open, or coming soon). */
    readonly badge: string
    readonly badgeTone: "success"
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

/** The incident list: one flat list per topic, each row a lesson with a written incident and the command that opens it. */
export const IncidentGroups = (props: IncidentGroupsProps) => (
    <Stack gap="region">
        {props.groups.map((group) => (
            <Section
                key={group.id}
                kind="list"
                title={group.label}
                empty={props.emptyLabel}
                {...(props.isLoading === true ? { isLoading: true } : {})}
                items={group.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    badges: [{ label: row.badge, tone: row.badgeTone }] as const,
                    href: row.href,
                    action: { label: row.cta, href: row.href },
                }))}
                headingLevel={2}
            />
        ))}
    </Stack>
)
