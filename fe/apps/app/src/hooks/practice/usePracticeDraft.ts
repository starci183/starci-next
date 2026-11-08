"use client"

import { useCallback, useState } from "react"
import { clearDraft, readDraft, readLanguage, writeDraft, writeLanguage } from "@/modules/practice-draft"
import { DEFAULT_PRACTICE_LANGUAGE, type PracticeLanguageId, type PracticeProblemView } from "@/modules/types"
import { languageOf, starterOf } from "./practice.shared"

/** What the learner holds in the editor: the language, its code and the commands that change them. */
export type PracticeDraft = {
    readonly language: PracticeLanguageId
    readonly code: string
    readonly chooseLanguage: (language: PracticeLanguageId) => void
    readonly write: (code: string) => void
    readonly reset: () => void
}

/** The drafts written this visit, by language. */
type Drafts = Readonly<Partial<Record<PracticeLanguageId, string>>>

/**
 * The language and the draft per language of one problem. The draft is the starter code until the learner writes; what they
 * wrote is kept in this browser (a blocked storage costs only that convenience). The browser's copy is read once the problem has
 * arrived, which only happens after hydration, so the first paint never differs from the server's.
 */
export const usePracticeDraft = (slug: string, problem: PracticeProblemView | undefined): PracticeDraft => {
    const [chosen, setChosen] = useState<PracticeLanguageId | undefined>(undefined)
    const [drafts, setDrafts] = useState<Drafts>({})
    const isLoaded = problem !== undefined
    const kept = isLoaded ? languageOf(readLanguage(slug)) : undefined
    const language = chosen ?? kept ?? DEFAULT_PRACTICE_LANGUAGE
    const starter = isLoaded ? starterOf(problem, language) : ""
    const code = drafts[language] ?? (isLoaded ? (readDraft(slug, language) ?? starter) : "")
    const chooseLanguage = useCallback(
        (next: PracticeLanguageId): void => {
            setChosen(next)
            writeLanguage(slug, next)
        },
        [slug],
    )
    const write = useCallback(
        (next: string): void => {
            setDrafts((current) => ({ ...current, [language]: next }))
            writeDraft(slug, language, next)
        },
        [slug, language],
    )
    const reset = useCallback((): void => {
        clearDraft(slug, language)
        setDrafts((current) => ({ ...current, [language]: starter }))
    }, [slug, language, starter])
    return { language, code, chooseLanguage, write, reset }
}
