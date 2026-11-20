import type { ApplyPartView, ScenarioState, ScenariosPartView, SourcePartView } from "@starci-next/ui"
import type { ChallengeLevel, EssentialPart, EssentialView, LessonView } from "@/modules/types"
import { scenarioPrimaryKindOf } from "./scenarios"
import type { RunDesk, RunWords } from "./words"

/** The primary command of the part on screen, ready for the header: its words, whether it can be pressed and, when not, why. */
export type EssentialPrimary = {
    readonly label: string
    readonly isDisabled: boolean
    readonly isPending: boolean
    /** Why the command is grey (no machine online, the last request failed); empty otherwise. */
    readonly reason: string
    readonly onPress: () => void
}

/** The words of the primary commands. */
export type PrimaryLabels = {
    readonly run: string
    readonly check: string
    readonly next: string
    readonly running: string
    readonly failed: string
    readonly download: string
    /** Why the run command is grey when no machine is online. */
    readonly machineNone: string
    readonly words: Pick<RunWords, "levels" | "applyPrimary">
}

/** What the primary command of Scenarios is built from. */
type ScenariosPrimaryInput = {
    readonly labels: PrimaryLabels
    readonly state: ScenarioState
    readonly machine: string
    readonly isRequesting: boolean
    readonly hasFailed: boolean
    /** The id of the next scenario that is not green, when there is one. */
    readonly nextId: string | undefined
    readonly run: () => void
    readonly goTo: (scenarioId: string) => void
}

/** Why the command of Scenarios is grey: no machine online first, the failed request after. */
const reasonOf = (input: ScenariosPrimaryInput): string => {
    if (input.machine === "") return input.labels.machineNone
    return input.hasFailed ? input.labels.failed : ""
}

/** The primary command of Scenarios: run, check again or the next scenario; grey with its reason when no machine can take it. */
const scenariosPrimaryOf = (input: ScenariosPrimaryInput): EssentialPrimary => {
    const kind = scenarioPrimaryKindOf(input.state, input.nextId !== undefined)
    const isRunning = input.state === "running" || input.isRequesting
    const nextId = input.nextId
    return {
        label: isRunning ? input.labels.running : input.labels[kind],
        isDisabled: isRunning || (kind !== "next" && input.machine === ""),
        isPending: isRunning,
        reason: kind === "next" ? "" : reasonOf(input),
        onPress: () => {
            if (kind === "next" && nextId !== undefined) input.goTo(nextId)
            else input.run()
        },
    }
}

/** What the primary command of Apply is built from. */
type ApplyPrimaryInput = {
    readonly labels: PrimaryLabels
    readonly level: ChallengeLevel
    readonly hasRun: boolean
    readonly command: string
}

/** The primary command of Apply: run the rung (or run it again); it copies the command for the terminal of the learner. */
const applyPrimaryOf = (input: ApplyPrimaryInput): EssentialPrimary => {
    const level = input.labels.words.levels[input.level]
    const words = input.labels.words.applyPrimary
    return {
        label: input.hasRun ? words.rerun(level) : words.run(level),
        isDisabled: false,
        isPending: false,
        reason: "",
        onPress: () => {
            void navigator.clipboard.writeText(input.command)
        },
    }
}

/** The primary command of Source: the archive of the source, or none when the back end serves none. */
const sourcePrimaryOf = (source: SourcePartView, label: string): EssentialPrimary | undefined =>
    source.downloadHref === ""
        ? undefined
        : {
              label,
              isDisabled: false,
              isPending: false,
              reason: "",
              onPress: () => {
                  window.location.assign(source.downloadHref)
              },
          }

/** What the primary command of the part on screen is built from. */
export type PrimaryInput = {
    readonly part: EssentialPart
    readonly lesson: LessonView | undefined
    readonly essential: EssentialView | undefined
    readonly source: SourcePartView
    readonly scenarios: ScenariosPartView
    readonly apply: ApplyPartView
    readonly machine: string
    readonly isRequesting: boolean
    readonly hasFailed: boolean
    readonly labels: PrimaryLabels
    readonly run: (scenarioId: string, guardsOff: ReadonlyArray<string>) => void
    readonly setChosen: (change: (all: RunDesk) => RunDesk) => void
}

/** The primary command of Scenarios for the scenario on screen. */
const scenariosPrimary = (input: PrimaryInput): EssentialPrimary | undefined => {
    const selected = input.scenarios.selected
    if (selected === undefined) return undefined
    return scenariosPrimaryOf({
        labels: input.labels,
        state: selected.state,
        machine: input.machine,
        isRequesting: input.isRequesting,
        hasFailed: input.hasFailed,
        nextId: input.scenarios.rows.find((row) => row.id !== selected.id && row.state !== "passed")?.id,
        run: () => {
            // The scenario that was run stays on screen when its result turns it green.
            input.setChosen((all) => ({ ...all, scenarioId: selected.id }))
            input.run(selected.id, selected.guard?.isOff === true ? [selected.guard.id] : [])
        },
        goTo: (scenarioId) => input.setChosen((all) => ({ ...all, scenarioId })),
    })
}

/** The primary command of Apply for the rung on screen. */
const applyPrimary = (input: PrimaryInput): EssentialPrimary | undefined => {
    const challenge = input.apply.challenge
    const rung = input.essential?.challenges.find((each) => each.id === challenge?.id)
    if (challenge === undefined || rung === undefined || input.lesson === undefined) return undefined
    return applyPrimaryOf({
        labels: input.labels,
        level: rung.level,
        hasRun: challenge.state === "doing" || challenge.state === "passed",
        command: `starci-next run ${input.lesson.id} --challenge ${rung.level}`,
    })
}

/** The primary command of the part on screen, or none for a part that has none. */
export const primaryOf = (input: PrimaryInput): EssentialPrimary | undefined => {
    if (input.part === "source") return sourcePrimaryOf(input.source, input.labels.download)
    if (input.part === "scenarios") return scenariosPrimary(input)
    return input.part === "apply" ? applyPrimary(input) : undefined
}
