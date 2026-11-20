import { useState, type ReactNode } from "react"
import {
    Badge,
    Button,
    Icon as GlyphIcon,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { LessonAside, LessonStepper, PlayGlyph, SlotView, StudyBody, WalkProvider } from "@starci-next/ui"
import {
    FREE_PHASES,
    type BandProps,
    type LessonStudyScreen,
    type StudyBodyProps,
    type StudyView,
} from "@/modules/types"

/** The trail of a lesson: the catalog, the topic, the lesson and, on a phase page, the phase. */
const trailOf = (props: BandProps) => {
    const { study, env, catalogHref } = props
    const isOverview = study.phase === "overview"
    return [
        { id: "essentials", label: env.labels.pageTitle, href: catalogHref },
        { id: "topic", label: study.topic.title, href: study.topic.href },
        isOverview
            ? { id: "lesson", label: study.title }
            : {
                  id: "lesson",
                  label: study.title,
                  href: study.rail.find((row) => row.phase === "overview")?.href ?? study.topic.href,
              },
        ...(isOverview ? [] : [{ id: "phase", label: env.labels.phases[study.phase].title }]),
    ]
}

/** The meta line of a phase page: "Pha 2/6", the part of a theory phase and "free" for the phases that need no Premium. */
const metaOf = (props: StudyBodyProps): string => {
    const { study, env } = props
    const position = study.stepper.findIndex((step) => step.state === "current") + 1
    return [
        env.labels.nav.phaseOf(position, study.stepper.length),
        study.sectionCount === 0 ? "" : env.labels.nav.sectionOf(study.sectionIndex, study.sectionCount),
        FREE_PHASES.includes(study.phase) ? env.labels.nav.free : "",
    ]
        .filter((each) => each !== "")
        .join(" · ")
}

/** The title of a phase page: the phase and the question it asks. */
const titleOf = (props: StudyBodyProps): string => {
    const name = props.env.labels.phases[props.study.phase].title
    return props.study.headline === "" ? name : `${name}: ${props.study.headline}`
}

/**
 * The band of a lesson. The overview: the trail, the title, the chip of its level beside its facts and the way to begin. A phase page: the 3D art of
 * the step at the start, the trail, "Phase: question", its meta and the stepper of the six steps (done, current, later).
 */
const bandOf = (props: BandProps): PageHeaderContent => {
    const { study, env } = props
    const breadcrumbs = { label: env.labels.breadcrumbs, items: trailOf(props) }
    if (study.phase === "overview") {
        const start = study.rail.find((row) => row.phase === "challenge")
        return {
            breadcrumbs,
            title: study.title,
            titleScale: "standard",
            status: <Badge>{study.difficultyLabel}</Badge>,
            meta: study.facts,
            actions: (
                <Button intent="commit" startContent={<GlyphIcon source={PlayGlyph} />} href={start?.href ?? "/"}>
                    {env.labels.overview.start}
                </Button>
            ),
        }
    }
    return {
        breadcrumbs,
        title: titleOf(props),
        titleScale: "standard",
        meta: metaOf(props),
        description: <LessonStepper study={study} env={env} />,
    }
}

/** Props for {@link LessonStudyBase}: the resolved props and the actions of the screen. */
export type LessonStudyBaseProps = { readonly props: LessonStudyScreen["props"]; readonly on: LessonStudyScreen["on"] }

/**
 * Draws a lesson as a panes page: the band (trail from the catalog, title, level and facts, the way to begin or, on a phase page, the phases as page tabs),
 * the well of cards in the main pane and the aside pane on the surface. One screen draws every lesson; the phase is the address's `?phase=`.
 * A phase that needs Premium draws the locked notice with the link to the plans in place of its cards. Below the wide breakpoint the aside is a drawer.
 * The slot owns every status: the band, the aside, the well and the page's loading flag all come from `SlotView`.
 */
export const LessonStudyBase = (props: LessonStudyBaseProps) => {
    const { labels, plansHref, catalogHref, reviewHref, projectsHref, slot, placeholder } = props.props
    const [isAsideOpen, setIsAsideOpen] = useState(false)
    const envOf = (isLoading: boolean) => ({ labels, plansHref, reviewHref, projectsHref, on: props.on, isLoading })
    const asideLabel = labels.progress.title
    return (
        <SlotView<StudyView, PageHeaderContent, ReactNode>
            slot={slot}
            placeholder={placeholder}
            labels={props.props.slotLabels}
            forbiddenAction={
                <Button intent="commit" href={plansHref}>
                    {labels.plans}
                </Button>
            }
            onRetry={props.on.retry}
            header={(study, isLoading) => bandOf({ study, env: envOf(isLoading), catalogHref })}
            headerFallback={{ title: labels.pageTitle, breadcrumbs: "root" }}
            aside={(study) => <LessonAside study={study} labels={labels} plansHref={plansHref} />}
            frame={({ header, aside, body, isLoading }) => (
                <WalkProvider
                    onWalk={props.on.walk}
                    content={
                        <Page chrome="panes" isLoading={isLoading} header={header}>
                            <PaneGrid
                                label={labels.pageTitle}
                                areas={{ base: ["main"], wide: ["main aside"] }}
                                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                            >
                                <Pane area="main" scroll label={labels.pageTitle}>
                                    <PaneSection gap="section" isLoading={isLoading}>
                                        {body}
                                    </PaneSection>
                                </Pane>
                                {aside === undefined ? null : (
                                    <Pane
                                        area="aside"
                                        surface
                                        scroll
                                        label={asideLabel}
                                        collapse="drawer"
                                        collapseLabel={asideLabel}
                                        openLabel={asideLabel}
                                        closeLabel={labels.rail.close}
                                        isOpen={isAsideOpen}
                                        onOpenChange={setIsAsideOpen}
                                    >
                                        {aside}
                                    </Pane>
                                )}
                            </PaneGrid>
                        </Page>
                    }
                />
            )}
            render={(each, isLoading) => <StudyBody study={each} env={envOf(isLoading)} />}
        />
    )
}
