import { Badge, Button, Grid, Page, Stack, type PageHeaderContent } from "@starci/grammar/common"
import {
    ConnectPanel,
    DeployCard,
    ExperienceCard,
    MilestonesCard,
    MissingNotice,
    ProbesCard,
    ProjectAside,
    ProjectStatus,
    RunsCard,
    SlotView,
} from "@starci-next/ui"
import type {
    DataSlot,
    ProjectDetailBusy,
    ProjectDetailFields,
    ProjectDetailLabels,
    ProjectDetailView,
    SlotLabels,
} from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The fake project with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_DETAIL_PLACEHOLDER: ProjectDetailView = {
    title: blank(10),
    meta: `${blank(8)} · ${blank(8)}`,
    state: { label: blank(6), tone: "muted" },
    repo: "",
    repoLabel: "",
    milestones: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: blank(10),
        meta: blank(8),
        percent: 0,
        chip: { label: blank(6), tone: "muted" as const },
        href: "",
    })),
    runs: [1, 2].map((index) => ({
        id: `placeholder-${index}`,
        kind: blank(8),
        detail: blank(12),
        verdict: { label: blank(6), tone: "muted" as const },
        at: "",
    })),
    experience: [1, 2, 3].map((index) => ({ id: `placeholder-${index}`, title: blank(10), count: 0 })),
    probes: [],
    ci: { label: blank(6), tone: "muted" },
    ciLine: blank(12),
    deployedUrl: "",
}

/** The commands of the page. */
export type ProjectDetailCommands = {
    readonly retry: () => void
    readonly deployed: (value: string) => void
    readonly saveDeployed: () => void
    readonly runProbes: () => void
    readonly sync: () => void
    readonly rotate: () => void
}

/** Props for {@link ProjectDetailBase}. */
export type ProjectDetailBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectDetailView>
        readonly placeholder: ProjectDetailView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectDetailLabels
        readonly fields: ProjectDetailFields
        readonly busy: ProjectDetailBusy
        /** True when the back end said the learner has no such project. */
        readonly isNotFound: boolean
        /** The public base of the statics, for the milestone picture. */
        readonly staticsBaseUrl: string
    }
    readonly on: ProjectDetailCommands
}

/** What the cards of the well need: the project, the words, the fields, the busy flags and the commands. */
type WellCardsProps = {
    readonly view: ProjectDetailView
    readonly isLoading: boolean
    readonly props: ProjectDetailBaseProps["props"]
    readonly on: ProjectDetailCommands
}

/** The cards of the well, drawn once for the settled project or its placeholder. */
const WellCards = (props: WellCardsProps) => {
    const card = { view: props.view, labels: props.props.labels, isLoading: props.isLoading }
    return (
        <>
            <ProbesCard
                rows={props.view.probes}
                label={card.labels.probesTitle}
                emptyLabel={card.labels.runsEmpty}
                isLoading={props.isLoading}
            />
            <RunsCard {...card} locale={props.props.fields.locale} />
            <ExperienceCard rows={props.view.experience} labels={card.labels} isLoading={props.isLoading} />
            <DeployCard {...card} fields={props.props.fields} busy={props.props.busy} on={props.on} />
        </>
    )
}

/** The top of the page: the milestone track, the four status tiles and, until a signed run exists, the connect flow. */
const Top = (props: WellCardsProps) => {
    const card = { view: props.view, labels: props.props.labels, isLoading: props.isLoading }
    return (
        <Stack gap="region">
            <MilestonesCard
                rows={props.view.milestones}
                label={card.labels.milestones}
                emptyLabel={card.labels.emptyMilestones}
                isLoading={props.isLoading}
                staticsBaseUrl={props.props.staticsBaseUrl}
            />
            <ProjectStatus {...card} fields={props.props.fields} busy={props.props.busy} on={props.on} />
            {props.view.ci.tone === "muted" ? <ConnectPanel {...card} /> : null}
        </Stack>
    )
}

/** The band of the page: the trail, and for a settled project its state chip, repo line and the one command. */
const headerOf = (props: ProjectDetailBaseProps, view: ProjectDetailView | undefined): PageHeaderContent => {
    const { labels, busy } = props.props
    const trail = [{ id: "projects", label: labels.pageTitle, href: labels.pageHref }]
    if (view === undefined) {
        return { title: labels.pageTitle, breadcrumbs: { label: labels.breadcrumbs, items: trail } }
    }
    return {
        title: view.title,
        breadcrumbs: { label: labels.breadcrumbs, items: [...trail, { id: "project", label: view.title }] },
        meta: view.meta,
        status: (
            <Badge isDot tone={view.state.tone}>
                {view.state.label}
            </Badge>
        ),
        actions: (
            <Button intent="neutral" isPending={busy.isSyncing} onPress={props.on.sync}>
                {busy.isSyncing ? labels.syncing : labels.sync}
            </Button>
        ),
    }
}

/** Draws one project: the band with the trail, state and commands, then the well of cards beside the aside pane. */
export const ProjectDetailBase = (props: ProjectDetailBaseProps) => {
    const { labels, slot } = props.props
    if (props.props.isNotFound) {
        return (
            <Page>
                <MissingNotice
                    message={labels.notFound}
                    description={labels.notFoundText}
                    backLabel={labels.back}
                    backHref={labels.pageHref}
                />
            </Page>
        )
    }
    return (
        <SlotView<ProjectDetailView, PageHeaderContent>
            slot={slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            header={(settled) => headerOf(props, settled)}
            headerFallback={headerOf(props, undefined)}
            frame={({ header, isLoading, body }) => (
                <Page isLoading={isLoading} header={header}>
                    {body}
                </Page>
            )}
            render={(settled, loading) =>
                loading ? (
                    <Grid
                        kind="main-rail"
                        primary={
                            <Stack gap="region">
                                <SkeletonBlock lines={4} />
                                <SkeletonBlock lines={6} />
                                <SkeletonBlock lines={4} />
                            </Stack>
                        }
                        rail={
                            <Stack gap="region">
                                <SkeletonBlock lines={4} />
                                <SkeletonBlock lines={3} />
                            </Stack>
                        }
                    />
                ) : (
                    <Stack gap="region">
                        <Top view={settled} isLoading={loading} props={props.props} on={props.on} />
                        <Grid
                            kind="main-rail"
                            primary={
                                <Stack gap="region">
                                    <WellCards view={settled} isLoading={loading} props={props.props} on={props.on} />
                                </Stack>
                            }
                            rail={<ProjectAside view={settled} labels={labels} isLoading={loading} />}
                        />
                    </Stack>
                )
            }
        />
    )
}
