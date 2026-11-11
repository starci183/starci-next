"use client"

import { useState } from "react"
import type { ProgressView, SimulationProgressView } from "@/modules/types"
import { useLessonAttempts, type LessonAttempts } from "./useLessonAttempts"

/** One press of a simulation's walk. */
type WalkStep = { readonly actionId: string; readonly toStateId: string; readonly at: string }

/** What useLessonWorkbench answers: the learner drafts per activity, their attempts and the commands that change them. */
export type LessonWorkbench = LessonAttempts & {
    /** The option each choice activity has picked in this visit, by activity id; a saved attempt supplies the rest. */
    readonly picks: Readonly<Record<string, string>>
    /** The text each written activity holds in this visit, by activity id; an apply evidence keeps its two fields as `<id>#output` and `<id>#explanation`. A saved attempt supplies the rest. */
    readonly answers: Readonly<Record<string, string>>
    /** The walk of each simulation in this visit, by activity id; the server's saved walk supplies the rest. */
    readonly walks: Readonly<Record<string, ReadonlyArray<WalkStep>>>
    /** Where the server says the learner stands in each simulation, by activity id. */
    readonly simulations: Readonly<Record<string, SimulationProgressView>>
    /** True once the server has answered the progress, so what it saved can be shown. */
    readonly isRestored: boolean
    /** The section each phase with several sections has open, by phase id. */
    readonly tabs: Readonly<Record<string, string>>
    /** The language of the lab on screen (typescript, java, csharp or go); typescript until the learner picks another. */
    readonly language: string
    readonly pickLanguage: (language: string) => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly write: (activityId: string, text: string) => void
    readonly walk: (activityId: string, steps: ReadonlyArray<WalkStep>) => void
    readonly openTab: (phase: string, sectionId: string) => void
}

/** Sets one key of a record held in state. */
const withKey = <T>(record: Readonly<Record<string, T>>, key: string, value: T): Readonly<Record<string, T>> => ({
    ...record,
    [key]: value,
})

/**
 * The learner work in one lesson: the option each choice holds, the text each written activity holds, the walk of each simulation, and the
 * attempts. `progress` is what the server already holds (the latest attempt of each activity and the saved walks), so a reload loses nothing
 * that was sent.
 */
export const useLessonWorkbench = (progress: ProgressView | undefined): LessonWorkbench => {
    const [picks, setPicks] = useState<Readonly<Record<string, string>>>({})
    const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({})
    const [walks, setWalks] = useState<Readonly<Record<string, ReadonlyArray<WalkStep>>>>({})
    const [tabs, setTabs] = useState<Readonly<Record<string, string>>>({})
    const [language, setLanguage] = useState("typescript")
    const attempts = useLessonAttempts(
        Object.fromEntries((progress?.activities ?? []).map((activity) => [activity.activityId, activity.latest])),
    )
    return {
        ...attempts,
        picks,
        answers,
        walks,
        simulations: Object.fromEntries((progress?.simulations ?? []).map((each) => [each.activityId, each])),
        isRestored: progress !== undefined,
        tabs,
        language,
        pickLanguage: setLanguage,
        pick: (activityId, optionId) => setPicks((all) => withKey(all, activityId, optionId)),
        write: (activityId, text) => setAnswers((all) => withKey(all, activityId, text)),
        walk: (activityId, steps) => setWalks((all) => withKey(all, activityId, steps)),
        openTab: (phase, sectionId) => setTabs((all) => withKey(all, phase, sectionId)),
    }
}
