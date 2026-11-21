import { LESSON_PHASES, type StudyView } from "@starci-next/ui"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The fake lesson with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const STUDY_PLACEHOLDER: StudyView = {
    id: "placeholder",
    title: blank(10),
    description: blank(16),
    category: blank(6),
    topic: { id: "placeholder", title: blank(6), href: "/" },
    difficulty: "foundation",
    difficultyLabel: blank(6),
    facts: blank(8),
    isPremium: true,
    phase: "challenge",
    isLocked: false,
    rail: LESSON_PHASES.map((phase) => ({ phase, href: "/", isCurrent: false, isLocked: false })),
    overview: { outcomes: [], prerequisites: [], scope: "", references: [] },
    tabs: [],
    openTabId: "",
    outcomes: [],
    compare: [],
    compareScore: "",
    headline: blank(10),
    stepper: LESSON_PHASES.filter((phase) => phase !== "overview" && phase !== "review").map((phase) => ({
        phase,
        href: "/",
        state: "later" as const,
        isLocked: false,
    })),
    sectionIndex: 0,
    sectionCount: 0,
    previous: undefined,
    next: undefined,
    phaseResults: [],
    sectionChecks: [],
    completedAt: "",
    completedTime: "",
    reviews: [],
    cards: [{ kind: "reading", id: "placeholder", title: blank(10), markdown: "" }],
}
