import { Badge, Button, Icon as GlyphIcon, Mascot, Stepper, type PageHeaderContent, type StepperStepState } from "@starci/grammar/common"
import { PlayGlyph } from "@starci-next/ui"
import { FREE_PHASES, type StepView, type StudyView } from "@/modules/types"
import type { CardEnv } from "./cards"

/** The study body of one lesson with the environment it is drawn in. */
export type StudyBodyProps = { readonly study: StudyView; readonly env: CardEnv }

/** What the band needs: the lesson, the words and the destination of the catalog. */
export type BandProps = StudyBodyProps & { readonly catalogHref: string }

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

/** The Grammar state of each step state: the server decides which phases are done, so the position does not. */
const STEP_STATE: Readonly<Record<StepView["state"], StepperStepState>> = {
    done: "complete",
    current: "current",
    later: "upcoming",
}

/** The six steps of the lesson as a stepper: done (check), current (filled), later (muted); each step opens its phase. */
const StepsOf = (props: StudyBodyProps) => {
    const { study, env } = props
    const current = study.stepper.find((step) => step.state === "current")
    return (
        <Stepper
            label={env.labels.nav.stepper}
            steps={study.stepper.map((step) => ({
                id: step.phase,
                label: env.labels.phases[step.phase].title,
                state: STEP_STATE[step.state] ?? "upcoming",
            }))}
            currentStepId={current?.phase ?? ""}
            completeMarker="check"
            size="dense"
            stateLabel={(state) => (state === "complete" ? env.labels.nav.stepStates.done : undefined)}
            onStepSelect={env.on.openPhase}
        />
    )
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
export const bandOf = (props: BandProps): PageHeaderContent => {
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
        ...(study.imageSrc === ""
            ? {}
            : { mark: <Mascot src={study.imageSrc} size="lg" loading="eager" assetSlot={`lesson-step-${study.phase}`} /> }),
        meta: metaOf(props),
        description: <StepsOf study={study} env={env} />,
    }
}
