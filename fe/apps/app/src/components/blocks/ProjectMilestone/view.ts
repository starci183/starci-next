import type { useFormatter, useTranslations } from "next-intl"
import type { ProjectIssue } from "@/hooks/projects"
import type { ProjectMilestoneRead } from "@/hooks/swr"
import { APP_ROUTES, lessonPath, projectPath } from "@/modules/routes"
import type {
    ConceptCardView,
    EvidenceChipView,
    EvidenceRunView,
    ProjectMilestoneLabels,
    ProjectMilestoneView,
} from "./types"

type Translate = ReturnType<typeof useTranslations>
type ConceptRead = ProjectMilestoneRead["concepts"][number]
type Formatter = ReturnType<typeof useFormatter>

/** The words of the refusal of the last command; empty for none. */
export const issueWordsOf = (t: Translate, issue: ProjectIssue): string => {
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
    const fallbackHref = lessonHref === "" ? APP_ROUTES.essentials : lessonHref
    const relearnLabel = concept.lesson === null ? "" : t("milestone.relearn", { title: concept.lesson.title })
    return {
        id: concept.id,
        label: concept.label,
        stateLabel: t(`milestone.conceptState.${concept.state}`),
        stateTone: stateToneOf(concept.state),
        kindLabel: t(`milestone.kind.${concept.kind}`),
        proofLine: t("milestone.proofLine", {
            kinds: concept.slots.map((slot) => t(`milestone.proofKind.${slot.slot}`)).join(" · "),
        }),
        lessonHref,
        lessonTitle: concept.lesson?.title ?? "",
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
                      relearnHref: fallbackHref,
                  },
        aiQuestion: concept.aiQuestion ?? "",
        relearnLabel,
        relearnHref: lessonHref,
        needsCodeRead: concept.slots.some((slot) => slot.slot === "code-read"),
    }
}

/** The level of a passing result: proved or practising; empty for a result that did not pass. */
const levelOf = (t: Translate, slot: ConceptRead["slots"][number]): string => {
    if (slot.state !== "pass") return ""
    return t(slot.proof ? "milestone.levelProved" : "milestone.levelPractice")
}

/** The evidence runs of the milestone: one row per slot that has a result. */
const runsOf = (t: Translate, format: Formatter, read: ProjectMilestoneRead): ReadonlyArray<EvidenceRunView> =>
    read.concepts.flatMap((concept) =>
        concept.slots
            .filter((slot) => slot.state !== "pending")
            .map((slot) => ({
                id: `${concept.id}-${slot.slot}`,
                concept: concept.label,
                evidence: t(`milestone.slot.${slot.slot}`),
                resultLabel: t(`milestone.result.${slot.state}`),
                resultTone: chipToneOf(slot.state),
                levelLabel: levelOf(t, slot),
                when: slot.at === null ? "" : format.relativeTime(new Date(slot.at)),
            })),
    )

/** The milestone as it is drawn, from the read. */
export const viewOf = (t: Translate, format: Formatter, read: ProjectMilestoneRead): ProjectMilestoneView => {
    const isDone = read.milestone.conceptCount > 0 && read.milestone.provedCount === read.milestone.conceptCount
    return {
        title: read.milestone.title,
        projectName: read.project.name,
        intro: t("milestone.provedLine", { proved: read.milestone.provedCount, count: read.milestone.conceptCount }),
        stateLabel: t(isDone ? "milestone.stateDone" : "milestone.stateOpen"),
        stateTone: isDone ? "success" : "warning",
        runs: runsOf(t, format, read),
        concepts: read.concepts.map((concept) => cardOf(t, concept)),
    }
}

/** The ordered how-to-prove lines of the aside: only strings of the catalogue list are kept. */
const howOf = (t: Translate): ReadonlyArray<string> => {
    const raw: unknown = t.raw("milestone.how")
    return Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string") : []
}

/** The fixed words of the milestone page, from the catalogue. */
export const labelsOf = (t: Translate, projectId: string): ProjectMilestoneLabels => ({
    back: t("milestone.back"),
    eyebrow: t("pageTitle"),
    notFound: t("milestone.notFound"),
    notFoundText: t("milestone.notFoundText"),
    lockedTitle: t("milestone.locked"),
    lockedText: t("milestone.lockedText"),
    plans: t("milestone.plans"),
    conceptsLabel: t("milestone.conceptsLabel"),
    crumbRoot: t("milestone.crumbRoot"),
    crumbTrail: t("milestone.crumbTrail"),
    editTitle: t("milestone.editTitle"),
    lessonLink: t("milestone.lessonLink"),
    runsLabel: t("milestone.runsLabel"),
    runsEmpty: t("milestone.runsEmpty"),
    runsEmptyText: t("milestone.runsEmptyText"),
    howTitle: t("milestone.howTitle"),
    ciTitle: t("milestone.ciTitle"),
    ciText: t("milestone.ciText"),
    ciLink: t("milestone.ciLink"),
    closeLabel: t("milestone.closeLabel"),
    comingSoon: t("milestone.comingSoon"),
    questionLabel: t("milestone.questionLabel"),
    pointerTitle: t("milestone.pointerTitle"),
    location: t("milestone.location"),
    endpoint: t("milestone.endpoint"),
    savePointer: t("milestone.savePointer"),
    savingPointer: t("milestone.savingPointer"),
    explainTitle: t("milestone.explainTitle"),
    explainText: t("milestone.explainText"),
    excerpt: t("milestone.excerpt"),
    explanation: t("milestone.explanation"),
    explain: t("milestone.explain"),
    explaining: t("milestone.explaining"),
    backHref: projectPath(projectId),
    plansHref: APP_ROUTES.premium,
    crumbRootHref: APP_ROUTES.projects,
    columns: {
        concept: t("milestone.col.concept"),
        evidence: t("milestone.col.evidence"),
        result: t("milestone.col.result"),
        level: t("milestone.col.level"),
        when: t("milestone.col.when"),
    },
    how: howOf(t),
    ciHref: projectPath(projectId),
    sampleBody: t("milestone.sampleBody", { placeholder: "{{message}}" }),
})
