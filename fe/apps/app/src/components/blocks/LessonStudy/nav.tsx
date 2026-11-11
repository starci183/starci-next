import { Button, Cluster } from "@starci/grammar/common"
import type { LessonNavLabels, LessonPhase, NavTarget } from "@/modules/types"

/** What the controls need: where they lead, the words and what the learner does to move between sections. */
type PhaseNavProps = {
    readonly previous: NavTarget | undefined
    readonly next: NavTarget | undefined
    readonly labels: LessonNavLabels
    /** The title of a phase, for the words of the next control. */
    readonly phaseTitle: (phase: LessonPhase) => string
    readonly phase: LessonPhase
    readonly onOpenSection: (phase: string, sectionId: string) => void
}

/** The words of a control from where it leads. */
const wordsOf = (target: NavTarget, side: "previous" | "next", props: PhaseNavProps): string => {
    if (side === "previous") return target.kind === "section" ? props.labels.previousSection : props.labels.previousPhase
    if (target.kind === "section") return props.labels.nextSection(target.index, target.title)
    return target.kind === "lesson" ? props.labels.nextLesson : props.labels.nextPhase(props.phaseTitle(target.phase))
}

/** What one control needs: the controls' props, where it leads and its side. */
type ControlProps = PhaseNavProps & { readonly target: NavTarget; readonly side: "previous" | "next" }

/** One control: a link to another phase or lesson, or a command that opens another section of the page. */
const Control = (props: ControlProps) => {
    const { target, side } = props
    const label = wordsOf(target, side, props)
    const common = side === "next" ? ({ intent: "commit", startGlyph: "arrow-end", width: "wrap" } as const) : ({ intent: "neutral" } as const)
    return target.kind === "section" ? (
        <Button {...common} onPress={() => props.onOpenSection(props.phase, target.id)}>
            {label}
        </Button>
    ) : (
        <Button {...common} href={target.href}>
            {label}
        </Button>
    )
}

/** The end of a phase or of a theory section: "previous" in neutral at the start, the one purple "next" at the end. */
export const PhaseNav = (props: PhaseNavProps) =>
    props.previous === undefined && props.next === undefined ? null : (
        <Cluster gap="inline" justify={props.previous === undefined ? "end" : "between"}>
            {props.previous === undefined ? null : <Control {...props} target={props.previous} side="previous" />}
            {props.next === undefined ? null : <Control {...props} target={props.next} side="next" />}
        </Cluster>
    )
