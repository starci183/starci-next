import type { ExperienceOutput, ExperiencePart, LocalizedLine } from "./career.contracts"
import { CAREER_MESSAGES } from "./messages/career.messages"
import { CareerError, CareerErrorCode } from "./errors/career.error"

/** One item type of data.learning-program.experience-catalog. */
export interface CatalogItem {
    /** The stable id `<part>.<item>`. */
    readonly itemType: string
    /** The learning shard that grants it. */
    readonly part: ExperiencePart
    /** A CV line, or a hiring-readiness signal (decision.program.structure). */
    readonly output: ExperienceOutput
    /** Whether the evidence must belong to a project (an essentials lesson counts only attached to a project). */
    readonly requiresProject: boolean
    /** The slots every template carries. */
    readonly slots: ReadonlyArray<string>
    /** The interview questions the line must survive. */
    readonly defenseQuestions: ReadonlyArray<string>
}

/**
 * The experience catalog: CV lines come only from projects (agent projects included), incidents and essentials lessons
 * attached to a project; coding practice and mock interviews feed hiring readiness; review counts toward the streak only; goals,
 * the profile and CV, and the hiring bridge grant nothing.
 */
export const EXPERIENCE_CATALOG: ReadonlyArray<CatalogItem> = [
    {
        itemType: "essentials.concept-proved",
        part: "essentials",
        output: "cv-line",
        requiresProject: true,
        slots: ["concept", "project", "language", "lesson"],
        defenseQuestions: [],
    },
    {
        itemType: "projects.milestone",
        part: "projects",
        output: "cv-line",
        requiresProject: true,
        slots: ["project", "stack", "concepts", "ci"],
        defenseQuestions: ["Why this design for each concept?", "What breaks without it, and which test shows it?"],
    },
    {
        itemType: "projects.deployed",
        part: "projects",
        output: "cv-line",
        requiresProject: true,
        slots: ["project", "url"],
        defenseQuestions: [],
    },
    {
        itemType: "projects.agent-built",
        part: "projects",
        output: "cv-line",
        requiresProject: true,
        slots: ["project", "tool"],
        defenseQuestions: [],
    },
    {
        itemType: "projects.ai-coding-mindset",
        part: "projects",
        output: "cv-line",
        requiresProject: true,
        slots: ["project", "tool"],
        defenseQuestions: [],
    },
    {
        itemType: "incidents.fixed",
        part: "incidents",
        output: "cv-line",
        requiresProject: false,
        slots: ["bugClass", "lesson", "score"],
        defenseQuestions: [],
    },
    {
        itemType: "practice.pattern-solved",
        part: "practice",
        output: "readiness",
        requiresProject: false,
        slots: ["count", "pattern", "language"],
        defenseQuestions: [],
    },
    {
        itemType: "interview.pass",
        part: "interview",
        output: "readiness",
        requiresProject: false,
        slots: ["tier", "track"],
        defenseQuestions: [],
    },
]

/** The parts that grant items, in the order the screens list them. */
export const EXPERIENCE_PARTS: ReadonlyArray<ExperiencePart> = [
    "essentials",
    "projects",
    "incidents",
    "practice",
    "interview",
]

/**
 * The CV-line template of an item type in both locales, from the career message bundle (`lines.<itemType>`); `<slot>` marks a
 * value filled only from StarCi evidence. A type without both templates is refused, so no line is ever drawn half-translated.
 */
export const templateOf = (itemType: string): LocalizedLine => {
    const key = `lines.${itemType}`
    const vi = CAREER_MESSAGES.vi[key]
    const en = CAREER_MESSAGES.en[key]
    if (vi === undefined || en === undefined) throw new CareerError({ code: CareerErrorCode.ItemTypeUnknown })
    return { vi, en }
}

/** The catalog item of a type; an unknown type is refused, so no producer invents one. */
export const catalogItemOf = (itemType: string): CatalogItem => {
    const item = EXPERIENCE_CATALOG.find((entry) => entry.itemType === itemType)
    if (item === undefined) throw new CareerError({ code: CareerErrorCode.ItemTypeUnknown })
    return item
}
