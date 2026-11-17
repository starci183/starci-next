"use client"

import { useLocale } from "next-intl"
import { useState } from "react"
import { useMutateCreateProjectSwr, type CreateProjectResult } from "@/hooks/swr"
import { NO_TRACK, projectIssueOf, type ProjectIssue } from "./projects.shared"

/** The fields of the new-project form, as the learner typed them. */
export type ProjectNewValues = {
    readonly name: string
    readonly kind: string
    readonly topic: string
    readonly language: string
    readonly stack: string
    readonly track: string
    readonly repoUrl: string
}

const EMPTY: ProjectNewValues = {
    name: "",
    kind: "app",
    topic: "",
    language: "",
    stack: "",
    track: NO_TRACK,
    repoUrl: "",
}

/** What the new-project form holds and does. */
export type ProjectNewForm = {
    readonly values: ProjectNewValues
    readonly set: (key: keyof ProjectNewValues, value: string) => void
    readonly submit: () => void
    readonly isPending: boolean
    readonly issue: ProjectIssue
    /** The project just created with its CI secret, or undefined before the create. */
    readonly created: CreateProjectResult | undefined
}

/** The state and the create command of the new-project form. */
export const useProjectNewForm = (): ProjectNewForm => {
    const locale = useLocale()
    const create = useMutateCreateProjectSwr()
    const [values, setValues] = useState<ProjectNewValues>(EMPTY)
    const [issue, setIssue] = useState<ProjectIssue>("none")
    const [created, setCreated] = useState<CreateProjectResult | undefined>(undefined)
    const submit = (): void => {
        setIssue("none")
        create
            .trigger({
                name: values.name,
                kind: values.kind === "agent" ? "agent" : "app",
                topic: values.topic,
                language: values.language,
                stack: values.stack,
                track: values.track === NO_TRACK ? null : values.track,
                repoUrl: values.repoUrl.trim() === "" ? null : values.repoUrl,
                locale,
            })
            .then(setCreated)
            .catch((error: unknown) => setIssue(projectIssueOf(error)))
    }
    return {
        values,
        set: (key, value) => setValues((current) => ({ ...current, [key]: value })),
        submit,
        isPending: create.isMutating,
        issue,
        created,
    }
}
