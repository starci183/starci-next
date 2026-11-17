import { Badge, Button, Page, Pane, PaneGrid, PaneSection } from "@starci/grammar/common"
import {
    DeployCard,
    ExperienceCard,
    MilestonesCard,
    MissingNotice,
    ProbesCard,
    ProjectAside,
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

/** The fake project with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_DETAIL_PLACEHOLDER: ProjectDetailView = {
    title: "xxxxxxxxxx",
    meta: "xxxxxxxx · xxxxxxxx",
    state: { label: "xxxxxx", tone: "muted" },
    repo: "",
    repoLabel: "",
    milestones: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        meta: "xxxxxxxx",
        percent: 0,
        chip: { label: "xxxxxx", tone: "muted" as const },
        href: "",
    })),
    runs: [1, 2].map((index) => ({
        id: `placeholder-${index}`,
        kind: "xxxxxxxx",
        detail: "xxxxxxxxxxxx",
        verdict: { label: "xxxxxx", tone: "muted" as const },
        at: "",
    })),
    experience: [1, 2, 3].map((index) => ({ id: `placeholder-${index}`, title: "xxxxxxxxxx", count: 0 })),
    probes: [],
    ci: { label: "xxxxxx", tone: "muted" },
    ciLine: "xxxxxxxxxxxx",
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
            <MilestonesCard
                rows={props.view.milestones}
                label={card.labels.milestones}
                emptyLabel={card.labels.emptyMilestones}
                isLoading={props.isLoading}
            />
            <RunsCard {...card} locale={props.props.fields.locale} />
            <ProbesCard
                rows={props.view.probes}
                label={card.labels.probesTitle}
                emptyLabel={card.labels.runsEmpty}
                isLoading={props.isLoading}
            />
            <ExperienceCard rows={props.view.experience} labels={card.labels} isLoading={props.isLoading} />
            <DeployCard {...card} fields={props.props.fields} busy={props.props.busy} on={props.on} />
        </>
    )
}

/** The band of the page: the trail, and for a settled project its state chip, repo line and the one command. */
const headerOf = (props: ProjectDetailBaseProps, view: ProjectDetailView | undefined) => {
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
    const view = "items" in slot ? slot.items : undefined
    return (
        <Page chrome="panes" layout="workspace" isLoading={"isLoading" in slot} header={headerOf(props, view)}>
            <PaneGrid
                label={labels.pageTitle}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={labels.milestones}>
                    <PaneSection gap="section">
                        <SlotView
                            slot={slot}
                            placeholder={props.props.placeholder}
                            labels={props.props.slotLabels}
                            onRetry={props.on.retry}
                            render={(settled, loading) => (
                                <WellCards view={settled} isLoading={loading} props={props.props} on={props.on} />
                            )}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface label={labels.asideRepo}>
                    <PaneSection>
                        {view === undefined ? null : (
                            <ProjectAside
                                view={view}
                                labels={labels}
                                isLoading={false}
                                fields={props.props.fields}
                                busy={props.props.busy}
                                on={props.on}
                            />
                        )}
                    </PaneSection>
                </Pane>
            </PaneGrid>
        </Page>
    )
}
