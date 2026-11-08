"use client"

import { useLocale } from "next-intl"
import { useState } from "react"
import {
    useMutateRotateProjectCiSecretSwr,
    useMutateRunProjectProbesSwr,
    useMutateSyncProjectPracticeSwr,
    useMutateUpdateProjectSwr,
    type RunProjectProbesResult,
} from "@/hooks/swr"
import { projectIssueOf, type ProjectIssue } from "./projects.shared"

/** What the project page lets the learner do, and where each command stands. */
export type ProjectActions = {
    /** The deployed address the learner typed, or undefined while they have not typed. */
    readonly deployedDraft: string | undefined
    readonly setDeployedDraft: (value: string) => void
    readonly saveDeployed: () => void
    readonly runProbes: () => void
    readonly sync: () => void
    readonly rotate: () => void
    readonly isSaving: boolean
    readonly isProbing: boolean
    readonly isSyncing: boolean
    readonly isRotating: boolean
    readonly issue: ProjectIssue
    /** The probe run the last command answered, or undefined. */
    readonly probeRun: RunProjectProbesResult | undefined
    /** The new CI secret, shown once, or undefined. */
    readonly secret: string | undefined
}

/** The commands of one project page, each reading the project again when it settles. */
export const useProjectActions = (projectId: string, onChanged: () => void): ProjectActions => {
    const locale = useLocale()
    const update = useMutateUpdateProjectSwr()
    const probes = useMutateRunProjectProbesSwr()
    const sync = useMutateSyncProjectPracticeSwr()
    const rotate = useMutateRotateProjectCiSecretSwr()
    const [deployedDraft, setDeployedDraft] = useState<string | undefined>(undefined)
    const [issue, setIssue] = useState<ProjectIssue>("none")
    const [probeRun, setProbeRun] = useState<RunProjectProbesResult | undefined>(undefined)
    const [secret, setSecret] = useState<string | undefined>(undefined)
    const settle = (error: unknown): void => {
        setIssue(projectIssueOf(error))
        onChanged()
    }
    return {
        deployedDraft,
        setDeployedDraft,
        saveDeployed: () => {
            setIssue("none")
            update
                .trigger({
                    projectId,
                    name: null,
                    topic: null,
                    language: null,
                    stack: null,
                    repoUrl: null,
                    deployedUrl: deployedDraft ?? null,
                    locale,
                })
                .then(onChanged)
                .catch(settle)
        },
        runProbes: () => {
            setIssue("none")
            probes
                .trigger({ projectId })
                .then((run) => {
                    setProbeRun(run)
                    onChanged()
                })
                .catch(settle)
        },
        sync: () => {
            setIssue("none")
            sync.trigger({ projectId, locale }).then(onChanged).catch(settle)
        },
        rotate: () => {
            setIssue("none")
            rotate
                .trigger({ projectId, locale })
                .then((result) => setSecret(result.ciSecret))
                .catch(settle)
        },
        isSaving: update.isMutating,
        isProbing: probes.isMutating,
        isSyncing: sync.isMutating,
        isRotating: rotate.isMutating,
        issue,
        probeRun,
        secret,
    }
}
