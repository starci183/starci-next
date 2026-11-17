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
                    infoLabel: t("new.infoLabel"),
                    kindLabel: t("new.kindLabel"),
                    trackLabel: t("new.trackLabel"),
                    howLabel: t("new.howLabel"),
                    howEmpty: t("new.howEmpty"),
                    name: t("new.name"),
                    topic: t("new.topic"),
                    language: t("new.language"),
                    stack: t("new.stack"),
                    repo: t("new.repo"),
                    submit: t("new.submit"),
                    submitting: t("new.submitting"),
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
                    { id: "app", label: t("kind.app"), hint: t("new.kindAppHint") },
                    { id: "agent", label: t("kind.agent"), hint: t("new.kindAgentHint") },
                ],
                tracks: [
                    { id: NO_TRACK, label: t("new.trackNone"), hint: t("new.trackNoneHint") },
                    { id: "claude", label: t("new.trackClaude"), hint: "" },
                    { id: "openclaw", label: t("new.trackOpenclaw"), hint: "" },
                    { id: "hermes", label: t("new.trackHermes"), hint: "" },
                ],
                steps: [
                    { id: "folder", title: t("new.howFolderTitle"), text: t("new.howFolderText") },
                    { id: "cli", title: t("new.howCliTitle"), text: t("new.howCliText") },
                    { id: "secret", title: t("new.howSecretTitle"), text: t("new.howSecretText") },
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
