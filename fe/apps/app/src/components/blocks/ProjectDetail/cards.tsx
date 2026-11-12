import {
    Alert,
    Badge,
    Button,
    Cluster,
    Input,
    Link,
    RelativeTime,
    Stack,
    SurfaceCard,
    Text,
    type BadgeData,
    type ListRowData,
    type TableRowData,
} from "@starci/grammar/common"
import { ExperienceGlyph, PracticeGlyph, ProjectsGlyph, RowProgress } from "@starci-next/ui"
import type {
    ChipView,
    ExperienceRowView,
    MilestoneRowView,
    ProjectDetailBusy,
    ProjectDetailFields,
    ProjectDetailLabels,
    ProbeLineView,
    ProjectDetailView,
    RunRowView,
} from "./types"

/** The data every card of the well reads: the settled project, the words, and whether the first read is still running. */
export type CardProps = {
    readonly view: ProjectDetailView
    readonly labels: ProjectDetailLabels
    readonly isLoading: boolean
}

/** The commands of the deployed-address card. */
export type DeployCommands = {
    readonly deployed: (value: string) => void
    readonly saveDeployed: () => void
    readonly runProbes: () => void
}

/** What the runs table needs besides the project: the language of its times. */
export type RunsCardProps = CardProps & { readonly locale: string }

/** What the deployed-address card needs: the field, the busy flags and the commands. */
export type DeployCardProps = CardProps & {
    readonly fields: ProjectDetailFields
    readonly busy: ProjectDetailBusy
    readonly on: DeployCommands
}

/** A chip as the data a row card draws. */
const badgeOf = (chip: ChipView): BadgeData => ({ label: chip.label, tone: chip.tone })

/** One milestone as a list row: its mark, name and proved count with a thin bar, the state chip, and the whole row a link. */
const milestoneRowOf = (row: MilestoneRowView, label: string): ListRowData => ({
    id: row.id,
    title: row.title,
    description: row.meta,
    leading: { icon: ProjectsGlyph },
    badges: [badgeOf(row.chip)],
    href: row.href,
    control: <RowProgress label={`${label}: ${row.title}`} value={row.percent} />,
})

/** What the milestones card needs: its rows, its label and the line of its empty state. */
export type MilestonesCardProps = {
    readonly rows: ReadonlyArray<MilestoneRowView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
}

/** The milestones: ONE list card, each row a real link to its milestone. */
export const MilestonesCard = (props: MilestonesCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        count={props.rows.length}
        isLoading={props.isLoading}
        items={props.rows.map((row) => milestoneRowOf(row, props.label))}
        empty={props.emptyLabel}
    />
)

/** The cells of one run row, by column id. */
const runRowOf = (row: RunRowView, locale: string): TableRowData => ({
    id: row.id,
    cells: {
        kind: row.kind,
        detail: row.detail,
        result: row.verdict === undefined ? null : <Badge tone={row.verdict.tone}>{row.verdict.label}</Badge>,
        at: row.at === "" ? null : <RelativeTime dateTime={row.at} locale={locale} size="sm" tone="muted" />,
    },
})

/** The latest runs: a table card with the signed CI run and the server probe run. */
export const RunsCard = (props: RunsCardProps) => (
    <SurfaceCard
        kind="table"
        label={props.labels.runsTitle}
        isLoading={props.isLoading}
        columns={[
            { id: "kind", label: props.labels.colKind },
            { id: "detail", label: props.labels.colDetail, priority: "low" },
            { id: "result", label: props.labels.colResult },
            { id: "at", label: props.labels.colAt, align: "end", priority: "low" },
        ]}
        rows={props.view.runs.map((row) => runRowOf(row, props.locale))}
        empty={props.labels.runsEmpty}
    />
)

/** What the experience card needs: its rows, the words of its head and its empty state. */
export type ExperienceCardProps = {
    readonly rows: ReadonlyArray<ExperienceRowView>
    readonly labels: Pick<ProjectDetailLabels, "expTitle" | "expLink" | "expEmpty" | "experienceHref">
    readonly isLoading: boolean
}

/** The experience this project earned: one list card with a head link to the experience page. */
export const ExperienceCard = (props: ExperienceCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.labels.expTitle}
        labelEnd={
            <Link variant="head" href={props.labels.experienceHref}>
                {props.labels.expLink}
            </Link>
        }
        isLoading={props.isLoading}
        items={props.rows.map((row): ListRowData => ({
            id: row.id,
            title: row.title,
            leading: { icon: ExperienceGlyph },
            meta: { text: String(row.count) },
        }))}
        empty={props.labels.expEmpty}
    />
)

/** What the probes card needs: the probe rows, its label and the line of its empty state. */
export type ProbesCardProps = {
    readonly rows: ReadonlyArray<ProbeLineView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
}

/** The probes of the last server run: a list card shown only when there are results. */
export const ProbesCard = (props: ProbesCardProps) =>
    props.rows.length === 0 ? null : (
        <SurfaceCard
            kind="list"
            label={props.label}
            count={props.rows.length}
            isLoading={props.isLoading}
            items={props.rows.map((probe): ListRowData => ({
                id: probe.id,
                title: probe.text,
                leading: { icon: PracticeGlyph },
                badges: [badgeOf(probe.chip)],
            }))}
            empty={props.emptyLabel}
        />
    )

/** The form that saves the deployed address and asks the server to probe it. */
export const DeployCard = (props: DeployCardProps) => {
    const { labels, busy, fields, view } = props
    return (
        <SurfaceCard kind="body" label={labels.deployTitle} isLoading={props.isLoading}>
            <Stack gap="row">
                <Text tone="muted">{labels.deployText}</Text>
                {fields.issueWords === "" ? null : <Alert tone="negative" title={fields.issueWords} />}
                <Input
                    id="project-deployed"
                    name="deployed"
                    label={labels.deployedLabel}
                    kind="text"
                    value={fields.deployed}
                    isDisabled={busy.isSaving}
                    onValueChange={props.on.deployed}
                />
                <Cluster gap="inline" wrap align="center">
                    <Button intent="neutral" isPending={busy.isSaving} onPress={props.on.saveDeployed}>
                        {labels.saveDeployed}
                    </Button>
                    <Button
                        intent="neutral"
                        isPending={busy.isProbing}
                        isDisabled={view.deployedUrl === "" || busy.isProbing}
                        onPress={props.on.runProbes}
                    >
                        {busy.isProbing ? labels.runningProbes : labels.runProbes}
                    </Button>
                </Cluster>
            </Stack>
        </SurfaceCard>
    )
}
