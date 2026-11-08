"use client"

import { useTranslations } from "next-intl"
import { NO_TRACK, useProjectNewForm, type ProjectIssue } from "@/hooks/projects"
import { useDocumentTitle } from "@/hooks/title"
import { projectPath } from "@/modules/routes"
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
                    eyebrow: t("new.eyebrow"),
                    title: t("new.title"),
                    description: t("new.description"),
                    name: t("new.name"),
                    kind: t("new.kind"),
                    topic: t("new.topic"),
                    language: t("new.language"),
                    stack: t("new.stack"),
                    track: t("new.track"),
                    repo: t("new.repo"),
                    submit: t("new.submit"),
                    submitting: t("new.submitting"),
                    createdTitle: t("new.createdTitle"),
                    createdText: t("new.createdText"),
                    secretLabel: t("new.secretLabel"),
                    copy: t("new.copy"),
                    copied: t("new.copied"),
                    openProject: t("new.openProject"),
                },
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
