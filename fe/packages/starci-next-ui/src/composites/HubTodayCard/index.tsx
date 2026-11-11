import { SurfaceCard, Text, type IconSource } from "@starci/grammar/common"
import {
    EssentialsGlyph,
    IncidentsGlyph,
    InterviewGlyph,
    PracticeGlyph,
    ProjectsGlyph,
    ReviewGlyph,
} from "../../leaves/Icon"

/** One thing left for the streak today. */
export type HubTodayRow = {
    readonly id: string
    readonly title: string
    /** The learning part it belongs to, by its key (it picks the icon). */
    readonly shard: string
    /** The learning part it belongs to, in words. */
    readonly part: string
    readonly href: string
}

/** The icon of each learning part; a part with none (a new one) falls back to the lesson icon. */
const SHARD_ICONS: Readonly<Record<string, IconSource>> = {
    essentials: EssentialsGlyph,
    review: ReviewGlyph,
    practice: PracticeGlyph,
    projects: ProjectsGlyph,
    incidents: IncidentsGlyph,
    interview: InterviewGlyph,
}

/** The list of today: what is left to keep the streak, each row one press away. */
type HubTodayCardProps = {
    readonly label: string
    /** How many things are left. */
    readonly count: number
    /** The 12 muted sentence at the end of the head row (how many things are left, or that today already counts). */
    readonly summary: string
    readonly rows: ReadonlyArray<HubTodayRow>
    readonly emptyLabel: string
    readonly isLoading?: boolean
}

/** The today card: one navigation row per thing left today, a count chip beside the label and the summary at its end. */
export const HubTodayCard = (props: HubTodayCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        count={props.count}
        labelEnd={
            <Text tone="muted" size="xs">
                {props.summary}
            </Text>
        }
        {...(props.isLoading === true ? { isLoading: true } : {})}
        items={props.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: (
                <Text size="xs" tone="muted">
                    {row.part}
                </Text>
            ),
            leading: { icon: SHARD_ICONS[row.shard] ?? EssentialsGlyph },
            href: row.href,
        }))}
        empty={<Text tone="muted">{props.emptyLabel}</Text>}
    />
)
