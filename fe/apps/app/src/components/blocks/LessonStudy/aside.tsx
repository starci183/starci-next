import { Divider, Link, PaneSection, Section, Stack, Text } from "@starci/grammar/common"
import { LockIcon } from "@starci-next/ui"
import type { LessonStudyLabels, OutcomeState, PhaseResultView, SectionCheckView, StudyView } from "@/modules/types"

/** The tone of an outcome's chip. */
const OUTCOME_TONE: Readonly<Record<OutcomeState, "muted" | "neutral" | "success" | "warning">> = {
    none: "muted",
    learning: "neutral",
    understood: "success",
    review: "warning",
}

/** The tone of a phase result's chip. */
const PHASE_TONE: Readonly<Record<PhaseResultView["status"], "muted" | "neutral" | "success" | "warning">> = {
    none: "muted",
    saved: "neutral",
    correct: "success",
    wrong: "warning",
    graded: "neutral",
}

/** The tone of a quick check's chip. */
const CHECK_TONE: Readonly<Record<SectionCheckView["status"], "muted" | "success" | "warning">> = {
    none: "muted",
    correct: "success",
    wrong: "warning",
}

/** What the aside needs: the lesson and the words. */
type LessonAsideProps = {
    readonly study: StudyView
    readonly labels: LessonStudyLabels
    readonly plansHref: string
}

/** The words of a phase result's chip: the words of its status, or the score with "saved" for a graded phase. */
const phaseWordsOf = (result: PhaseResultView, labels: LessonStudyLabels["progress"]): string =>
    result.status === "graded"
        ? `${result.scoreLine} \u00b7 ${labels.saved}`
        : labels.phaseStatus[result.status]

/** The outcomes of the lesson with their state, or for a reader without Premium the line that says why there are none and the link to the plans. */
const OutcomesSection = (props: LessonAsideProps) => {
    const { study, labels } = props
    if (!study.isPremium) {
        return (
            <Section title={labels.progress.outcomes} headingLevel={2}>
                <Stack gap="inline">
                    <Text size="sm" tone="muted" startContent={<LockIcon label={labels.rail.locked} />}>
                        {labels.rail.outcomesLocked}
                    </Text>
                    <Link variant="plain" href={props.plansHref}>
                        {labels.rail.seePremium}
                    </Link>
                </Stack>
            </Section>
        )
    }
    return (
        <Section
            kind="list"
            title={labels.progress.outcomes}
            headingLevel={2}
            empty={labels.rail.empty}
            caption={labels.progress.rule}
            items={study.outcomes.map((outcome) => ({
                id: outcome.id,
                title: outcome.text,
                badges: [{ label: labels.progress.outcomeStates[outcome.state], tone: OUTCOME_TONE[outcome.state] }],
            }))}
        />
    )
}

/**
 * The aside of lesson progress, on the surface and flat: the quick checks of the theory phase or the result of each phase the learner has begun, the learning
 * outcomes with their state, the reviews that open at completion and the references; sections divided by hairlines.
 */
export const LessonAside = (props: LessonAsideProps) => {
    const { study, labels } = props
    const progress = labels.progress
    return (
        <PaneSection gap="section">
            {study.sectionChecks.length === 0 ? null : (
                <>
                    <Section
                        kind="list"
                        title={progress.checksTitle}
                        headingLevel={2}
                        empty={labels.rail.empty}
                        items={study.sectionChecks.map((check) => ({
                            id: check.id,
                            title: progress.checkRow(check.index),
                            badges: [{ label: progress.checkStatus[check.status], tone: CHECK_TONE[check.status] }],
                        }))}
                    />
                    <Divider semantics="presentation" />
                </>
            )}
            {study.phaseResults.length === 0 ? null : (
                <>
                    <Section
                        kind="list"
                        title={progress.title}
                        headingLevel={2}
                        empty={labels.rail.empty}
                        items={study.phaseResults.map((result) => ({
                            id: result.phase,
                            title: labels.phases[result.phase].title,
                            badges: [{ label: phaseWordsOf(result, progress), tone: PHASE_TONE[result.status] }],
                        }))}
                    />
                    <Divider semantics="presentation" />
                </>
            )}
            {study.outcomes.length === 0 ? null : (
                <>
                    <OutcomesSection {...props} />
                    <Divider semantics="presentation" />
                </>
            )}
            <Section
                kind="list"
                title={progress.reviews}
                headingLevel={2}
                empty={progress.reviewsLocked}
                items={study.reviews.map((review) => ({
                    id: `review-${review.days}`,
                    title: progress.reviewAfter(review.days),
                    meta: { text: progress.dateOf(review.dueAt) },
                }))}
            />
            {study.overview.references.length === 0 ? null : (
                <>
                    <Divider semantics="presentation" />
                    <Section title={labels.rail.references} headingLevel={2}>
                        <Stack gap="inline">
                            {study.overview.references.map((reference) =>
                                reference.href === "" ? (
                                    <Text key={reference.id}>{reference.label}</Text>
                                ) : (
                                    <Link variant="plain" key={reference.id} href={reference.href} kind="external">
                                        {reference.label}
                                    </Link>
                                ),
                            )}
                        </Stack>
                    </Section>
                </>
            )}
        </PaneSection>
    )
}
