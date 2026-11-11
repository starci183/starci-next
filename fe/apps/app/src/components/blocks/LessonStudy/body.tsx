import { Markdown, SurfaceCard, Stack } from "@starci/grammar/common"
import { LockedNotice, OverviewPanel } from "@starci-next/ui"
import { LESSON_PHASES } from "@/modules/types"
import { StudyCard, type SectionTabs } from "./cards"
import { renderLessonCode } from "./code"
import { PhaseNav } from "./nav"
import { CompareCard, CompletionCard } from "./results"
import type { StudyBodyProps } from "./band"

/** The phases the overview lists as the lesson's own: the six a learner works through, never the overview itself or the review that follows the lesson. */
const LISTED_PHASES = LESSON_PHASES.filter((phase) => phase !== "overview" && phase !== "review")

/** The line that says the lesson is complete, with when; undefined before the completion. */
const completionOf = (study: StudyBodyProps["study"], env: StudyBodyProps["env"]): string | undefined => {
    if (study.completedAt === "") return undefined
    return `${env.labels.completion.done(study.title)} · ${study.completedTime}`
}

/** The overview: what the lesson is, the one list of its phases, outcomes and prerequisites. The way to begin is the band's primary action. */
const OverviewBody = (props: StudyBodyProps) => {
    const { study, env } = props
    return (
        <OverviewPanel
            summary={study.description}
            outcomes={study.overview.outcomes}
            prerequisites={study.overview.prerequisites}
            completion={completionOf(study, env)}
            phases={LISTED_PHASES.map((phase) => {
                const row = study.rail.find((each) => each.phase === phase)
                return {
                    id: phase,
                    title: env.labels.phases[phase].title,
                    description: env.labels.phases[phase].sub,
                    href: row?.href ?? "",
                    isLocked: row?.isLocked ?? false,
                    isDone: study.stepper.find((step) => step.phase === phase)?.state === "done",
                }
            })}
            scope={study.overview.scope === "" ? undefined : <Markdown source={study.overview.scope} labels={env.labels.markdown} renderCode={renderLessonCode} />}
            labels={env.labels.overview}
        />
    )
}

/** The section tabs of a theory phase; a section whose quick check is answered carries a check. */
const sectionTabsOf = (props: StudyBodyProps): SectionTabs | undefined => {
    const { study, env } = props
    if (study.tabs.length === 0) return undefined
    return {
        label: env.labels.tabs,
        items: study.tabs.map((tab) => ({
            id: tab.id,
            label: study.sectionChecks.find((check) => check.id === tab.id)?.status === "none" ? tab.label : `✓ ${tab.label}`,
        })),
        selectedKey: study.openTabId,
        onSelect: (key) => env.on.openTab(study.phase, key),
    }
}

/** The phase on screen: its cards, one per job, the comparison and the completion that close the last phase, and the previous and next controls. The opening line stands in the band. */
const PhaseBody = (props: StudyBodyProps) => {
    const { study, env } = props
    const tabs = sectionTabsOf(props)
    return (
        <Stack gap="section">
            {study.cards.map((card) => (
                <StudyCard key={card.id} card={card} env={env} {...(card.kind === "reading" && tabs !== undefined ? { sectionTabs: tabs } : {})} />
            ))}
            {study.phase === "reflect" ? (
                <>
                    <CompareCard rows={study.compare} score={study.compareScore} labels={env.labels.lessonCompare} />
                    <CompletionCard
                        lessonTitle={study.title}
                        completedAt={study.completedAt}
                        time={study.completedTime}
                        labels={env.labels.completion}
                        reviewHref={env.reviewHref}
                        projectsHref={env.projectsHref}
                    />
                </>
            ) : null}
            <PhaseNav
                previous={study.previous}
                next={study.next}
                labels={env.labels.nav}
                phase={study.phase}
                phaseTitle={(phase) => env.labels.phases[phase].title}
                onOpenSection={env.on.openTab}
            />
        </Stack>
    )
}

/** The primary column: the locked notice, the overview, the review (not served yet) or the phase's cards. */
export const StudyBody = (props: StudyBodyProps) => {
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
        return <SurfaceCard kind="list" label={env.labels.phases.review.title} empty={env.labels.review} items={[]} />
    }
    return <PhaseBody study={study} env={env} />
}

