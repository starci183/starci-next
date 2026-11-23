"use client"

import { useEffect, useState } from "react"
import type { AttemptState } from "@/hooks/lesson"
import type { EssentialPart, LessonView, ScenarioRunView } from "@/modules/types"
import {
    EMPTY_RUN_PARTS,
    primaryOf,
    type EssentialPrimary,
    type RunDesk,
    type RunParts,
} from "@/modules/essential-runs"
import { useEssentialRunLabels, type EssentialRunLabels } from "./useEssentialRunLabels"
import { useRunCommands } from "./useRunCommands"
import { useRunData } from "./useRunData"
import { useRunView } from "./useRunView"

/** What the learner does on the three parts that run on the machine. */
export type EssentialRunActions = {
    readonly selectScenario: (scenarioId: string) => void
    readonly selectChallenge: (challengeId: string) => void
    readonly toggleGuard: (flag: string, isOff: boolean) => void
    readonly revealHint: (scenarioId: string) => void
}

/** The three parts as drawn, their words and the primary command of the one on screen. */
export type EssentialRuns = RunParts & {
    readonly labels: EssentialRunLabels
    readonly primary: EssentialPrimary | undefined
    /** True while the first read of the runs, scores or machines still runs. */
    readonly isLoading: boolean
    /** The newest relayed run of each scenario, as read (the Bản chất flows show them). */
    readonly runs: ReadonlyArray<ScenarioRunView>
    readonly on: EssentialRunActions
}

/** What the lesson page hands the hook. */
type EssentialRunsInput = {
    /** The lesson read; undefined while the first read runs. */
    readonly lesson: LessonView | undefined
    readonly part: EssentialPart
    /** The scenario named by the address, when there is one. */
    readonly scenario: string | undefined
    /** Reads the lesson again (a scenario turned red: the back end then releases its hint). */
    readonly refreshLesson: () => unknown
    /** The attempts of the learner by activity id (the essence checks of the rungs are choice attempts). */
    readonly attempts: Readonly<Record<string, AttemptState>>
    /** The options picked in this visit, by activity id. */
    readonly picks: Readonly<Record<string, string>>
}

/**
 * Source, Scenarios and Apply: the machine, the newest run of each scenario, the score of each rung, the commands that ask the
 * machine to run a scenario or open its hint, and the primary command of the part on screen. Whether a rung is locked or passed
 * is the answer of the back end, never computed here.
 */
export const useEssentialRuns = (input: EssentialRunsInput): EssentialRuns => {
    const labels = useEssentialRunLabels()
    const { lesson, part, refreshLesson } = input
    const essential = lesson?.essential
    const isOpen = essential !== undefined && !essential.lockedParts.includes(part)
    const data = useRunData(lesson?.id ?? "", part, isOpen)
    const commands = useRunCommands(lesson?.id ?? "", data.refreshRuns)
    const [chosen, setChosen] = useState<RunDesk>({ scenarioId: "", challengeId: "", guardsOff: {} })
    // A scenario that just turned red releases its hint on the back end: read the lesson again once per red run.
    const redKey = data.runs
        .filter((run) => run.status === "failed" && run.challengeTier === "")
        .map((run) => `${run.scenarioId}:${run.at}`)
        .join(",")
    useEffect(() => {
        if (redKey !== "") refreshLesson()
    }, [redKey, refreshLesson])
    const view = useRunView({
        lesson,
        essential,
        data,
        chosen,
        scenario: input.scenario,
        revealed: commands.revealed,
        words: labels.words,
        attempts: input.attempts,
        picks: input.picks,
        empty: EMPTY_RUN_PARTS,
    })
    const guard = view.scenarios.selected?.guard
    return {
        labels,
        ...view,
        primary: isOpen
            ? primaryOf({
                  part,
                  lesson,
                  essential,
                  ...view,
                  machine: data.machine,
                  isRequesting: commands.isRequesting,
                  hasFailed: commands.hasFailed,
                  labels: { ...labels.primary, machineNone: labels.scenarios.machineNone, words: labels.words },
                  run: commands.run,
                  setChosen,
              })
            : undefined,
        isLoading: data.isLoading,
        runs: data.runs,
        on: {
            selectScenario: (scenarioId) => setChosen((all) => ({ ...all, scenarioId })),
            selectChallenge: (challengeId) => setChosen((all) => ({ ...all, challengeId })),
            toggleGuard: (flag, isOff) => {
                const selected = view.scenarios.selected
                if (selected !== undefined && guard?.flag === flag)
                    setChosen((all) => ({ ...all, guardsOff: { ...all.guardsOff, [selected.id]: isOff } }))
            },
            revealHint: commands.revealHint,
        },
    }
}
