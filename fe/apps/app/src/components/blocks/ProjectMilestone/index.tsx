"use client"

import { useLocale, useTranslations } from "next-intl"
import { isProjectMissing, isProjectPremiumRequired, useConceptForms, type ProjectIssue } from "@/hooks/projects"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryProjectMilestoneSwr, type ProjectMilestoneRead } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, lessonPath, projectPath } from "@/modules/routes"
import { PROJECT_MILESTONE_PLACEHOLDER, ProjectMilestoneBase } from "./component"
import type { ConceptCardView, EvidenceChipView, ProjectMilestoneView } from "./types"

type Translate = ReturnType<typeof useTranslations>
type ConceptRead = ProjectMilestoneRead["concepts"][number]

/** The words of the refusal of the last command; empty for none. */
const issueWordsOf = (t: Translate, issue: ProjectIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "premiumRequired":
            return t("milestone.error.premiumRequired")
        case "excerptCredential":
            return t("milestone.error.excerptSecret")
        case "limit":
            return t("milestone.error.limit")
        case "notReady":
            return t("milestone.error.notReady")
        case "invalidLocation":
            return t("milestone.error.invalidLocation")
        case "invalidExplanation":
            return t("milestone.error.invalidExplanation")
        case "invalidEndpoint":
            return t("milestone.error.invalidEndpoint")
        case "coach":
            return t("milestone.error.coach")
        case "invalid":
        case "targetRefused":
        case "deployedMissing":
        case "rateLimited":
        case "other":
            return t("milestone.error.other")
    }
}

/** The tone of a badge by the state of a concept. */
const stateToneOf = (state: string): ConceptCardView["stateTone"] => {
    if (state === "proved") return "success"
    return state === "practising" ? "warning" : "muted"
}

/** The tone of a chip by the state of its evidence slot. */
const chipToneOf = (state: string): EvidenceChipView["tone"] => {
    if (state === "pass") return "success"
    return state === "fail" ? "warning" : "muted"
}

/** The mark of a chip: whether the latest pass is proof or practice, or empty when nothing passed. */
const chipMarkOf = (t: Translate, slot: ConceptRead["slots"][number]): string => {
    if (slot.state !== "pass") return ""
    return slot.proof ? t("milestone.proofMark") : t("milestone.practiceMark")
}

/** The chips of a concept: one per evidence slot, with its state and whether the latest pass is proof or practice. */
const chipsOf = (t: Translate, concept: ConceptRead): ReadonlyArray<EvidenceChipView> =>
    concept.slots.map((slot) => ({
        id: slot.slot,
        label: t(`milestone.slot.${slot.slot}`),
        state: t(`milestone.slotState.${slot.state}`),
        tone: chipToneOf(slot.state),
        mark: chipMarkOf(t, slot),
    }))

/** The card of one concept, from the read. */
const cardOf = (t: Translate, concept: ConceptRead): ConceptCardView => {
    const lessonHref = concept.lesson === null ? "" : lessonPath(concept.lesson.topicId, concept.lesson.id)
    const relearnLabel = concept.lesson === null ? "" : t("milestone.relearn", { title: concept.lesson.title })
    return {
        id: concept.id,
        label: concept.label,
        stateLabel: t(`milestone.conceptState.${concept.state}`),
        stateTone: stateToneOf(concept.state),
        kindLabel: t(`milestone.kind.${concept.kind}`),
        where: concept.location ?? t("milestone.noWhere"),
        comingSoon: concept.comingSoon,
        chips: chipsOf(t, concept),
        rejection:
            concept.failing === null
                ? undefined
                : {
                      text: t(`reason.${concept.failing.reason}`, {
                          ...Object.fromEntries(concept.failing.facts.map((fact) => [fact.key, fact.value])),
                          placeholder: "{{message}}",
                      }),
                      question: concept.failing.question,
                      relearnLabel: relearnLabel === "" ? t("milestone.relearnPlain") : relearnLabel,
                      relearnHref: lessonHref === "" ? APP_ROUTES.essentials : lessonHref,
                  },
        aiQuestion: concept.aiQuestion ?? "",
        relearnLabel,
        relearnHref: lessonHref,
        needsCodeRead: concept.slots.some((slot) => slot.slot === "code-read"),
    }
}

/** The milestone as it is drawn, from the read. */
const viewOf = (t: Translate, read: ProjectMilestoneRead): ProjectMilestoneView => ({
    title: read.milestone.title,
    projectName: read.project.name,
    intro: t("milestone.intro", { title: read.milestone.title, count: read.milestone.conceptCount }),
    concepts: read.concepts.map((concept) => cardOf(t, concept)),
})

/** What the route hands the milestone block: the segments of the address. */
type ProjectMilestoneProps = { readonly projectId: string; readonly milestoneId: string }

/** The connected milestone screen: the concept checklist with its evidence, and the forms that point at code and ask the AI teacher. */
export const ProjectMilestone = (props: ProjectMilestoneProps) => {
    const t = useTranslations("app.projects")
    const read = useQueryProjectMilestoneSwr({
        projectId: props.projectId,
        milestoneId: props.milestoneId,
        locale: useLocale(),
    })
    const forms = useConceptForms(props.projectId, () => void read.mutate())
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.milestone.title} · ${t("pageTitle")}`)
    return (
        <ProjectMilestoneBase
            props={{
                slot: mapSlot(slotOfSwr(read), (milestone) => viewOf(t, milestone)),
                placeholder: PROJECT_MILESTONE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                isNotFound: isProjectMissing(read.error),
                isLocked: isProjectPremiumRequired(read.error),
                drafts: Object.fromEntries(
                    (read.data?.concepts ?? []).map((concept) => [concept.id, forms.draftOf(concept.id)]),
                ),
                pendingId: forms.pendingId,
                issueId: forms.issueId,
                issueWords: issueWordsOf(t, forms.issue),
                labels: {
                    back: t("milestone.back"),
                    backHref: projectPath(props.projectId),
                    eyebrow: t("pageTitle"),
                    notFound: t("milestone.notFound"),
                    notFoundText: t("milestone.notFoundText"),
                    lockedTitle: t("milestone.locked"),
                    lockedText: t("milestone.lockedText"),
                    plans: t("milestone.plans"),
                    plansHref: APP_ROUTES.premium,
                    conceptsLabel: t("milestone.conceptsLabel"),
                    comingSoon: t("milestone.comingSoon"),
                    questionLabel: t("milestone.questionLabel"),
                    pointerTitle: t("milestone.pointerTitle"),
                    location: t("milestone.location"),
                    endpoint: t("milestone.endpoint"),
                    sampleBody: t("milestone.sampleBody", { placeholder: "{{message}}" }),
                    savePointer: t("milestone.savePointer"),
                    savingPointer: t("milestone.savingPointer"),
                    explainTitle: t("milestone.explainTitle"),
                    explainText: t("milestone.explainText"),
                    excerpt: t("milestone.excerpt"),
                    explanation: t("milestone.explanation"),
                    explain: t("milestone.explain"),
                    explaining: t("milestone.explaining"),
                },
            }}
            on={{
                retry: () => void read.mutate(),
                write: forms.write,
                savePointer: forms.savePointer,
                explain: forms.explain,
            }}
        />
    )
}
