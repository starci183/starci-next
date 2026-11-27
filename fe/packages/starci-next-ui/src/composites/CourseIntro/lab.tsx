import { Badge, Button, Cluster, InlineStatus, Progress, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { CourseCaseStatus } from "../CourseCaseLoop/types"

/** One case as the intro's lab card lists it: its title and where the learner stands in it. */
export type CourseIntroLabRowView = {
    readonly id: string
    readonly title: string
    readonly status: CourseCaseStatus
    /** The words of the state ("qua", "chưa chạy"). */
    readonly statusLabel: string
}

/**
 * The lab card beside the intro (owner 2026-11-27, split intro page): the lab on the learner's machine at a glance, its progress, the first
 * cases with their state and the one command that starts it. Every word is resolved by the app.
 */
export type CourseIntroLabView = {
    readonly title: string
    /** The passed figure as the learner reads it ("0 / 8 ca qua"). */
    readonly figure: string
    /** Passed cases out of all, 0 to 100. */
    readonly percent: number
    /** The shape of the lab in one line ("2 dịch vụ · 2 ca bình thường · 6 ca sự cố"). */
    readonly meta: string
    /** The first cases, in the order the learner meets them. */
    readonly rows: ReadonlyArray<CourseIntroLabRowView>
    /** The line for the cases not listed ("+ 5 ca"); empty when every case is listed. */
    readonly more: string
    readonly start: string
    /** What finishing means, under the command ("Sửa một file tới khi cả 8 ca đều qua"). */
    readonly caption: string
}

/** The glyph state of a case, the same mapping as the loop pages. */
const STATE = { green: "done", red: "error", error: "error", open: "notRun", locked: "waiting" } as const

/** What the lab card needs. */
type CourseIntroLabProps = {
    readonly view: CourseIntroLabView
    readonly onStart: () => void
    readonly isLoading?: boolean
}

/** The lab card of the intro's rail: title and figure, the progress bar, the shape line, the first cases, the start command. */
export const CourseIntroLab = (props: CourseIntroLabProps) => {
    const { view } = props
    const isLoading = props.isLoading === true
    return (
        <SurfaceCard
            label={view.title}
            headingLevel={2}
            isLoading={isLoading}
            labelEnd={<Badge tone="neutral">{view.figure}</Badge>}
        >
            <Stack gap="section">
                <Stack gap="inline">
                    <Progress label={view.figure} value={view.percent} isLoading={isLoading} />
                    <Text role="caption" tone="muted" isLoading={isLoading}>
                        {view.meta}
                    </Text>
                </Stack>
                <Stack gap="inline">
                    {view.rows.map((row) => (
                        <Cluster key={row.id} gap="inline" justify="between" align="center">
                            <Text isLoading={isLoading}>{row.title}</Text>
                            <InlineStatus state={STATE[row.status]} label={row.statusLabel} />
                        </Cluster>
                    ))}
                    {view.more === "" ? null : (
                        <Text role="caption" tone="muted">
                            {view.more}
                        </Text>
                    )}
                </Stack>
                <Stack gap="inline">
                    <Button variant="primary" onPress={props.onStart}>
                        {view.start}
                    </Button>
                    <Text role="caption" tone="muted">
                        {view.caption}
                    </Text>
                </Stack>
            </Stack>
        </SurfaceCard>
    )
}
