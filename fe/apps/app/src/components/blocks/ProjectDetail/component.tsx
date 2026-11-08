import { Alert, Link, Page, Stack, Text } from "@starci/grammar/common"
import { CatalogIntro, MissingNotice, PracticeList, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { LayoutCard, PracticeCard, ProofCards, SecretCard } from "./cards"
import type { ProjectDetailBusy, ProjectDetailFields, ProjectDetailLabels, ProjectDetailView } from "./types"

/** The fake project with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_DETAIL_PLACEHOLDER: ProjectDetailView = {
    eyebrow: "xxxxxx",
    title: "xxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxx",
    facts: ["xxxxxx", "xxxxxxxx"],
    repo: "",
    milestones: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted" as const,
        href: "",
        cta: "xxxxxx",
        isCurrent: false,
    })),
    progress: "xxxxxxxxxx",
    practising: "",
    ciLine: "xxxxxxxxxxxx",
    ciPassed: undefined,
    deployedUrl: "",
    probeLine: "xxxxxxxxxxxx",
    probePassed: undefined,
    probes: [],
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
    readonly on: {
        readonly retry: () => void
        readonly deployed: (value: string) => void
        readonly saveDeployed: () => void
        readonly runProbes: () => void
        readonly sync: () => void
        readonly rotate: () => void
    }
}

/** Draws one project: the intro, the milestones, practice and proof, the CI secret and the starci/ layout. */
export const ProjectDetailBase = (props: ProjectDetailBaseProps) => {
    const { labels, fields, busy } = props.props
    return (
        <Page>
            {props.props.isNotFound ? (
                <MissingNotice
                    message={labels.notFound}
                    description={labels.notFoundText}
                    backLabel={labels.back}
                    backHref={labels.backHref}
                />
            ) : (
                <SlotView
                    slot={props.props.slot}
                    placeholder={props.props.placeholder}
                    labels={props.props.slotLabels}
                    onRetry={props.on.retry}
                    render={(view, isLoading) => (
                        <Stack gap="region">
                            <Link href={labels.backHref}>{labels.back}</Link>
                            <CatalogIntro
                                eyebrow={view.eyebrow}
                                title={view.title}
                                description={view.description}
                                facts={[...view.facts, view.progress]}
                                upsell={undefined}
                            />
                            {view.repo === "" ? null : (
                                <Text size="sm" tone="muted">
                                    {labels.repo}: {view.repo}
                                </Text>
                            )}
                            {fields.issueWords === "" ? null : <Alert tone="negative" title={fields.issueWords} />}
                            <Stack gap="row">
                                <Text isStrong>{labels.milestones}</Text>
                                <Text tone="muted">{labels.milestoneIntro}</Text>
                                <PracticeList
                                    label={labels.milestones}
                                    emptyLabel={labels.milestones}
                                    rows={view.milestones}
                                    isLoading={isLoading}
                                />
                            </Stack>
                            <PracticeCard
                                labels={labels}
                                practising={view.practising}
                                isSyncing={busy.isSyncing}
                                onSync={props.on.sync}
                            />
                            <ProofCards
                                labels={labels}
                                view={view}
                                deployed={fields.deployed}
                                busy={busy}
                                on={props.on}
                            />
                            <SecretCard
                                labels={labels}
                                secret={fields.secret}
                                isRotating={busy.isRotating}
                                onRotate={props.on.rotate}
                            />
                            <LayoutCard labels={labels} />
                        </Stack>
                    )}
                />
            )}
        </Page>
    )
}
