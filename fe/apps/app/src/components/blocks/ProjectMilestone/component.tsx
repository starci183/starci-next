import { Alert, Badge, Cluster, Link, Page, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { CatalogIntro, MissingNotice, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { ConceptEvidence, ExplainForm, PointerForm } from "./concept"
import type { ConceptCardView, ConceptDraftView, ProjectMilestoneLabels, ProjectMilestoneView } from "./types"

/** The fake milestone with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECT_MILESTONE_PLACEHOLDER: ProjectMilestoneView = {
    title: "xxxxxxxxxx",
    projectName: "xxxxxx",
    intro: "xxxxxxxxxxxxxxxxxxxx",
    concepts: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        label: "xxxxxxxxxx",
        stateLabel: "xxxxxx",
        stateTone: "muted" as const,
        kindLabel: "xxxxxx",
        where: "xxxxxxxx",
        comingSoon: false,
        chips: [],
        rejection: undefined,
        aiQuestion: "",
        relearnLabel: "",
        relearnHref: "",
        needsCodeRead: false,
    })),
}

/** The draft of a concept the learner has not typed in yet. */
const EMPTY_DRAFT: ConceptDraftView = { location: "", endpoint: "", sampleBody: "", excerpt: "", explanation: "" }

/** Props for {@link ProjectMilestoneBase}. */
export type ProjectMilestoneBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectMilestoneView>
        readonly placeholder: ProjectMilestoneView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectMilestoneLabels
        /** True when the back end said the project or the milestone is not there. */
        readonly isNotFound: boolean
        /** True when the milestone needs Premium and the learner has none. */
        readonly isLocked: boolean
        /** What the learner typed, by concept id; a concept missing here has an empty draft. */
        readonly drafts: Readonly<Record<string, ConceptDraftView>>
        /** The concept whose command is running, or undefined. */
        readonly pendingId: string | undefined
        /** The concept the last refusal belongs to, or undefined. */
        readonly issueId: string | undefined
        readonly issueWords: string
    }
    readonly on: {
        readonly retry: () => void
        readonly write: (conceptId: string, key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: (conceptId: string) => void
        readonly explain: (conceptId: string) => void
    }
}

/** What one concept card needs: the concept and the page props that feed its forms. */
type ConceptCardProps = { readonly concept: ConceptCardView } & ProjectMilestoneBaseProps

/** One concept: its label and state, where it lives in the code, the evidence chips, what failed and the forms. */
const ConceptCard = (props: ConceptCardProps) => {
    const { concept, props: page } = props
    const form = {
        concept,
        labels: page.labels,
        draft: page.drafts[concept.id] ?? EMPTY_DRAFT,
        isBusy: page.pendingId === concept.id,
        on: props.on,
    }
    return (
        <SurfaceCard label={concept.label}>
            <Stack gap="row">
                <Cluster gap="inline" wrap align="center">
                    <Badge tone={concept.stateTone}>{concept.stateLabel}</Badge>
                    <Badge tone="neutral">{concept.kindLabel}</Badge>
                    <Text size="sm" tone="muted" mono>
                        {concept.where}
                    </Text>
                </Cluster>
                {concept.comingSoon ? (
                    <Text tone="muted">{page.labels.comingSoon}</Text>
                ) : (
                    <>
                        <ConceptEvidence concept={concept} questionLabel={page.labels.questionLabel} />
                        <PointerForm {...form} />
                        {concept.needsCodeRead ? <ExplainForm {...form} /> : null}
                        {page.issueId === concept.id && page.issueWords !== "" ? (
                            <Alert tone="negative" title={page.issueWords} />
                        ) : null}
                    </>
                )}
            </Stack>
        </SurfaceCard>
    )
}

/** Draws one milestone of a project: the intro and the concept checklist with its evidence, failures and forms. */
export const ProjectMilestoneBase = (props: ProjectMilestoneBaseProps) => (
    <Page>
        {props.props.isNotFound || props.props.isLocked ? (
            <MissingNotice
                message={props.props.isLocked ? props.props.labels.lockedTitle : props.props.labels.notFound}
                description={props.props.isLocked ? props.props.labels.lockedText : props.props.labels.notFoundText}
                backLabel={props.props.labels.back}
                backHref={props.props.labels.backHref}
                action={
                    props.props.isLocked ? (
                        <Link href={props.props.labels.plansHref}>{props.props.labels.plans}</Link>
                    ) : null
                }
            />
        ) : (
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view) => (
                    <Stack gap="region">
                        <Link href={props.props.labels.backHref}>{props.props.labels.back}</Link>
                        <CatalogIntro
                            eyebrow={`${props.props.labels.eyebrow} · ${view.projectName}`}
                            title={view.title}
                            description={view.intro}
                            facts={[]}
                            upsell={undefined}
                        />
                        <Stack gap="row">
                            <Text isStrong>{props.props.labels.conceptsLabel}</Text>
                            {view.concepts.map((concept) => (
                                <ConceptCard key={concept.id} concept={concept} {...props} />
                            ))}
                        </Stack>
                    </Stack>
                )}
            />
        )}
    </Page>
)
