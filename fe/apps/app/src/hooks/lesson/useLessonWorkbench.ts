"use client"

import { useState } from "react"
import { useLessonAttempts, type LessonAttempts } from "./useLessonAttempts"

/** What useLessonWorkbench answers: the learner drafts per activity, their attempts and the commands that change them. */
export type LessonWorkbench = LessonAttempts & {
    /** The option each choice activity has picked, by activity id. */
    readonly picks: Readonly<Record<string, string>>
    /** The text each written activity holds, by activity id. */
    readonly answers: Readonly<Record<string, string>>
    /** The states each simulation has visited, first to last, by activity id. */
    readonly trails: Readonly<Record<string, ReadonlyArray<string>>>
    /** The actions each simulation has taken, in order, by activity id. */
    readonly actions: Readonly<Record<string, ReadonlyArray<string>>>
    /** The section each phase with several sections has open, by phase id. */
    readonly tabs: Readonly<Record<string, string>>
    readonly pick: (activityId: string, optionId: string) => void
    readonly write: (activityId: string, text: string) => void
    readonly openTab: (phase: string, sectionId: string) => void
    readonly visit: (activityId: string, initialStateId: string, actionId: string, stateId: string) => void
    readonly restart: (activityId: string) => void
}

/** Sets one key of a record held in state. */
const withKey = <T>(record: Readonly<Record<string, T>>, key: string, value: T): Readonly<Record<string, T>> => ({
    ...record,
    [key]: value,
})

/** The learner work in one lesson: the option each choice holds, the text each written activity holds, the trail of each simulation, and the attempts. */
export const useLessonWorkbench = (): LessonWorkbench => {
    const [picks, setPicks] = useState<Readonly<Record<string, string>>>({})
    const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({})
    const [trails, setTrails] = useState<Readonly<Record<string, ReadonlyArray<string>>>>({})
    const [actions, setActions] = useState<Readonly<Record<string, ReadonlyArray<string>>>>({})
    const [tabs, setTabs] = useState<Readonly<Record<string, string>>>({})
    const attempts = useLessonAttempts()
    return {
        ...attempts,
        picks,
        answers,
        trails,
        actions,
        tabs,
        pick: (activityId, optionId) => setPicks((all) => withKey(all, activityId, optionId)),
        write: (activityId, text) => setAnswers((all) => withKey(all, activityId, text)),
        openTab: (phase, sectionId) => setTabs((all) => withKey(all, phase, sectionId)),
        visit: (activityId, initialStateId, actionId, stateId) => {
            setTrails((all) => withKey(all, activityId, [...(all[activityId] ?? [initialStateId]), stateId]))
            setActions((all) => withKey(all, activityId, [...(all[activityId] ?? []), actionId]))
        },
        restart: (activityId) => {
            setTrails((all) => withKey(all, activityId, []))
            setActions((all) => withKey(all, activityId, []))
        },
    }
}
