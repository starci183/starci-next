"use client"

import { useLocale } from "next-intl"
import { useState } from "react"
import { useMutateExplainProjectConceptSwr, useMutateSetProjectConceptSwr } from "@/hooks/swr"
import { projectIssueOf, type ProjectIssue } from "./projects.shared"

/** What the learner typed for one concept. */
export type ConceptDraft = {
    readonly location: string
    readonly endpoint: string
    readonly sampleBody: string
    readonly excerpt: string
    readonly explanation: string
}

const EMPTY_DRAFT: ConceptDraft = { location: "", endpoint: "", sampleBody: "", excerpt: "", explanation: "" }

/** What the concept forms of a milestone hold and do. */
export type ConceptForms = {
    /** The draft of a concept; empty before the learner types. */
    readonly draftOf: (conceptId: string) => ConceptDraft
    readonly write: (conceptId: string, key: keyof ConceptDraft, value: string) => void
    readonly savePointer: (conceptId: string) => void
    readonly explain: (conceptId: string) => void
    /** The concept whose command is running, or undefined. */
    readonly pendingId: string | undefined
    /** The concept the last refusal belongs to, or undefined. */
    readonly issueId: string | undefined
    readonly issue: ProjectIssue
}

const orNull = (text: string): string | null => (text.trim() === "" ? null : text)

/** The forms of the concepts of one milestone: the pointer to code and the explanation for the AI teacher. */
export const useConceptForms = (projectId: string, onChanged: () => void): ConceptForms => {
    const locale = useLocale()
    const setConcept = useMutateSetProjectConceptSwr()
    const explainConcept = useMutateExplainProjectConceptSwr()
    const [drafts, setDrafts] = useState<Readonly<Record<string, ConceptDraft>>>({})
    const [issueId, setIssueId] = useState<string | undefined>(undefined)
    const [issue, setIssue] = useState<ProjectIssue>("none")
    const [pendingId, setPendingId] = useState<string | undefined>(undefined)
    const draftOf = (conceptId: string): ConceptDraft => drafts[conceptId] ?? EMPTY_DRAFT
    const run = (conceptId: string, command: () => Promise<unknown>): void => {
        setIssue("none")
        setIssueId(undefined)
        setPendingId(conceptId)
        command()
            .then(onChanged)
            .catch((error: unknown) => {
                setIssue(projectIssueOf(error))
                setIssueId(conceptId)
            })
            .finally(() => setPendingId(undefined))
    }
    return {
        draftOf,
        write: (conceptId, key, value) =>
            setDrafts((current) => ({
                ...current,
                [conceptId]: { ...(current[conceptId] ?? EMPTY_DRAFT), [key]: value },
            })),
        savePointer: (conceptId) => {
            const draft = draftOf(conceptId)
            run(conceptId, () =>
                setConcept.trigger({
                    projectId,
                    conceptId,
                    location: orNull(draft.location),
                    endpoint: orNull(draft.endpoint),
                    sampleBody: orNull(draft.sampleBody),
                    locale,
                }),
            )
        },
        explain: (conceptId) => {
            const draft = draftOf(conceptId)
            run(conceptId, () =>
                explainConcept.trigger({
                    projectId,
                    conceptId,
                    location: draft.location,
                    excerpt: draft.excerpt,
                    explanation: draft.explanation,
                    locale,
                }),
            )
        },
        pendingId,
        issueId,
        issue,
    }
}
