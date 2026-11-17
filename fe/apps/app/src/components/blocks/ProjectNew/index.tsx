"use client"

import { useTranslations } from "next-intl"
import { NO_TRACK, useProjectNewForm, type ProjectIssue } from "@/hooks/projects"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, projectPath } from "@/modules/routes"
import { ProjectNewBase } from "./component"

type Translate = ReturnType<typeof useTranslations>

/** The words of the refusal of the last create; empty for none. */
const issueWordsOf = (t: Translate, issue: ProjectIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "premiumRequired":
            return t("new.error.premiumRequired")
        case "invalid":
        case "targetRefused":
            return t("new.error.invalid")
        case "deployedMissing":
            return t("new.error.deployed")
        case "rateLimited":
        case "excerptCredential":
        case "limit":
        case "notReady":
        case "invalidLocation":
        case "invalidExplanation":
        case "invalidEndpoint":
        case "coach":
        case "other":
            return t("new.error.other")
    }
}

/** The lines of a catalogue list: only strings are kept. */
const linesOf = (raw: unknown): ReadonlyArray<string> =>
    Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string") : []

/** The connected new-project screen: the form, the create command and the secret shown once. */
export const ProjectNew = () => {
    const t = useTranslations("app.projects")
    const form = useProjectNewForm()
    useDocumentTitle(t("new.title"))
    return (
        <ProjectNewBase
            props={{
                labels: {
                    breadcrumbs: t("new.breadcrumbs"),
                    projects: t("pageTitle"),
                    title: t("new.title"),
                    description: t("new.description"),
                    infoLabel: t("new.infoLabel"),
                    kindLabel: t("new.kindLabel"),
                    trackLabel: t("new.trackLabel"),
                    name: t("new.name"),
                    repo: t("new.repo"),
                    deployed: t("new.deployed"),
                    deployedHint: t("new.deployedHint"),
                    initTitle: t("new.initTitle"),
                    initNote: t("new.initNote"),
                    initLog: linesOf(t.raw("new.initLog")),
                    submit: t("new.submit"),
                    submitting: t("new.submitting"),
                    submitNeedsName: t("new.submitNeedsName"),
                    cancel: t("new.cancel"),
                    createdTitle: t("new.createdTitle"),
                    createdText: t("new.createdText"),
                    secretLabel: t("new.secretLabel"),
                    copy: t("new.copy"),
                    copied: t("new.copied"),
                    openProject: t("new.openProject"),
                },
                projectsHref: APP_ROUTES.projects,
                kinds: [
                    { id: "app", label: t("kind.app") },
                    { id: "agent", label: t("kind.agent") },
                ],
                tracks: [
                    { id: NO_TRACK, label: t("new.trackNone") },
                    { id: "claude", label: t("new.trackClaude") },
                    { id: "openclaw", label: t("new.trackOpenclaw") },
                    { id: "hermes", label: t("new.trackHermes") },
                ],
                state: form.values,
                isCreating: form.isPending,
                issueWords: issueWordsOf(t, form.issue),
                created:
                    form.created === undefined
                        ? undefined
                        : { secret: form.created.ciSecret, href: projectPath(form.created.project.id) },
            }}
            on={{ set: form.set, submit: form.submit }}
        />
    )
}
