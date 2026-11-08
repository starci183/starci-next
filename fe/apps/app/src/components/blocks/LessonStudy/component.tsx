import { Button, Grid, Page, Stack, SurfaceCard, Tabs, Text } from "@starci/grammar/common"
import {
    ArtBeside,
    ArtImage,
    ChoiceCard,
    FilesCard,
    LockedNotice,
    MarkdownBody,
    OverviewPanel,
    PHASE_ART,
    ReflectCompare,
    SimulationCard,
    SlotView,
    StudyRail,
    WrittenCard,
} from "@starci-next/ui"
import {
    LESSON_PHASES,
    pageHeaderOf,
    type DataSlot,
    type LessonStudyActions,
    type LessonStudyLabels,
    type SlotLabels,
    type StudyCardView,
    type StudyView,
} from "@/modules/types"

/** Props for {@link LessonStudyBase}. */
export type LessonStudyBaseProps = {
    readonly props: {
        readonly slot: DataSlot<StudyView>
        readonly placeholder: StudyView
        readonly slotLabels: SlotLabels
        readonly labels: LessonStudyLabels
        /** The destination of the plans page. */
        readonly plansHref: string
        /** The destination of the catalog. */
        readonly catalogHref: string
    }
    readonly on: LessonStudyActions
}

/** What every card of the body needs besides its own data. */
type CardEnv = {
    readonly labels: LessonStudyLabels
    readonly plansHref: string
    readonly on: LessonStudyActions
    readonly isLoading: boolean
}

/** A simulation card with the environment it is drawn in. */
type SimulationBlockProps = {
    readonly card: Extract<StudyCardView, { kind: "simulation" }>
    readonly env: CardEnv
}

/** A simulation and, once it reaches a goal, its debrief question as a written answer. */
const SimulationBlock = (props: SimulationBlockProps) => {
    const { card, env } = props
    return (
        <>
            <SimulationCard
                prompt={card.prompt}
                steps={card.steps}
                currentLabel={card.currentLabel}
                observation={card.observation}
                isSuccess={card.isSuccess}
                moves={card.moves}
                labels={env.labels.simulation}
                onMove={(actionId, toStateId) => env.on.move(card.id, card.initialStateId, actionId, toStateId)}
                onRestart={() => env.on.restart(card.id)}
            />
            {card.isSuccess ? (
                <WrittenCard
                    prompt={card.debrief}
                    isDiagnostic={false}
                    criteria={[]}
                    instructions=""
                    draft={card.draft}
                    labels={env.labels.written}
                    plansHref={env.plansHref}
                    onChange={(text) => env.on.write(card.id, text)}
                    onSubmit={() => env.on.submitDebrief(card.id, card.draft.value)}
                />
            ) : null}
        </>
    )
}

/** One card of the body with the environment it is drawn in. */
type StudyCardProps = { readonly card: StudyCardView; readonly env: CardEnv }

/** One card of the phase body, drawn by its kind. */
const StudyCard = (props: StudyCardProps) => {
    const { card, env } = props
    switch (card.kind) {
        case "reading":
            return (
                <SurfaceCard label={card.title}>
                    <MarkdownBody
                        blocks={card.blocks}
                        diagramLabel={env.labels.diagram}
                        diagramErrorTitle={env.labels.diagramError}
                        isLoading={env.isLoading}
                    />
                </SurfaceCard>
            )
        case "choice":
            return (
                <ChoiceCard
                    prompt={card.prompt}
                    options={card.options}
                    pickedId={card.pickedId}
                    status={card.status}
                    isCorrect={card.isCorrect}
                    explanations={card.explanations}
                    labels={env.labels.choice}
                    plansHref={env.plansHref}
                    onPick={(optionId) => env.on.pick(card.id, optionId)}
                    onSubmit={() => env.on.submitChoice(card.id, card.pickedId)}
                />
            )
        case "written":
            return (
                <WrittenCard
                    prompt={card.prompt}
                    isDiagnostic={card.isDiagnostic}
                    criteria={card.criteria}
                    instructions={card.instructions}
                    draft={card.draft}
                    labels={env.labels.written}
                    plansHref={env.plansHref}
                    onChange={(text) => env.on.write(card.id, text)}
                    onSubmit={() => env.on.submitWritten(card.id, card.draft.value)}
                />
            )
        case "simulation":
            return <SimulationBlock card={card} env={env} />
        case "files":
            return <FilesCard label={env.labels.phases.apply.title} files={card.files} />
    }
}

/** The study body of one lesson with the environment it is drawn in. */
type StudyBodyProps = { readonly study: StudyView; readonly env: CardEnv }

/** The phases the overview lists as the lesson's own: the six a learner works through, never the overview itself or the review that follows the lesson. */
const LISTED_PHASES = LESSON_PHASES.filter((phase) => phase !== "overview" && phase !== "review")

/** The overview: what the lesson is, outcomes, prerequisites, the phases, the scope text and the sources when the lesson has them, then the way to begin. */
const OverviewBody = (props: StudyBodyProps) => {
    const { study, env } = props
    return (
        <OverviewPanel
            summary={study.description}
            outcomes={study.overview.outcomes}
            prerequisites={study.overview.prerequisites}
            phases={LISTED_PHASES.map((phase) => ({
                id: phase,
                title: env.labels.phases[phase].title,
                description: env.labels.phases[phase].lead,
            }))}
            references={study.overview.references}
            scope={
                study.overview.scope.length === 0 ? undefined : (
                    <MarkdownBody
                        blocks={study.overview.scope}
                        diagramLabel={env.labels.diagram}
                        diagramErrorTitle={env.labels.diagramError}
                        isLoading={env.isLoading}
                    />
                )
            }
            startHref={study.rail.find((row) => row.phase === "challenge")?.href ?? "/"}
            labels={env.labels.overview}
        />
    )
}

/** What the phase picture needs. */
type PhaseArtProps = { readonly phase: string }

/** The picture of a phase, or nothing for a phase that has none. */
const PhaseArt = (props: PhaseArtProps) => {
    const asset = PHASE_ART[props.phase]
    return asset === undefined ? null : <ArtImage asset={asset} />
}

/** The phase on screen: its opening line, its sections as tabs when it has several, then its cards. */
const PhaseBody = (props: StudyBodyProps) => {
    const { study, env } = props
    return (
        <Stack gap="section">
            <ArtBeside art={<PhaseArt phase={study.phase} />}>
                <Text as="p" tone="muted">
                    {env.labels.phases[study.phase].lead}
                </Text>
            </ArtBeside>
            {study.tabs.length === 0 ? null : (
                <Tabs
                    label={env.labels.tabs}
                    items={study.tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
                    selectedKey={study.openTabId}
                    onSelect={(key) => env.on.openTab(study.phase, key)}
                />
            )}
            {study.cards.map((card) => (
                <StudyCard key={card.id} card={card} env={env} />
            ))}
            {study.phase === "reflect" ? <ReflectCompare rows={study.compare} labels={env.labels.compare} /> : null}
        </Stack>
    )
}

/** The primary column: the locked notice, the overview, the review (not served yet) or the phase's cards. */
const StudyBody = (props: StudyBodyProps) => {
    const { study, env } = props
    if (study.isLocked) {
        return (
            <LockedNotice
                title={env.labels.lockedTitle}
                description={env.labels.lockedDescription}
                plansLabel={env.labels.plans}
                plansHref={env.plansHref}
            />
        )
    }
    if (study.phase === "overview") return <OverviewBody study={study} env={env} />
    if (study.phase === "review") {
        return (
            <SurfaceCard label={env.labels.phases.review.title}>
                <ArtBeside art={<PhaseArt phase="review" />}>
                    <Text as="p" tone="muted">
                        {env.labels.review}
                    </Text>
                </ArtBeside>
            </SurfaceCard>
        )
    }
    return <PhaseBody study={study} env={env} />
}

/** The rail of a lesson: its summary and its phases, worded. */
const LessonRail = (props: StudyBodyProps) => (
    <StudyRail
        eyebrow={`${props.study.category} · ${props.study.difficultyLabel}`}
        title={props.study.title}
        facts={props.study.facts}
        outcomes={props.study.outcomes}
        isOutcomesLocked={!props.study.isPremium}
        phases={props.study.rail.map((row) => ({
            id: row.phase,
            title: props.env.labels.phases[row.phase].title,
            description: props.env.labels.phases[row.phase].sub,
            href: row.href,
            isCurrent: row.isCurrent,
            isLocked: row.isLocked,
        }))}
        labels={props.env.labels.rail}
    />
)

/**
 * Draws a lesson the way the canvas template does: the trail from the catalog in the page header, the lesson card over its phase rail on the left, the phase on screen in the middle.
 * One screen draws every lesson; the phase is the address's `?phase=`. A phase that needs Premium draws the locked notice
 * with the link to the plans in place of its cards.
 */
export const LessonStudyBase = (props: LessonStudyBaseProps) => {
    const { labels, plansHref, catalogHref, slot, placeholder } = props.props
    const isLoading = "isLoading" in slot
    return (
        <Page isLoading={isLoading} {...pageHeaderOf(slot, placeholder, labels, catalogHref)}>
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                forbiddenAction={
                    <Button intent="commit" href={plansHref}>
                        {labels.plans}
                    </Button>
                }
                onRetry={props.on.retry}
                render={(study, isLoading) => {
                    const env = { labels, plansHref, on: props.on, isLoading }
                    return (
                        <Grid
                            kind="main-rail"
                            railPosition="leading"
                            rail={<LessonRail study={study} env={env} />}
                            primary={<StudyBody study={study} env={env} />}
                        />
                    )
                }}
            />
        </Page>
    )
}
